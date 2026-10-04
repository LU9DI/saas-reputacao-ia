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
  const result = await db.run(
    'INSERT INTO dot_agent_missions (goal_id,empresa_id,title,status,current_step,total_steps,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
    [goalId, empresaId, title.slice(0, 180), 'planned', 0, 3, now, now],
  );
  const id = Number(result?.lastID ?? result?.lastInsertRowid ?? result?.id);
  const created = await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]);
  return created ? row(created) : null;
}

export async function advanceMission(empresaId: string, id: number) {
  await ensureMissionTables();
  const db = getDb();
  const mission = await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]);
  if (!mission) return null;
  const next = Math.min(Number(mission.current_step || 0) + 1, Number(mission.total_steps || 3));
  const status = next >= Number(mission.total_steps || 3) ? 'completed' : 'working';
  const now = new Date().toISOString();
  await db.run('UPDATE dot_agent_missions SET current_step=?,status=?,updated_at=? WHERE id=? AND empresa_id=?', [next, status, now, id, empresaId]);
  return row(await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?', [id, empresaId]));
}
