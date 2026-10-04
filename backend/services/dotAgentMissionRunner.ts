import { getDb } from '../lib/db.js';
import { runDotMonitor } from './dotMonitor.js';
import { createDotFollowUp } from './dotFollowUp.js';
import { advanceMission } from './dotAgentMissions.js';

export async function runCurrentDotMissionStep(empresaId: string, missionId: number) {
  const db = getDb();
  const mission = await db.get(
    'SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?',
    [missionId, empresaId],
  );
  if (!mission) return null;

  const current = Number(mission.current_step || 0);
  const total = Number(mission.total_steps || 6);
  if (current >= total) return { mission, blocked: false, output: 'Missão concluída.' };

  const step = await db.get(
    'SELECT * FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC LIMIT 1 OFFSET ?',
    [missionId, empresaId, current],
  );
  if (!step) return null;

  let output = '';

  if (step.type === 'observe') {
    const result = await runDotMonitor(empresaId);
    output = result.skipped
      ? 'O monitoramento está pausado pelas preferências da empresa.'
      : `Observei o contexto: ${result.events?.length || 0} sinal(is), ${result.decisions?.length || 0} decisão(ões) e ${result.prepared_actions?.length || 0} ação(ões) preparada(s).`;
  } else if (step.type === 'investigate') {
    const events = await db.all(
      'SELECT title,severity,details FROM dot_events WHERE empresa_id=? ORDER BY id DESC LIMIT 5',
      [empresaId],
    );
    const latest = events?.[0];
    output = latest
      ? `Investiguei os sinais recentes. O principal é "${latest.title}" (${latest.severity}): ${latest.details}`
      : 'Investiguei os sinais recentes e não encontrei um evento persistido suficiente para priorização.';
  } else if (step.type === 'recommend') {
    const decision = await db.get(
      "SELECT recommendation,priority FROM dot_decisions WHERE empresa_id=? AND status IN ('pending','prepared','approved') ORDER BY id DESC LIMIT 1",
      [empresaId],
    );
    output = decision
      ? `Recomendação encontrada: ${decision.recommendation} Prioridade ${decision.priority}.`
      : 'Não existe decisão persistida suficiente para uma recomendação operacional.';
  } else if (step.type === 'prepare') {
    const action = await db.get(
      "SELECT id,action,status FROM dot_action_queue WHERE empresa_id=? AND status IN ('prepared','approved') ORDER BY id DESC LIMIT 1",
      [empresaId],
    );
    output = action
      ? `Encontrei a ação "${action.action}", atualmente ${action.status === 'approved' ? 'aprovada' : 'preparada para aprovação'}.`
      : 'Não há ação externa preparada. O DOT não inventará uma capacidade de execução.';
  } else if (step.type === 'approval') {
    const action = await db.get(
      "SELECT id,action FROM dot_action_queue WHERE empresa_id=? AND status='prepared' ORDER BY id DESC LIMIT 1",
      [empresaId],
    );
    if (action) {
      await db.run(
        "UPDATE dot_agent_missions SET status='waiting_approval',approval_action_id=?,updated_at=? WHERE id=? AND empresa_id=?",
        [Number(action.id), new Date().toISOString(), missionId, empresaId],
      );
      await db.run(
        "UPDATE dot_agent_mission_steps SET status='waiting_approval',output=? WHERE id=? AND empresa_id=?",
        [`Aguardando sua aprovação para "${action.action}".`, step.id, empresaId],
      );
      return {
        mission: await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [missionId, empresaId]),
        blocked: true,
        output: `Aguardando sua aprovação para "${action.action}".`,
      };
    }
    output = 'Não há ação pendente de aprovação; posso seguir para acompanhamento.';
  } else if (step.type === 'result') {
    const followup = await db.get(
      "SELECT id,status,outcome FROM dot_followups WHERE empresa_id=? ORDER BY id DESC LIMIT 1",
      [empresaId],
    );
    if (followup) {
      output = followup.status === 'completed'
        ? `Resultado acompanhado: ${followup.outcome || 'concluído'}.`
        : 'O acompanhamento continua pendente.';
    } else {
      const approved = await db.get(
        "SELECT id,decision_id,action FROM dot_action_queue WHERE empresa_id=? AND status='approved' ORDER BY id DESC LIMIT 1",
        [empresaId],
      );
      if (approved) {
        const created = await createDotFollowUp(empresaId, Number(approved.decision_id), Number(approved.id), 24);
        output = created
          ? 'Criei acompanhamento de 24 horas para medir o resultado da ação aprovada.'
          : 'Não foi possível criar o acompanhamento.';
      } else {
        output = 'Ainda não existe uma ação aprovada com resultado mensurável.';
      }
    }
  }

  const advanced = await advanceMission(empresaId, missionId, output);
  return { mission: advanced, blocked: false, output };
}
