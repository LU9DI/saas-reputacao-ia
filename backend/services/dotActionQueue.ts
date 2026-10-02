import { getDb, withDbTransaction } from '../lib/db.js';
import { dotActionRequiresApproval, getDotActionDefinition } from './dotActionRegistry.js';

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
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_decision_option ON dot_action_queue(empresa_id, decision_id, option_id)');
  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_one_active_decision ON dot_action_queue(empresa_id, decision_id) WHERE status IN ('prepared','approved','executing')");
}

export async function prepareDotActionFromDecision(empresaId: string, decisionId: number, optionId: string) {
  await ensureSchema();
  return withDbTransaction(async (tx) => {
  const decision = await tx.get('SELECT * FROM dot_decisions WHERE id = ? AND empresa_id = ? LIMIT 1', [decisionId, empresaId]);
  if (!decision) return null;

  const decisionStatus = String(decision.status || '');
  if (!['pending', 'prepared'].includes(decisionStatus)) return null;
  if (Number(decision.requires_approval) !== 1) return null;

  const options = JSON.parse(decision.options_json || '[]');
  const option = options.find((item: any) => item.id === optionId);
  if (!option) return null;
  const definition = getDotActionDefinition(String(option.action));
  if (!definition || !dotActionRequiresApproval(definition.action)) return null;
  const existing = await tx.get('SELECT * FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ? AND status IN (\'prepared\',\'approved\',\'executing\') LIMIT 1', [empresaId, decisionId]);
  if (existing) return existing;
  try {
    const result = await db.run(
      'INSERT INTO dot_action_queue (empresa_id,decision_id,option_id,action,status,created_at) VALUES (?,?,?,?,?,?) RETURNING id',
      [empresaId, decisionId, option.id, option.action, 'prepared', new Date().toISOString()]
    );
    if (decisionStatus === 'pending') {
      const promoted = await tx.run(
        "UPDATE dot_decisions SET status = 'prepared' WHERE id = ? AND empresa_id = ? AND status = 'pending'",
        [decisionId, empresaId]
      );
      if (promoted.changes !== 1) {
        throw new Error('Não foi possível preparar a decisão; transação revertida.');
      }
    }
    return { id: result.lastID, decisionId, optionId: option.id, action: definition.action, status: 'prepared' };
  } catch {
    const current = await tx.get('SELECT * FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ? AND status IN (\'prepared\',\'approved\',\'executing\') LIMIT 1', [empresaId, decisionId]);
    if (current) return current;
    throw error;
  }
  });
}

export async function approveDotAction(empresaId: string, actionId: number) {
  await ensureSchema();
  const now = new Date().toISOString();

  return withDbTransaction(async (tx) => {
    const action = await tx.get(
      'SELECT id, decision_id FROM dot_action_queue WHERE id = ? AND empresa_id = ? AND status = \'prepared\' LIMIT 1',
      [actionId, empresaId]
    );
    if (!action) return null;

    const decision = await tx.get(
      'SELECT id, status, requires_approval FROM dot_decisions WHERE id = ? AND empresa_id = ? LIMIT 1',
      [action.decision_id, empresaId]
    );
    if (!decision || String(decision.status) !== 'prepared' || Number(decision.requires_approval) !== 1) return null;

    const decisionApproved = await tx.run(
      "UPDATE dot_decisions SET status = 'approved' WHERE id = ? AND empresa_id = ? AND status = 'prepared' AND requires_approval = 1",
      [action.decision_id, empresaId]
    );
    if (decisionApproved.changes !== 1) return null;

    const updated = await tx.run(
      "UPDATE dot_action_queue SET status = ?, approved_at = ? WHERE id = ? AND empresa_id = ? AND status = 'prepared'",
      ['approved', now, actionId, empresaId]
    );
    if (!updated || updated.changes !== 1) {
      throw new Error('Não foi possível consumir a ação preparada; transação revertida.');
    }

    return { id: actionId, status: 'approved', executed: false };
  });
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
    `SELECT a.*, d.status AS decision_status, d.requires_approval
       FROM dot_action_queue a
       JOIN dot_decisions d ON d.id = a.decision_id AND d.empresa_id = a.empresa_id
      WHERE a.id = ? AND a.empresa_id = ? AND a.status = ? LIMIT 1`,
    [actionId, empresaId, 'approved']
  );
  if (!row) return { ok: false, reason: 'Ação não encontrada ou não aprovada.', status: null };
  if (String(row.decision_status) !== 'approved' || Number(row.requires_approval) !== 1) {
    return { ok: false, reason: 'A decisão vinculada não está aprovada para execução.', status: row.status };
  }

  const definition = getDotActionDefinition(String(row.action));
  if (!definition) return { ok: false, reason: 'Executor não registrado para esta ação.', status: row.status };
  if (definition.externalSideEffect) return { ok: false, reason: 'Ação externa exige executor homologado.', status: row.status };

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
    return { ok: true, id: actionId, status: 'executed', simulated: true, executor: definition.executorKey, startedAt: now, executedAt: finished };
  } catch (error: any) {
    await db.run(
      'UPDATE dot_action_queue SET status = ?, error = ? WHERE id = ? AND empresa_id = ? AND status = ?',
      ['failed', String(error?.message || error), actionId, empresaId, 'executing']
    );
    return { ok: false, id: actionId, status: 'failed', reason: String(error?.message || error) };
  }
}
