import crypto from 'crypto';
import { getDb, dbEngine, withDbTransaction } from '../lib/db.js';
import { ensureAiUsageSchema } from '../lib/aiUsage.js';
import { getCurrentMonth } from '../lib/planUtils.js';
import { getFeatureTokenLimit } from '../lib/quota.js';

const RESERVATION_TTL_MS = Math.max(30_000, Number(process.env.DOT_TOKEN_RESERVATION_TTL_MS || 120_000));

function monthBounds() {
  const month = getCurrentMonth();
  const [year, mon] = month.split('-').map(Number);
  return {
    start: `${month}-01T00:00:00.000Z`,
    end: new Date(Date.UTC(year, mon, 1)).toISOString(),
  };
}

async function ensureReservationSchema() {
  const db = getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dot_token_reservations (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      feature TEXT NOT NULL DEFAULT 'dot',
      tokens INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_token_reservations_empresa ON dot_token_reservations(empresa_id, expires_at)');
}

function inputReservation(system: string, user: string, outputLimit: number): number {
  // Não dependemos de uma estimativa otimista: reservamos 1 token para cada 2 caracteres
  // da entrada + o teto de saída. É deliberadamente conservador para português.
  const input = Math.ceil((String(system).length + String(user).length) / 2);
  return Math.max(outputLimit + 256, input + outputLimit + 256);
}

export async function reserveDotTokens(
  empresaId: string,
  plan: string | null | undefined,
  system: string,
  user: string,
  outputLimit: number,
) {
  await ensureAiUsageSchema(getDb());
  await ensureReservationSchema();
  const reservationId = crypto.randomUUID();
  const requested = inputReservation(system, user, outputLimit);
  const limit = getFeatureTokenLimit(String(plan || 'rei'), 'dot');
  const bounds = monthBounds();

  return withDbTransaction(async (tx: any) => {
    if (dbEngine() === 'postgres') {
      await tx.get('SELECT pg_advisory_xact_lock(hashtext(?))', [`dot-token:${empresaId}`]);
    }

    await tx.run('DELETE FROM dot_token_reservations WHERE expires_at <= ?', [new Date().toISOString()]);

    const usedRow = await tx.get(
      `SELECT COALESCE(SUM(tokens),0) AS tokens FROM ai_usage
       WHERE empresa_id = ? AND feature = 'dot' AND criado_em >= ? AND criado_em < ?`,
      [empresaId, bounds.start, bounds.end],
    );
    const reservedRow = await tx.get(
      `SELECT COALESCE(SUM(tokens),0) AS tokens FROM dot_token_reservations
       WHERE empresa_id = ? AND feature = 'dot' AND expires_at > ?`,
      [empresaId, new Date().toISOString()],
    );

    const used = Number(usedRow?.tokens || 0);
    const reserved = Number(reservedRow?.tokens || 0);
    const remaining = Math.max(0, limit - used - reserved);

    if (limit <= 0 || requested > remaining) {
      return {
        ok: false,
        reservationId: null,
        reserved: 0,
        requested,
        used,
        activeReservations: reserved,
        limit,
        remaining,
      };
    }

    const now = new Date();
    await tx.run(
      `INSERT INTO dot_token_reservations
       (id, empresa_id, feature, tokens, created_at, expires_at)
       VALUES (?, ?, 'dot', ?, ?, ?)`,
      [reservationId, empresaId, requested, now.toISOString(), new Date(now.getTime() + RESERVATION_TTL_MS).toISOString()],
    );

    return {
      ok: true,
      reservationId,
      reserved: requested,
      requested,
      used,
      activeReservations: reserved + requested,
      limit,
      remaining: remaining - requested,
    };
  });
}

export async function releaseDotTokens(empresaId: string, reservationId: string | null) {
  if (!reservationId) return;
  await ensureReservationSchema();
  const db = getDb();
  await db.run('DELETE FROM dot_token_reservations WHERE id = ? AND empresa_id = ?', [reservationId, empresaId]);
}

export async function getDotTokenBudget(empresaId: string | null | undefined, plan: string | null | undefined) {
  const limit = getFeatureTokenLimit(String(plan || 'rei'), 'dot');
  if (!empresaId || limit <= 0) return { used: 0, reserved: 0, limit, remaining: Math.max(0, limit), percent: 0, warning: false, exhausted: limit <= 0 };

  await ensureAiUsageSchema(getDb());
  await ensureReservationSchema();
  const db = getDb();
  await db.run('DELETE FROM dot_token_reservations WHERE expires_at <= ?', [new Date().toISOString()]);
  const bounds = monthBounds();
  const usedRow = await db.get(
    `SELECT COALESCE(SUM(tokens),0) AS tokens FROM ai_usage
     WHERE empresa_id = ? AND feature = 'dot' AND criado_em >= ? AND criado_em < ?`,
    [empresaId, bounds.start, bounds.end],
  );
  const reservedRow = await db.get(
    `SELECT COALESCE(SUM(tokens),0) AS tokens FROM dot_token_reservations
     WHERE empresa_id = ? AND feature = 'dot' AND expires_at > ?`,
    [empresaId, new Date().toISOString()],
  );
  const used = Number(usedRow?.tokens || 0);
  const reserved = Number(reservedRow?.tokens || 0);
  const available = Math.max(0, limit - used - reserved);
  return {
    used,
    reserved,
    limit,
    remaining: available,
    percent: limit ? used / limit : 0,
    warning: limit > 0 && (used + reserved) / limit >= 0.8 && used < limit,
    exhausted: used >= limit || available <= 0,
  };
}
