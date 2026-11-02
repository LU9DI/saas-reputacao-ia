import { getDb } from '../lib/db.js';
import { requireSchema } from '../lib/migrations.js';

export type DotActionAuditEvent =
  | 'prepared'
  | 'approved'
  | 'execution_started'
  | 'executed'
  | 'failed';

export type DotActionAuditInput = {
  empresaId: string;
  actionId: number;
  decisionId?: number | null;
  event: DotActionAuditEvent;
  actorType: 'dot' | 'user' | 'system';
  actorId?: string | null;
  metadata?: unknown;
};

/**
 * Verifica o schema de auditoria — sem executar DDL.
 * Tabela, coluna `metadata` e índices são criados apenas em
 * `runCentralMigrations` (lib/migrations.ts) durante `initDB()`.
 */
export async function ensureDotActionAuditSchema() {
  const db = getDb();
  await requireSchema(db, {
    tables: ['dot_action_audit'],
    columns: { dot_action_audit: ['empresa_id', 'action_id', 'decision_id', 'event', 'actor_type', 'metadata'] },
    indexes: [
      { table: 'dot_action_audit', name: 'idx_dot_action_audit_empresa' },
      { table: 'dot_action_audit', name: 'idx_dot_action_audit_action' },
    ],
  });
}

export async function recordDotActionAudit(input: DotActionAuditInput) {
  await ensureDotActionAuditSchema();
  const db = getDb();
  await db.run(
    `INSERT INTO dot_action_audit
      (empresa_id, action_id, decision_id, event, actor_type, actor_id, metadata, created_at)
      VALUES (?,?,?,?,?,?,?,?)`,
    [
      input.empresaId,
      input.actionId,
      input.decisionId ?? null,
      input.event,
      input.actorType,
      input.actorId || null,
      input.metadata == null ? null : JSON.stringify(input.metadata).slice(0, 12000),
      new Date().toISOString(),
    ],
  );
}
