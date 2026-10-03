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
    baseline_json TEXT,
    result_json TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  )`);
  try { await db.exec('ALTER TABLE dot_followups ADD COLUMN baseline_json TEXT'); } catch {}
  try { await db.exec('ALTER TABLE dot_followups ADD COLUMN result_json TEXT'); } catch {}
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_followups_action ON dot_followups(empresa_id, action_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_followups_empresa_status ON dot_followups(empresa_id, status, due_at)');
}

async function captureSnapshot(empresaId: string) {
  const db = getDb();
  const rows = await db.all(
    'SELECT rating, ai_tags, createdAt FROM reviews WHERE empresa_id = ? AND IFNULL(is_test, 0) != 1 ORDER BY id DESC LIMIT 200',
    [empresaId],
  );
  const reviews = rows || [];
  const ratings = reviews.map((r: any) => Number(r.rating || 0)).filter((n: number) => n > 0);
  const average = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
  const critical = ratings.filter((n: number) => n <= 3).length;
  const recent = ratings.slice(0, 20);
  const recentAverage = recent.length ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0;
  return {
    review_count: reviews.length,
    average: Number(average.toFixed(2)),
    critical_count: critical,
    recent_average: Number(recentAverage.toFixed(2)),
    captured_at: new Date().toISOString(),
  };
}

export async function createDotFollowUp(empresaId: string, decisionId: number, actionId: number, dueInHours = 24) {
  await ensureSchema();
  const db = getDb();
  const existing = await db.get(
    'SELECT * FROM dot_followups WHERE empresa_id = ? AND action_id = ? LIMIT 1',
    [empresaId, actionId],
  );
  if (existing) return existing;

  const now = new Date();
  const baseline = await captureSnapshot(empresaId);
  const dueAt = new Date(now.getTime() + Math.max(1, dueInHours) * 60 * 60 * 1000).toISOString();
  const result = await db.run(
    'INSERT INTO dot_followups (empresa_id,decision_id,action_id,status,due_at,baseline_json,created_at) VALUES (?,?,?,?,?,?,?) RETURNING id',
    [empresaId, decisionId, actionId, 'pending', dueAt, JSON.stringify(baseline), now.toISOString()],
  );
  return db.get('SELECT * FROM dot_followups WHERE id = ? AND empresa_id = ? LIMIT 1', [result.lastID, empresaId]);
}

export async function monitorDueDotFollowUps(empresaId?: string) {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const rows = empresaId
    ? await db.all(
        "SELECT * FROM dot_followups WHERE empresa_id = ? AND status = 'pending' AND due_at <= ? ORDER BY due_at ASC LIMIT 100",
        [empresaId, now],
      )
    : await db.all(
        "SELECT * FROM dot_followups WHERE status = 'pending' AND due_at <= ? ORDER BY due_at ASC LIMIT 500",
        [now],
      );

  const results = [];
  for (const row of rows || []) {
    const baseline = row.baseline_json ? JSON.parse(String(row.baseline_json)) : null;
    const current = await captureSnapshot(String(row.empresa_id));
    const deltaAverage = baseline ? Number((current.average - Number(baseline.average || 0)).toFixed(2)) : 0;
    const deltaCritical = baseline ? current.critical_count - Number(baseline.critical_count || 0) : 0;
    const deltaRecent = baseline ? Number((current.recent_average - Number(baseline.recent_average || 0)).toFixed(2)) : 0;

    let outcome = 'permaneceu';
    if (deltaAverage >= 0.15 || deltaRecent >= 0.2 || deltaCritical < 0) outcome = 'melhorou';
    else if (deltaAverage <= -0.15 || deltaRecent <= -0.2 || deltaCritical > 0) outcome = 'piorou';

    const result = {
      outcome,
      delta_average: deltaAverage,
      delta_recent_average: deltaRecent,
      delta_critical: deltaCritical,
      baseline,
      current,
      monitored_at: now,
    };

    await db.run(
      "UPDATE dot_followups SET status = 'completed', outcome = ?, result_json = ?, completed_at = ? WHERE id = ? AND empresa_id = ? AND status = 'pending'",
      [outcome, JSON.stringify(result), now, row.id, row.empresa_id],
    );
    results.push({ id: row.id, empresa_id: row.empresa_id, ...result });
  }
  return results;
}

export async function listDotFollowUps(empresaId: string) {
  await ensureSchema();
  return getDb().all(
    "SELECT * FROM dot_followups WHERE empresa_id = ? ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, due_at ASC, id DESC LIMIT 100",
    [empresaId],
  );
}

export async function completeDotFollowUp(empresaId: string, followUpId: number, outcome?: string) {
  await ensureSchema();
  const db = getDb();
  const result = await db.run(
    "UPDATE dot_followups SET status = 'completed', outcome = ?, completed_at = ? WHERE id = ? AND empresa_id = ? AND status = 'pending'",
    [String(outcome || '').trim().slice(0, 2000) || null, new Date().toISOString(), followUpId, empresaId],
  );
  if (!result || result.changes !== 1) return null;
  return db.get('SELECT * FROM dot_followups WHERE id = ? AND empresa_id = ? LIMIT 1', [followUpId, empresaId]);
}
