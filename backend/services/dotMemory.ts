import { getDb } from '../lib/db.js';

export type DotMemoryTurn = {
  role: 'user' | 'dot';
  text: string;
  at: number;
};

async function ensureSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    actor_user_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_memory_session ON dot_agent_memory(empresa_id, session_id, id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_memory_actor ON dot_agent_memory(empresa_id, actor_user_id, created_at)');
}

export async function loadDotSessionHistory(
  empresaId: string,
  sessionId: string,
  limit = 12,
): Promise<DotMemoryTurn[]> {
  await ensureSchema();
  const rows = await getDb().all(
    'SELECT role,content,created_at FROM dot_agent_memory WHERE empresa_id=? AND session_id=? ORDER BY id DESC LIMIT ?',
    [empresaId, sessionId, Math.max(1, Math.min(limit, 100))],
  );
  return (rows || []).reverse().map((row: any) => ({
    role: String(row.role) === 'user' ? 'user' : 'dot',
    text: String(row.content),
    at: Date.parse(String(row.created_at)) || Date.now(),
  }));
}

export async function appendDotMemoryTurn(input: {
  empresaId: string;
  sessionId: string;
  actorUserId?: string | null;
  role: 'user' | 'dot';
  text: string;
}) {
  await ensureSchema();
  await getDb().run(
    'INSERT INTO dot_agent_memory (empresa_id,session_id,actor_user_id,role,content,created_at) VALUES (?,?,?,?,?,?)',
    [
      input.empresaId,
      input.sessionId,
      input.actorUserId || null,
      input.role,
      input.text.slice(0, 12000),
      new Date().toISOString(),
    ],
  );
  await getDb().run(
    'DELETE FROM dot_agent_memory WHERE empresa_id=? AND session_id=? AND id NOT IN (SELECT id FROM dot_agent_memory WHERE empresa_id=? AND session_id=? ORDER BY id DESC LIMIT 40)',
    [input.empresaId, input.sessionId, input.empresaId, input.sessionId],
  );
}

export async function clearDotSessionHistory(empresaId: string, sessionId: string) {
  await ensureSchema();
  await getDb().run(
    'DELETE FROM dot_agent_memory WHERE empresa_id=? AND session_id=?',
    [empresaId, sessionId],
  );
}
