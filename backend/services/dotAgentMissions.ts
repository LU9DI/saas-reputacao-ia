import { getDb } from '../lib/db.js';

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

async function ensureMissionTables() {
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
  const now = new Date().toISOString();
  const existing = await db.get(
    "SELECT * FROM dot_agent_missions WHERE goal_id=? AND empresa_id=? AND status IN ('planned','working','waiting_approval') ORDER BY id DESC LIMIT 1",
    [goalId, empresaId],
  );
  if (existing) return row(existing);

  const now = new Date().toISOString();
  const result = await db.run(
    'INSERT INTO dot_agent_missions (goal_id,empresa_id,title,status,current_step,total_steps,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
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

  await db.run(
    'UPDATE dot_agent_missions SET current_step=?,status=?,updated_at=? WHERE id=? AND empresa_id=?',
    [next, status, now, id, empresaId],
  );
  return row(await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]));
}
