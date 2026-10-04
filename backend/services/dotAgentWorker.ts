import { getDb } from '../lib/db.js';
import { runCurrentDotMissionStep } from './dotAgentMissionRunner.js';

let timer: NodeJS.Timeout | null = null;
let running = false;
let tickInFlight: Promise<void> | null = null;

export function startDotAgentWorker() {
  if (process.env.DOT_AGENT_WORKER_ENABLED !== '1') return;
  if (timer) return;

  const intervalMs = Math.max(60_000, Number(process.env.DOT_AGENT_WORKER_INTERVAL_MS || 900_000));

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const db = getDb();
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
            if (!state || state.status === 'completed' || state.status === 'waiting_approval' || state.status === 'paused') break;
            if (Number(state.current_step ?? -1) >= Number(state.total_steps ?? 6)) break;
          }
        } catch (error: any) {
          console.warn(`DOT agente: falha na missão ${mission.id}:`, error?.message || error);
        }
      }
    } finally {
      running = false;
    }
  };

  void tick();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  console.log(`🤖 DOT agente em background: intervalo ${Math.round(intervalMs / 60000)} min.`);
}

export function wakeDotAgentWorker() {
  if (process.env.DOT_AGENT_WORKER_ENABLED !== '1') return;
  if (tickInFlight) return tickInFlight;
  // O worker principal continua sendo o loop periódico; o wake-up reduz a latência
  // quando uma nova missão acaba de ser criada sem duplicar execuções concorrentes.
  tickInFlight = (async () => {
    if (running) return;
    running = true;
    try {
      const db = getDb();
      const missions = await db.all(
        "SELECT id, empresa_id FROM dot_agent_missions WHERE status IN ('planned','working') ORDER BY updated_at ASC LIMIT 25",
      );
      for (const mission of missions || []) {
        try {
          for (let step = 0; step < 6; step += 1) {
            const result = await runCurrentDotMissionStep(String(mission.empresa_id), Number(mission.id));
            if (!result || result.blocked) break;
            const state = result.mission;
            if (!state || ['completed','waiting_approval','paused'].includes(String(state.status))) break;
            if (Number(state.current_step ?? -1) >= Number(state.total_steps ?? 6)) break;
          }
        } catch (error: any) {
          console.warn(`DOT agente: falha na missão ${mission.id}:`, error?.message || error);
        }
      }
    } finally {
      running = false;
    }
  })().finally(() => { tickInFlight = null; });
  return tickInFlight;
}

export function stopDotAgentWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
