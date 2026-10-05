import { getDb, withDbTransaction } from '../lib/db.js';
import { dotActionRequiresApproval, getDotActionDefinition } from './dotActionRegistry.js';
import { recordDotActionAudit } from './dotActionAudit.js';
import { executeDotActionThroughGateway } from './dotExecutionGateway.js';
import { requireDotAccess } from './dotAccessControl.js';

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
    created_at TEXT NOT NULL,
    approved_by TEXT
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_decision_option ON dot_action_queue(empresa_id, decision_id, option_id)');
  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_action_queue_one_active_decision ON dot_action_queue(empresa_id, decision_id) WHERE status IN ('prepared','approved','executing')");
  try { await db.exec('ALTER TABLE dot_action_queue ADD COLUMN approved_by TEXT'); } catch { /* coluna já existe */ }
}

export async function prepareDotActionFromDecision(empresaId: string, decisionId: number, optionId: string) {
  await ensureSchema();
  const prepared = await withDbTransaction(async (tx) => {
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
    const result = await tx.run(
      'INSERT INTO dot_action_queue (empresa_id,decision_id,option_id,action,status,created_at) VALUES (?,?,?,?,?,?) RETURNING id',
      [empresaId, decisionId, option.id, definition.action, 'prepared', new Date().toISOString()]
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
  } catch (error) {
    const current = await tx.get('SELECT * FROM dot_action_queue WHERE empresa_id = ? AND decision_id = ? AND status IN (\'prepared\',\'approved\',\'executing\') LIMIT 1', [empresaId, decisionId]);
    if (current) return current;
    throw error;
  }
  });
  if (prepared?.id) {
    await recordDotActionAudit({ empresaId, actionId: Number(prepared.id), decisionId, event: 'prepared', actorType: 'dot', metadata: { optionId } });
  }
  return prepared;
}

export async function approveDotAction(empresaId: string, actionId: number, approvedBy?: string | null) {
  await ensureSchema();
  try {
    await requireDotAccess(empresaId, 'operations', 'approve', approvedBy || null, { actionId });
  } catch {
    return null;
  }
  const now = new Date().toISOString();

  const approved = await withDbTransaction(async (tx) => {
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
      "UPDATE dot_action_queue SET status = ?, approved_at = ?, approved_by = ? WHERE id = ? AND empresa_id = ? AND status = 'prepared'",
      ['approved', now, approvedBy || null, actionId, empresaId]
    );
    if (!updated || updated.changes !== 1) {
      throw new Error('Não foi possível consumir a ação preparada; transação revertida.');
    }

    return { id: actionId, decisionId: Number(action.decision_id), status: 'approved', executed: false };
  });
  if (approved?.id) {
    await recordDotActionAudit({ empresaId, actionId, decisionId: Number(approved.decisionId), event: 'approved', actorType: 'user' });
  }
  return approved;
}

export async function listDotActions(empresaId: string) {
  await ensureSchema();
  const rows = await dbAll(empresaId);
  return rows || [];
}

async function dbAll(empresaId: string) {
  return getDb().all('SELECT * FROM dot_action_queue WHERE empresa_id = ? ORDER BY id DESC LIMIT 50', [empresaId]);
}

export async function executeDotAction(empresaId: string, actionId: number, actorUserId?: string | null) {
  await ensureSchema();
  return executeDotActionThroughGateway(empresaId, actionId, actorUserId);
}
