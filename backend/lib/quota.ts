/** Limites de feedbacks/mês e cotas de IA (tokens). */
import { getDb, dbEngine } from './db.js';
import { getCurrentMonth } from './planUtils.js';
import { normalizePlan } from './plans.js';

export const PLAN_FEEDBACK_LIMITS: Record<string, number> = { trial: 30, teste: 30, inicial: 100, pro: 300, ultra: 800, corporativo: 2500, rei: 8000 };
export const PLAN_TOKEN_LIMITS: Record<string, number> = { trial: 25_000, teste: 25_000, inicial: 0, pro: 0, ultra: 120_000, corporativo: 400_000, rei: 1_200_000 };

const AI_REVIEW_RESERVATION = Math.max(400, Number(process.env.AI_REVIEW_RESERVATION_TOKENS || 900));
const AI_RESERVATION_TTL_MS = Math.max(5_000, Number(process.env.AI_REVIEW_RESERVATION_TTL_MS || 30_000));
const aiReservations = new Map<string, { tokens: number; expiresAt: number }>();
function cleanupAiReservations(now = Date.now()) { for (const [empresaId, r] of aiReservations) if (r.expiresAt <= now) aiReservations.delete(empresaId); }

/** Chave canônica de cota: aliases como `corp`/`corporate` nunca caem em trial. */
function quotaPlanKey(plan: string | null | undefined): string {
  return normalizePlan(plan) || String(plan ?? '').trim().toLowerCase() || 'trial';
}

export function planTemIA(plan: string | null | undefined): boolean {
  const p = quotaPlanKey(plan);
  if (p === 'inicial' || p === 'pro') return false;
  return ['ultra', 'corporativo', 'rei', 'trial', 'teste'].includes(p);
}
export function getFeedbackLimit(plan: string): number { return PLAN_FEEDBACK_LIMITS[quotaPlanKey(plan)] ?? PLAN_FEEDBACK_LIMITS.trial; }
export function getTokenLimit(plan: string): number { return PLAN_TOKEN_LIMITS[quotaPlanKey(plan)] ?? PLAN_TOKEN_LIMITS.trial; }

export function getFeatureTokenLimit(plan: string, feature: string): number {
  const p = quotaPlanKey(plan);
  const f = String(feature || 'feedback').toLowerCase();
  if (f !== 'dot') return getTokenLimit(p);
  const global = getTokenLimit(p);
  if (global <= 0) return 0;
  const configured = Number(process.env[`AI_DOT_${p.toUpperCase()}_TOKENS`] || 0);
  // DOT possui orçamento próprio e não compete com o feedback.
  // Limites comerciais: Rei 850k e Corporativo 450k tokens/mês.
  // O ambiente pode sobrescrever; sem plano identificado não há orçamento.
  const defaults: Record<string, number> = { rei: 850_000, corporativo: 450_000 };
  return Math.max(0, configured || defaults[p] || Math.floor(global * 0.2));
}

function monthStartIso(mes?: string): string { const m = mes || getCurrentMonth(); return `${m}-01T00:00:00.000Z`; }
function nextMonthStartIso(mes?: string): string { const m = mes || getCurrentMonth(); const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo, 1)).toISOString(); }

/**
 * Consumo isolado por feature. O schema atual registra `tipo` (ex.:
 * `filtra_dot_chat`), então o DOT é medido pelo prefixo dos seus tipos.
 * Nunca usa o consumo global para bloquear outra feature.
 */
export async function tokensUsadosFeatureMes(empresaId: string, feature: string): Promise<number> {
  const db = getDb();
  const mes = getCurrentMonth();
  const f = String(feature || 'feedback').toLowerCase();
  const tipoPattern = f === 'dot' ? 'filtra_dot%' : `%${f}%`;
  try {
    if (dbEngine() === 'postgres') {
      const row = await db.get(
        `SELECT COALESCE(SUM(tokens),0) as t FROM ai_usage
         WHERE empresa_id = ? AND tipo LIKE ? AND criado_em >= ? AND criado_em < ?`,
        [empresaId, tipoPattern, monthStartIso(mes), nextMonthStartIso(mes)]
      );
      return Number(row?.t || 0);
    }
    const row = await db.get(
      `SELECT COALESCE(SUM(tokens),0) as t FROM ai_usage
       WHERE empresa_id = ? AND tipo LIKE ? AND substr(criado_em, 1, 7) = ?`,
      [empresaId, tipoPattern, mes]
    );
    return Number(row?.t || 0);
  } catch { return 0; }
}

export async function tokensUsadosMes(empresaId: string): Promise<number> {
  const db = getDb(); const mes = getCurrentMonth();
  try {
    if (dbEngine() === 'postgres') {
      const row = await db.get(`SELECT COALESCE(SUM(tokens),0) as t FROM ai_usage WHERE empresa_id = ? AND criado_em >= ? AND criado_em < ?`, [empresaId, monthStartIso(mes), nextMonthStartIso(mes)]);
      return Number(row?.t || 0);
    }
    const row = await db.get(`SELECT COALESCE(SUM(tokens),0) as t FROM ai_usage WHERE empresa_id = ? AND substr(criado_em, 1, 7) = ?`, [empresaId, mes]);
    return Number(row?.t || 0);
  } catch { return 0; }
}

export async function assertEmpresaTokenQuota(empresaId: string | null | undefined, plan: string | null | undefined): Promise<{ ok: boolean; used: number; reserved: number; limit: number }> {
  if (!empresaId) return { ok: true, used: 0, reserved: 0, limit: 0 };
  const limit = getTokenLimit(String(plan || '')); if (limit <= 0) return { ok: false, used: 0, reserved: 0, limit: 0 };
  cleanupAiReservations();
  const used = await tokensUsadosMes(empresaId); const existing = aiReservations.get(empresaId)?.tokens || 0;
  if (limit - used - existing < AI_REVIEW_RESERVATION) return { ok: false, used, reserved: existing, limit };
  aiReservations.set(empresaId, { tokens: existing + AI_REVIEW_RESERVATION, expiresAt: Date.now() + AI_RESERVATION_TTL_MS });
  return { ok: true, used, reserved: existing + AI_REVIEW_RESERVATION, limit };
}

export async function checkQuota(plan: string, type: 'tags' | 'respostas'): Promise<void> {
  const db = getDb(); const month = getCurrentMonth(); const row = await db.get(`SELECT ${type} FROM usage WHERE plan = ? AND month = ?`, [plan, month]);
  const canonical = quotaPlanKey(plan);
  const limit = canonical === 'rei' || canonical === 'corporativo' ? 20000 : canonical === 'ultra' ? 4000 : 1500;
  if (row && row[type] >= limit) throw new Error(`Limite mensal de ${type} para o plano ${plan} atingido`);
  await db.run(`INSERT INTO usage (plan, month, ${type}) VALUES (?, ?, 1) ON CONFLICT(plan, month) DO UPDATE SET ${type} = ${type} + 1`, [plan, month]);
}

export async function contarReviewsMes(empresaId: string): Promise<number> {
  const db = getDb(); const mes = getCurrentMonth(); const start = monthStartIso(mes); const end = nextMonthStartIso(mes);
  try {
    const row = await db.get(`SELECT COUNT(*) as c FROM reviews WHERE empresa_id = ? AND COALESCE(is_test, 0) = 0 AND createdAt >= ? AND createdAt < ?`, [empresaId, start, end]);
    return Number(row?.c || 0);
  } catch {
    try { const row = await db.get(`SELECT COUNT(*) as c FROM reviews WHERE empresa_id = ? AND COALESCE(is_test, 0) = 0 AND created_at >= ? AND created_at < ?`, [empresaId, start, end]); return Number(row?.c || 0); }
    catch { return 0; }
  }
}
