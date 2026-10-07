import { getDb } from '../lib/db.js';
import { getDotAgentWorkspace } from './dotAgent.js';
import { ensureDotPlanSchema } from './dotAgentPlan.js';
import { runDotAgent } from './dotAgentRuntime.js';

let timer: NodeJS.Timeout | null = null;
let running = false;
let wakeInFlight: Promise<void> | null = null;

async function runTick() {
  if (running) return;
  running = true;
  try {
    await ensureDotPlanSchema();
    const db = getDb();
    // O worker agora recupera planos persistentes do runtime agentivo.
    // Missões legadas não são mais a fonte de verdade da execução.
    const plans = await db.all(
      "SELECT id, empresa_id, actor_user_id, session_id, objective, status FROM dot_agent_plans WHERE status IN ('working','paused') ORDER BY updated_at ASC LIMIT 25",
    );

    for (const plan of plans || []) {
      try {
        const status = String(plan.status);
        // Planos pausados por limite operacional podem continuar automaticamente.
        // Planos em working são recuperados após crash/restart; o lock impede duplicidade.
        const result = await runDotAgent({
          empresaId: String(plan.empresa_id),
          actorUserId: String(plan.actor_user_id),
          sessionId: String(plan.session_id),
          objective: String(plan.objective),
          context: JSON.stringify(await getDotAgentWorkspace(String(plan.empresa_id))),
          history: '',
          maxTokens: Math.max(600, Number(process.env.DOT_DELEGATION_MAX_TOKENS || 900)),
          allowTools: true,
          planId: String(plan.id),
          approvalGranted: false,
        });

        if (result.stopped_reason === 'already_running') continue;
        if (status === 'paused') {
          console.log(`🤖 DOT agente: plano ${plan.id} retomado automaticamente.`);
        }
      } catch (error: any) {
        console.warn(`DOT agente: falha na recuperação do plano ${plan.id}:`, error?.message || error);
      }
    }
  } finally {
    running = false;
  }
}

export function startDotAgentWorker() {
  if (process.env.DOT_AGENT_WORKER_ENABLED === '0') return;
  if (timer) return;

  const intervalMs = Math.max(60_000, Number(process.env.DOT_AGENT_WORKER_INTERVAL_MS || 300_000));

  void runTick();
  timer = setInterval(() => void runTick(), intervalMs);
  timer.unref();
  console.log(`🤖 DOT agente em background: intervalo ${Math.round(intervalMs / 60000)} min.`);
}

export function wakeDotAgentWorker() {
  if (process.env.DOT_AGENT_WORKER_ENABLED === '0') return;
  if (wakeInFlight) return wakeInFlight;
  wakeInFlight = runTick().finally(() => {
    wakeInFlight = null;
  });
  return wakeInFlight;
}

export function stopDotAgentWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
