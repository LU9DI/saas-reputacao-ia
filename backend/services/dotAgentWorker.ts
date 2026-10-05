import { getDb } from '../lib/db.js';
import { runCurrentDotMissionStep } from './dotAgentMissionRunner.js';
import { createDotAgentGoal, listDotAgentGoals } from './dotAgent.js';
import { createMissionForGoal } from './dotAgentMissions.js';
import { ensureDotDecisionSchema } from './dotDecision.js';

let timer: NodeJS.Timeout | null = null;
let running = false;
let tickInFlight: Promise<void> | null = null;

async function ensureAutonomousMissions(db: any) {
  const decisions = await db.all("SELECT empresa_id, id FROM dot_decisions WHERE status IN ('pending','prepared','approved') ORDER BY id DESC LIMIT 100");
  for (const decision of decisions || []) {
    const empresaId = String(decision.empresa_id);
    const goals = await listDotAgentGoals(empresaId);
    let goal = goals.find((item) => item.status === 'active');
    if (!goal) goal = await createDotAgentGoal(empresaId, { title: 'Proteger e acelerar o crescimento da empresa', description: 'Objetivo operacional criado automaticamente pelo DOT para transformar sinais reais em investigação, ação e acompanhamento.', source: 'dot_autonomous' });
    const title = `Atuar sobre o sinal prioritário #${decision.id}`;
    const existingMission = await db.get('SELECT id FROM dot_agent_missions WHERE empresa_id=? AND goal_id=? AND title=? LIMIT 1', [empresaId, goal.id, title]);
    if (!existingMission) await createMissionForGoal(empresaId, goal.id, title);
  }
}

async function runTick() {
  if (running) return;
  running = true;
  try {
    const db = getDb();
    await ensureDotDecisionSchema();
    await ensureAutonomousMissions(db);
    const missions = await db.all(
      "SELECT id, empresa_id FROM dot_agent_missions WHERE status IN ('planned','working') ORDER BY updated_at ASC LIMIT 25",
    );

    for (const mission of missions || []) {
      try {
        // Uma rodada pode atravessar várias etapas determinísticas da mesma missão.
        // Paramos imediatamente quando a missão pede aprovação ou não avança mais.
        for (let step = 0; step < 6; step += 1) {
          const result = await runCurrentDotMissionStep(String(mission.empresa_id), Number(mission.id));
          if (!result) break;
          if (result.blocked) {
            console.log(`🤖 DOT agente: missão ${mission.id} aguardando aprovação.`);
            break;
          }
          const state = result.mission;
          if (!state || ['completed', 'waiting_approval', 'paused'].includes(String(state.status))) break;
          if (Number(state.current_step ?? -1) >= Number(state.total_steps ?? 6)) break;
        }
      } catch (error: any) {
        console.warn(`DOT agente: falha na missão ${mission.id}:`, error?.message || error);
      }
    }
  } finally {
    running = false;
  }
}

export function startDotAgentWorker() {
  if (process.env.DOT_AGENT_WORKER_ENABLED !== '1') return;
  if (timer) return;

  const intervalMs = Math.max(60_000, Number(process.env.DOT_AGENT_WORKER_INTERVAL_MS || 300_000));

  void runTick();
  timer = setInterval(() => void runTick(), intervalMs);
  timer.unref();
  console.log(`🤖 DOT agente em background: intervalo ${Math.round(intervalMs / 60000)} min.`);
}

export function wakeDotAgentWorker() {
  const enabled = process.env.DOT_AGENT_WORKER_ENABLED === '0' ? false : process.env.NODE_ENV === 'production' || process.env.DOT_AGENT_WORKER_ENABLED === '1';
  if (!enabled) return;
  if (tickInFlight) return tickInFlight;
  tickInFlight = runTick().finally(() => {
    tickInFlight = null;
  });
  return tickInFlight;
}

export function stopDotAgentWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
