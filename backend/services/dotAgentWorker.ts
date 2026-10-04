import { getDb } from '../lib/db.js';
import { runCurrentDotMissionStep } from './dotAgentMissionRunner.js';

let timer: NodeJS.Timeout | null = null;
let running = false;

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
          const result = await runCurrentDotMissionStep(String(mission.empresa_id), Number(mission.id));
          if (result?.blocked) console.log(`🤖 DOT agente: missão ${mission.id} aguardando aprovação.`);
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

export function stopDotAgentWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
