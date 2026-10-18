/**
 * Fonte compartilhada e cache de avaliações usado pelo painel e pelo relatório mensal.
 * O cache guarda o conjunto completo da empresa; limites de exibição são aplicados
 * somente na camada do painel, nunca na fonte usada para cálculos mensais.
 */
type ReviewCacheEntry = { expiresAt: number; rows: any[] };
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_COMPANIES = 250;
const reviewCache = new Map<string, ReviewCacheEntry>();
const inFlight = new Map<string, Promise<any[]>>();

export async function loadCompanyReviewsCached(db: any, empresaId: string): Promise<any[]> {
  const key = String(empresaId);
  const now = Date.now();
  const cached = reviewCache.get(key);
  if (cached && cached.expiresAt > now) {
    // Refresh insertion order for simple LRU eviction.
    reviewCache.delete(key);
    reviewCache.set(key, cached);
    return cached.rows;
  }
  if (cached) reviewCache.delete(key);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const load = (async () => {
    const queries = [
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC',
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY "createdAt" DESC',
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY created_at DESC',
      'SELECT * FROM reviews WHERE empresa_id = ? ORDER BY id DESC',
      'SELECT * FROM reviews WHERE empresa_id = ?',
    ];
    let lastError: unknown;
    for (const query of queries) {
      try {
        const rows = await db.all(query, [key]);
        const safeRows = Array.isArray(rows) ? rows : [];
        reviewCache.set(key, { rows: safeRows, expiresAt: Date.now() + CACHE_TTL_MS });
        while (reviewCache.size > CACHE_MAX_COMPANIES) {
          const oldest = reviewCache.keys().next().value;
          if (oldest === undefined) break;
          reviewCache.delete(oldest);
        }
        return safeRows;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Falha ao carregar avaliações da empresa.');
  })();
  inFlight.set(key, load);
  try {
    return await load;
  } finally {
    inFlight.delete(key);
  }
}

/** Invalida após mutações de avaliações quando a rota de escrita puder fazê-lo. */
export function invalidateCompanyReviewsCache(empresaId: string): void {
  reviewCache.delete(String(empresaId));
}
