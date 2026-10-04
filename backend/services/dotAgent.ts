import { getDb } from '../lib/db.js';

export type DotAgentGoalStatus = 'active' | 'paused' | 'completed' | 'archived';

export type DotAgentGoal = {
  id: number;
  empresa_id: string;
  title: string;
  description: string;
  status: DotAgentGoalStatus;
  progress: number;
  source: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
};

async function ensureAgentTables() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_activity_at TEXT
  )`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_dot_agent_goals_empresa_status
    ON dot_agent_goals (empresa_id, status, updated_at)`);
}

function clampProgress(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function rowToGoal(row: any): DotAgentGoal {
  return {
    id: Number(row.id),
    empresa_id: String(row.empresa_id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    status: String(row.status || 'active') as DotAgentGoalStatus,
    progress: clampProgress(row.progress),
    source: String(row.source || 'user'),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    last_activity_at: row.last_activity_at ? String(row.last_activity_at) : null,
  };
}

export async function listDotAgentGoals(empresaId: string) {
  await ensureAgentTables();
  const db = getDb();
  const rows = await db.all(
    'SELECT id,empresa_id,title,description,status,progress,source,created_at,updated_at,last_activity_at FROM dot_agent_goals WHERE empresa_id=? AND status <> ? ORDER BY CASE status WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END, updated_at DESC LIMIT 20',
    [empresaId, 'archived', 'active', 'paused'],
  );
  return rows.map(rowToGoal);
}

export async function createDotAgentGoal(
  empresaId: string,
  input: { title?: unknown; description?: unknown; source?: unknown },
) {
  await ensureAgentTables();
  const title = String(input.title || '').trim().slice(0, 180);
  const description = String(input.description || '').trim().slice(0, 1000);
  if (title.length < 3) throw new Error('O objetivo precisa ter pelo menos 3 caracteres.');
  const source = String(input.source || 'user').trim().slice(0, 40) || 'user';
  const now = new Date().toISOString();
  const db = getDb();
  const result = await db.run(
    'INSERT INTO dot_agent_goals (empresa_id,title,description,status,progress,source,created_at,updated_at,last_activity_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [empresaId, title, description, 'active', 0, source, now, now, now],
  );
  const id = Number(result?.lastID ?? result?.lastInsertRowid ?? result?.id);
  const row = await db.get(
    'SELECT id,empresa_id,title,description,status,progress,source,created_at,updated_at,last_activity_at FROM dot_agent_goals WHERE id=? AND empresa_id=?',
    [id, empresaId],
  );
  if (!row) throw new Error('Não foi possível criar o objetivo do DOT.');
  return rowToGoal(row);
}

export async function updateDotAgentGoal(
  empresaId: string,
  id: number,
  patch: { status?: unknown; progress?: unknown },
) {
  await ensureAgentTables();
  const db = getDb();
  const row = await db.get('SELECT * FROM dot_agent_goals WHERE id=? AND empresa_id=?', [id, empresaId]);
  if (!row) return null;

  const status = patch.status == null ? String(row.status) : String(patch.status);
  const allowed = new Set(['active', 'paused', 'completed', 'archived']);
  if (!allowed.has(status)) throw new Error('Status de objetivo inválido.');

  const progress = patch.progress == null ? clampProgress(row.progress) : clampProgress(patch.progress);
  const now = new Date().toISOString();
  await db.run(
    'UPDATE dot_agent_goals SET status=?,progress=?,updated_at=?,last_activity_at=? WHERE id=? AND empresa_id=?',
    [status, progress, now, now, id, empresaId],
  );
  const updated = await db.get('SELECT * FROM dot_agent_goals WHERE id=? AND empresa_id=?', [id, empresaId]);
  return updated ? rowToGoal(updated) : null;
}

export async function getDotAgentWorkspace(empresaId: string) {
  const goals = await listDotAgentGoals(empresaId);
  const active = goals.filter((goal) => goal.status === 'active');
  const paused = goals.filter((goal) => goal.status === 'paused');
  return {
    goals,
    summary: {
      active: active.length,
      paused: paused.length,
      completed: goals.filter((goal) => goal.status === 'completed').length,
      attention: active.filter((goal) => goal.progress < 40).length,
    },
    mode: 'agent',
    principle: 'objetivo -> missão -> trabalho -> aprovação -> resultado',
  };
}
