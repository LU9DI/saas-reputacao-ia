import { getDb } from '../lib/db.js';

export type DotActionStatus = 'prepared' | 'approved' | 'executing' | 'executed' | 'failed' | 'cancelled';

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_action_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    decision_id INTEGER NOT NULL,
    option_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared',
    approved_at TEXT,
    executed_at TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`);
}

export async function prepareDotActionFromDecision(empresaId: string, decisionId: number, optionId: string) {
  await ensureSchema();
  const db = getDb();
  const decision = await db.get('SELECT * FROM dot_decisions WHERE id = ? AND empresa_id = ? LIMIT 1', [decisionId, empresaId]);
  if (!decision) return null;
  const options = JSON.parse(decision.options_json || '[]');
  const option = options.find((item: any) => item.id === optionId);
  if (!option) return null;
  const existing = await db.get('SELECT * FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ? AND option_id = ? AND status IN (\'prepared\',\'approved\',\'executing\') LIMIT 1', [empresaId, decisionId, optionId]);
  if (existing) return existing;
  const result = await db.run(
    'INSERT INTO dot_action_queue (empresa_id,decision_id,option_id,action,status,created_at) VALUES (?,?,?,?,?,?)',
    [empresaId, decisionId, option.id, option.action, 'prepared', new Date().toISOString()]
  );
  return { id: result.lastID, decisionId, optionId: option.id, action: option.action, status: 'prepared' };
}

export async function approveDotAction(empresaId: string, actionId: number) {
  await ensureSchema();
  const db = getDb();
  const row = await db.get('SELECT id FROM dot_action_queue WHERE id = ? AND empresa_id = ? AND status = ? LIMIT 1', [actionId, empresaId, 'prepared']);
  if (!row) return null;
  await db.run('UPDATE dot_action_queue SET status = ?, approved_at = ? WHERE id = ? AND empresa_id = ?', ['approved', new Date().toISOString(), actionId, empresaId]);
  return { id: actionId, status: 'approved', executed: false };
}

export async function listDotActions(empresaId: string) {
  await ensureSchema();
  const rows = await dbAll(empresaId);
  return rows || [];
}

async function dbAll(empresaId: string) {
  return getDb().all('SELECT * FROM dot_action_queue WHERE empresa_id = ? ORDER BY id DESC LIMIT 50', [empresaId]);
}

export async function executeDotAction(empresaId: string, actionId: number) {
  await ensureSchema();
  const db = getDb();
  const row = await db.get(
    'SELECT * FROM dot_action_queue WHERE id = ? AND empresa_id = ? AND status = ? LIMIT 1',
    [actionId, empresaId, 'approved']
  );
  if (!row) return { ok: false, reason: 'Ação não encontrada ou não aprovada.', status: null };

  const supportedLocalActions = new Set([
    'priorizar_e_resolver',
    'escalar_responsavel',
    'corrigir_e_acompanhar',
  ]);
  if (!supportedLocalActions.has(String(row.action))) {
    return { ok: false, reason: 'Executor não registrado para esta ação.', status: row.status };
  }

  const now = new Date().toISOString();
  const claimed = await db.run(
    "UPDATE dot_action_queue SET status = ?, error = NULL WHERE id = ? AND empresa_id = ? AND status = 'approved'",
    ['executing', actionId, empresaId]
  );
  if (!claimed || claimed.changes !== 1) {
    return { ok: false, reason: 'Ação já está sendo processada ou mudou de estado.', status: 'approved' };
  }

  try {
    // Executor local seguro: registra a execução sem chamar sistemas externos.
    const finished = new Date().toISOString();
    await db.run(
      'UPDATE dot_action_queue SET status = ?, executed_at = ? WHERE id = ? AND empresa_id = ? AND status = ?',
      ['executed', finished, actionId, empresaId, 'executing']
    );
    return { ok: true, id: actionId, status: 'executed', simulated: true, startedAt: now, executedAt: finished };
  } catch (error: any) {
    await db.run(
      'UPDATE dot_action_queue SET status = ?, error = ? WHERE id = ? AND empresa_id = ? AND status = ?',
      ['failed', String(error?.message || error), actionId, empresaId, 'executing']
    );
    return { ok: false, id: actionId, status: 'failed', reason: String(error?.message || error) };
  }
}
