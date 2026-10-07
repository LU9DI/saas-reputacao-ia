import { randomUUID } from 'node:crypto';
import { getDb } from '../lib/db.js';

const DEFAULT_TTL_MS = Math.max(
  60_000,
  Number(process.env.DOT_AGENT_RUNTIME_LOCK_TTL_MS || 1_800_000),
);

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_runtime_locks (
    lock_key TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL,
    actor_user_id TEXT,
    session_id TEXT NOT NULL,
    lock_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_runtime_locks_expiry ON dot_agent_runtime_locks(expires_at)');
}

export async function acquireDotRuntimeLock(input: {
  empresaId: string;
  actorUserId?: string | null;
  sessionId: string;
  ttlMs?: number;
}) {
  await ensureSchema();
  const db = getDb();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const lockKey = `tenant:${input.empresaId}:actor:${input.actorUserId || 'system-dot'}:session:${input.sessionId}`;
  await db.run('DELETE FROM dot_agent_runtime_locks WHERE expires_at <= ?', [nowIso]);

  const token = randomUUID();
  const expiresAt = new Date(now + Math.max(60_000, input.ttlMs || DEFAULT_TTL_MS)).toISOString();

  try {
    await db.run(
      'INSERT INTO dot_agent_runtime_locks (lock_key,empresa_id,actor_user_id,session_id,lock_token,expires_at,created_at) VALUES (?,?,?,?,?,?,?)',
      [
        lockKey,
        input.empresaId,
        input.actorUserId || null,
        input.sessionId,
        token,
        expiresAt,
        nowIso,
      ],
    );
    return { lockKey, token, expiresAt };
  } catch {
    return null;
  }
}

export async function releaseDotRuntimeLock(lock: { lockKey: string; token: string }) {
  await ensureSchema();
  await getDb().run(
    'DELETE FROM dot_agent_runtime_locks WHERE lock_key=? AND lock_token=?',
    [lock.lockKey, lock.token],
  );
}
