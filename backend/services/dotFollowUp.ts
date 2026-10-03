import { getDb } from '../lib/db.js';

export type DotFollowUpStatus = 'pending' | 'completed' | 'cancelled';

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    decision_id INTEGER NOT NULL,
    action_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    due_at TEXT NOT NULL,
    outcome TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_followups_action ON dot_followups(empresa_id, action_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_followups_empresa_status ON dot_followups(empresa_id, status, due_at)');
}

export async function createDotFollowUp(
  empresaId: string,
  decisionId: number,
  actionId: number,
  dueInHours = 24,
) {
  await ensureSchema();
  const db = getDb();
  const existing = await db.get(
    'SELECT * FROM dot_followups WHERE empresa_id = ? AND action_id = ? LIMIT 1',
    [empresaId, actionId],
  );
  if (existing) return existing;

  const now = new Date();
  const dueAt = new Date(now.getTime() + Math.max(1, dueInHours) * 60 * 60 * 1000).toISOString();
  const result = await db.run(
    'INSERT INTO dot_followups (empresa_id,decision_id,action_id,status,due_at,created_at) VALUES (?,?,?,?,?,?) RETURNING id',
    [empresaId, decisionId, actionId, 'pending', dueAt, now.toISOString()],
  );
  return db.get('SELECT * FROM dot_followups WHERE id = ? AND empresa_id = ? LIMIT 1', [
    result.lastID,
    empresaId,
  ]);
}

export async function listDotFollowUps(empresaId: string) {
  await ensureSchema();
  return getDb().all(
    'SELECT * FROM dot_followups WHERE empresa_id = ? ORDER BY CASE WHEN status = \'pending\' THEN 0 ELSE 1 END, due_at ASC, id DESC LIMIT 100',
    [empresaId],
  );
}

export async function completeDotFollowUp(
  empresaId: string,
  followUpId: number,
  outcome?: string,
) {
  await ensureSchema();
  const db = getDb();
  const result = await db.run(
    "UPDATE dot_followups SET status = 'completed', outcome = ?, completed_at = ? WHERE id = ? AND empresa_id = ? AND status = 'pending'",
    [String(outcome || '').trim().slice(0, 2000) || null, new Date().toISOString(), followUpId, empresaId],
  );
  if (!result || result.changes !== 1) return null;
  return db.get('SELECT * FROM dot_followups WHERE id = ? AND empresa_id = ? LIMIT 1', [
    followUpId,
    empresaId,
  ]);
}
