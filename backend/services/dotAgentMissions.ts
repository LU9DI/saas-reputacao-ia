import { getDb } from '../lib/db.js';
import { createDecisionsForEvents } from './dotDecision.js';
import { prepareDotActionFromDecision } from './dotActionQueue.js';

export type DotAgentMission = {
  id: number;
  goal_id: number;
  empresa_id: string;
  title: string;
  status: 'planned' | 'working' | 'waiting_approval' | 'completed' | 'paused';
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
};

export type DotAgentMissionStep = {
  id: number;
  mission_id: number;
  type: 'observe' | 'investigate' | 'recommend' | 'prepare' | 'approval' | 'result';
  status: 'pending' | 'working' | 'completed' | 'waiting_approval';
  title: string;
  output: string | null;
  created_at: string;
  completed_at: string | null;
};

export async function ensureMissionTables() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    empresa_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    current_step INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_dot_agent_missions_empresa
    ON dot_agent_missions (empresa_id, status, updated_at)`);
  const missionColumns = await db.all('PRAGMA table_info(dot_agent_missions)');
  if (!(missionColumns || []).some((column: any) => column.name === 'approval_action_id')) {
    await db.exec('ALTER TABLE dot_agent_missions ADD COLUMN approval_action_id INTEGER');
  }
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_mission_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    empresa_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    title TEXT NOT NULL,
    output TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  )`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_dot_agent_mission_steps_mission
    ON dot_agent_mission_steps (empresa_id, mission_id, id)`);
}

const missionApprovalLocks = new Map<string, Promise<number | null>>();

async function ensureMissionApprovalAction(empresaId: string, missionId: number, title: string): Promise<number | null> {
  const key = empresaId + ':' + missionId;
  const previous = missionApprovalLocks.get(key);
  if (previous) return previous;

  let release!: (value: number | null) => void;
  const current = new Promise<number | null>((resolve) => { release = resolve; });
  missionApprovalLocks.set(key, current);

  try {
    const db = getDb();
    const mission = await db.get(
      'SELECT approval_action_id FROM dot_agent_missions WHERE id=? AND empresa_id=? LIMIT 1',
      [missionId, empresaId],
    );
    if (mission?.approval_action_id) return Number(mission.approval_action_id);

    await db.exec(`CREATE TABLE IF NOT EXISTS dot_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      acknowledged_at TEXT
    )`);

    const eventTitle = 'Aprovação necessária para missão DOT #' + missionId;
    let event = await db.get(
      'SELECT id FROM dot_events WHERE empresa_id=? AND type=? AND title=? LIMIT 1',
      [empresaId, 'dot_mission_approval', eventTitle],
    );
    if (!event) {
      const inserted = await db.run(
        'INSERT INTO dot_events (empresa_id,type,severity,title,details,created_at) VALUES (?,?,?,?,?,?) RETURNING id',
        [
          empresaId,
          'dot_mission_approval',
          'warning',
          eventTitle,
          'A missão "' + String(title || '').slice(0, 180) + '" chegou ao ponto em que o DOT precisa de uma aprovação explícita antes de prosseguir.',
          new Date().toISOString(),
        ],
      );
      event = { id: inserted.lastID };
    }

    let decision = await db.get(
      'SELECT id, options_json FROM dot_decisions WHERE empresa_id=? AND event_id=? LIMIT 1',
      [empresaId, Number(event.id)],
    );
    if (!decision) {
      const created = await createDecisionsForEvents(empresaId, [{ id: Number(event.id), type: 'dot_mission_approval', severity: 'warning', title: eventTitle, details: 'Aprovação explícita para continuar a missão DOT.' }]);
      decision = created[0] ? { id: created[0].id, options_json: JSON.stringify(created[0].options || []) } : null;
    }
    if (!decision?.id) return null;

    const existingAction = await db.get(
      "SELECT id FROM dot_action_queue WHERE empresa_id=? AND decision_id=? AND status IN ('prepared','approved','executing') LIMIT 1",
      [empresaId, Number(decision.id)],
    );
    let actionId = existingAction?.id ? Number(existingAction.id) : null;
    if (!actionId) {
      const prepared = await prepareDotActionFromDecision(empresaId, Number(decision.id), 'opcao_1');
      actionId = prepared?.id ? Number(prepared.id) : null;
    }
    if (!actionId) return null;

    await db.run(
      'UPDATE dot_agent_missions SET approval_action_id=?, status=?, updated_at=? WHERE id=? AND empresa_id=? AND approval_action_id IS NULL',
      [actionId, 'waiting_approval', new Date().toISOString(), missionId, empresaId],
    );
    release(actionId);
    return actionId;
  } catch {
    release(null);
    return null;
  } finally {
    if (missionApprovalLocks.get(key) === current) missionApprovalLocks.delete(key);
  }
}

function row(row: any): DotAgentMission {
  return {
    id: Number(row.id), goal_id: Number(row.goal_id), empresa_id: String(row.empresa_id),
    title: String(row.title), status: String(row.status) as DotAgentMission['status'],
    current_step: Number(row.current_step || 0), total_steps: Number(row.total_steps || 3),
    created_at: String(row.created_at), updated_at: String(row.updated_at),
  };
}

export async function listDotAgentMissions(empresaId: string) {
  await ensureMissionTables();
  const db = getDb();
  const rows = await db.all(
    'SELECT * FROM dot_agent_missions WHERE empresa_id=? ORDER BY updated_at DESC LIMIT 20',
    [empresaId],
  );
  return rows.map(row);
}

export async function createMissionForGoal(empresaId: string, goalId: number, title: string) {
  await ensureMissionTables();
  const db = getDb();
  const goal = await db.get('SELECT id FROM dot_agent_goals WHERE id=? AND empresa_id=?', [goalId, empresaId]);
  if (!goal) return null;
  const existing = await db.get(
    "SELECT * FROM dot_agent_missions WHERE goal_id=? AND empresa_id=? AND status IN ('planned','working','waiting_approval') ORDER BY id DESC LIMIT 1",
    [goalId, empresaId],
  );
  if (existing) return row(existing);

  const now = new Date().toISOString();
  const result = await db.run(
    'INSERT INTO dot_agent_missions (goal_id,empresa_id,title,status,current_step,total_steps,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) RETURNING id',
    [goalId, empresaId, title.slice(0, 180), 'planned', 0, 6, now, now],
  );
  const id = Number(result?.lastID ?? result?.lastInsertRowid ?? result?.id);
  const stepTitles = [
    ['observe', 'Observar o contexto disponível'],
    ['investigate', 'Investigar o que está impedindo o objetivo'],
    ['recommend', 'Recomendar o próximo caminho'],
    ['prepare', 'Preparar o trabalho necessário'],
    ['approval', 'Aguardar aprovação quando necessário'],
    ['result', 'Acompanhar o resultado'],
  ] as const;
  for (const [type, stepTitle] of stepTitles) {
    await db.run(
      'INSERT INTO dot_agent_mission_steps (mission_id,empresa_id,type,status,title,created_at) VALUES (?,?,?,?,?,?)',
      [id, empresaId, type, 'pending', stepTitle, now],
    );
  }
  const created = await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]);
  return created ? row(created) : null;
}

export async function listDotAgentMissionSteps(empresaId: string, missionId: number) {
  await ensureMissionTables();
  const db = getDb();
  const rows = await db.all(
    'SELECT id,mission_id,type,status,title,output,created_at,completed_at FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC',
    [missionId, empresaId],
  );
  return rows || [];
}

export async function advanceMission(empresaId: string, id: number, output?: string) {
  await ensureMissionTables();
  const db = getDb();
  const mission = await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]);
  if (!mission) return null;

  const current = Number(mission.current_step || 0);
  const total = Number(mission.total_steps || 6);
  const now = new Date().toISOString();

  const currentStep = await db.get(
    'SELECT id,type,status FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC LIMIT 1 OFFSET ?',
    [id, empresaId, current],
  );

  // A etapa de aprovação é uma barreira de segurança, não apenas um estado de UI.
  // Ninguém pode avançar manualmente enquanto a ação vinculada não estiver aprovada.
  if (currentStep?.type === 'approval') {
    const approvalActionId = Number(mission.approval_action_id || 0);
    if (!approvalActionId) {
      throw new Error('Aprovação explícita é obrigatória antes de avançar a missão.');
    }
    const approved = await db.get(
      "SELECT id FROM dot_action_queue WHERE id=? AND empresa_id=? AND status='approved' LIMIT 1",
      [approvalActionId, empresaId],
    );
    if (!approved) {
      throw new Error('Aprovação explícita é obrigatória antes de avançar a missão.');
    }
  }

  if (current > 0) {
    await db.run(
      "UPDATE dot_agent_mission_steps SET status='completed', output=COALESCE(?, output), completed_at=? WHERE mission_id=? AND empresa_id=? AND id=(SELECT id FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC LIMIT 1 OFFSET ?)",
      [output?.trim().slice(0, 4000) || null, now, id, empresaId, id, empresaId, current - 1],
    );
  }

  const next = Math.min(current + 1, total);
  const step = await db.get(
    'SELECT id,type,title FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC LIMIT 1 OFFSET ?',
    [id, empresaId, next - 1],
  );

  let status: DotAgentMission['status'] = 'working';
  let stepStatus = 'working';
  if (next >= total) {
    status = 'completed';
    stepStatus = 'completed';
  } else if (step?.type === 'approval') {
    status = 'waiting_approval';
    stepStatus = 'waiting_approval';
  }

  if (step?.id) {
    await db.run('UPDATE dot_agent_mission_steps SET status=? WHERE id=? AND empresa_id=?', [stepStatus, step.id, empresaId]);
  }

  let approvalActionId = Number(mission.approval_action_id || 0) || null;
  if (step?.type === 'approval' && !approvalActionId) {
    approvalActionId = await ensureMissionApprovalAction(empresaId, id, String(mission.title || ''));
    if (approvalActionId) status = 'waiting_approval';
  }

  await db.run(
    'UPDATE dot_agent_missions SET current_step=?,status=?,approval_action_id=?,updated_at=? WHERE id=? AND empresa_id=?',
    [next, status, approvalActionId, now, id, empresaId],
  );
  return row(await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]));
}
