import { getDb } from '../lib/db.js';

export type DotAccessAction = 'read' | 'analyze' | 'create' | 'update' | 'execute' | 'external_send';
export type DotAccessResource =
  | 'filtra'
  | 'customers'
  | 'sales'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'crm'
  | 'documents'
  | 'calendar'
  | 'email'
  | 'whatsapp'
  | 'erp'
  | 'other';

export type DotPermission = {
  resource: DotAccessResource;
  action: DotAccessAction;
  granted: boolean;
  granted_by?: string | null;
  granted_at?: string | null;
};

export async function ensureDotAccessSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    user_id TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    granted INTEGER NOT NULL DEFAULT 0,
    granted_by TEXT,
    granted_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_permissions_empresa ON dot_agent_permissions(empresa_id, resource, action)');
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_permissions_scope ON dot_agent_permissions(empresa_id, COALESCE(user_id, \'\'), resource, action)');
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_access_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    user_id TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    allowed INTEGER NOT NULL,
    reason TEXT NOT NULL,
    context TEXT,
    created_at TEXT NOT NULL
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_access_audit_empresa ON dot_access_audit(empresa_id, created_at)');
}

export async function listDotPermissions(empresaId: string, userId?: string | null) {
  const db = getDb();
  return db.all(
    `SELECT resource, action, granted, granted_by, granted_at, revoked_at
       FROM dot_agent_permissions
      WHERE empresa_id = ? AND (user_id IS NULL OR user_id = ?)
      ORDER BY resource, action`,
    [empresaId, userId || null],
  );
}

export async function setDotPermission(
  empresaId: string,
  input: { resource: DotAccessResource; action: DotAccessAction; granted: boolean; userId?: string | null; grantedBy?: string | null },
) {
  const db = getDb();
  const resource = input.resource;
  const action = input.action;
  const now = new Date().toISOString();
  const userId = input.userId || null;
  const existing = await db.get(
    `SELECT id FROM dot_agent_permissions
      WHERE empresa_id = ? AND resource = ? AND action = ? AND ((user_id IS NULL AND ? IS NULL) OR user_id = ?)
      LIMIT 1`,
    [empresaId, resource, action, userId, userId],
  );
  if (existing) {
    await db.run(
      `UPDATE dot_agent_permissions
          SET granted = ?, granted_by = ?, granted_at = CASE WHEN ? = 1 THEN ? ELSE granted_at END,
              revoked_at = CASE WHEN ? = 1 THEN NULL ELSE ? END, updated_at = ?
        WHERE id = ?`,
      [input.granted ? 1 : 0, input.grantedBy || null, input.granted ? 1 : 0, now, input.granted ? 1 : 0, now, now, existing.id],
    );
  } else {
    await db.run(
      `INSERT INTO dot_agent_permissions
        (empresa_id,user_id,resource,action,granted,granted_by,granted_at,revoked_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [empresaId, userId, resource, action, input.granted ? 1 : 0, input.grantedBy || null, input.granted ? now : null, input.granted ? null : now, now, now],
    );
  }
  return db.get(
    `SELECT resource, action, granted, granted_by, granted_at, revoked_at
       FROM dot_agent_permissions
      WHERE empresa_id = ? AND resource = ? AND action = ? AND ((user_id IS NULL AND ? IS NULL) OR user_id = ?)
      LIMIT 1`,
    [empresaId, resource, action, userId, userId],
  );
}

async function recordAccess(
  empresaId: string,
  userId: string | null | undefined,
  resource: string,
  action: string,
  allowed: boolean,
  reason: string,
  context?: unknown,
) {
  const db = getDb();
  await db.run(
    'INSERT INTO dot_access_audit (empresa_id,user_id,resource,action,allowed,reason,context,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [empresaId, userId || null, resource, action, allowed ? 1 : 0, reason, context ? JSON.stringify(context).slice(0, 8000) : null, new Date().toISOString()],
  );
}

export async function dotAccessAllowed(
  empresaId: string,
  resource: DotAccessResource,
  action: DotAccessAction,
  userId?: string | null,
  context?: unknown,
): Promise<boolean> {
  const db = getDb();
  const row = await db.get(
    `SELECT granted FROM dot_agent_permissions
      WHERE empresa_id = ? AND resource = ? AND action = ? AND granted = 1
        AND (user_id IS NULL OR user_id = ?)
        AND revoked_at IS NULL
      ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END
      LIMIT 1`,
    [empresaId, resource, action, userId || null, userId || null],
  );
  const allowed = Boolean(row);
  await recordAccess(empresaId, userId, resource, action, allowed, allowed ? 'permission_granted' : 'permission_denied', context);
  return allowed;
}

export async function requireDotAccess(
  empresaId: string,
  resource: DotAccessResource,
  action: DotAccessAction,
  userId?: string | null,
  context?: unknown,
) {
  const allowed = await dotAccessAllowed(empresaId, resource, action, userId, context);
  if (!allowed) {
    const error = new Error(`DOT sem permissão: ${resource}.${action}`);
    (error as any).code = 'DOT_PERMISSION_REQUIRED';
    (error as any).resource = resource;
    (error as any).action = action;
    throw error;
  }
}
