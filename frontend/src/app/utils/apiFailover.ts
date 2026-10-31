/**
 * Failover automático de API (estilo Groq → Gemini).
 *
 * Ordem:
 *  1. NEXT_PUBLIC_API_URL          (principal — Render)
 *  2. NEXT_PUBLIC_API_URL_BACKUP   (stand-by — Oracle / outro)
 *  3. NEXT_PUBLIC_API_URLS         (lista extra, separada por vírgula)
 *  4. https://api.filtraai.com     (canônica — garantida em produção)
 *
 * Troca entre bases somente para métodos seguros (GET/HEAD/OPTIONS), quando
 * há falha de rede, timeout ou HTTP 502/503/504/521/522.
 *
 * Requisições de escrita nunca são repetidas automaticamente em outra base:
 * um timeout/502 pode ocorrer depois de o servidor ter processado a operação.
 * Isso evita duplicidade de pagamentos, assinaturas e outras mutações.
 *
 * Mantém a base que funcionou por 5 min (sticky) para não ficar oscilando.
 * IMPORTANTE: para dados iguais nos dois hosts, use o MESMO DATABASE_URL (Postgres).
 */

const STICKY_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 12_000;

const CANONICAL_API_URL = 'https://api.filtraai.com';
const OBSOLETE_API_HOSTS = new Set(['filtra-ai-dot-api.onrender.com']);

function isObsoleteApiBase(base: string): boolean {
  try {
    return OBSOLETE_API_HOSTS.has(new URL(base).host);
  } catch {
    return false;
  }
}

let stickyBase: string | null = null;
let stickyUntil = 0;

function stripSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

export function listApiBases(): string[] {
  const primary =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
      ? 'http://127.0.0.1:5000'
      : '');
  const backup =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL_BACKUP) || '';
  const extras =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URLS
      ? process.env.NEXT_PUBLIC_API_URLS.split(',')
      : []
    )
      .map((s) => s.trim())
      .filter(Boolean);

  const raw = [primary, backup, ...extras].map(stripSlash).filter(Boolean);
  const bases = [...new Set(raw)].filter((base) => !isObsoleteApiBase(base));
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !bases.includes(CANONICAL_API_URL)
  ) {
    bases.push(CANONICAL_API_URL);
  }
  return bases;
}

export function getApiBase(): string {
  if (stickyBase && Date.now() < stickyUntil) return stickyBase;
  return listApiBases()[0] || 'http://127.0.0.1:5000';
}

export function getActiveApiBase(): string | null {
  return stickyBase && Date.now() < stickyUntil ? stickyBase : null;
}

function orderedBases(): string[] {
  const bases = listApiBases();
  if (stickyBase && Date.now() < stickyUntil) {
    return [stickyBase, ...bases.filter((b) => b !== stickyBase)];
  }
  return bases;
}

function shouldFailoverStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 521 || status === 522;
}

function isSafeToRetry(method?: string): boolean {
  const normalized = (method || 'GET').toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS';
}

export type ApiFetchOptions = RequestInit & {
  /** Timeout por tentativa (ms). Default 12s. */
  timeoutMs?: number;
  /** Se true, não faz failover (só tenta a base sticky/primary). */
  noFailover?: boolean;
};

/**
 * fetch com failover automático entre as bases configuradas.
 * path: '/api/health' ou 'api/health'
 *
 * Somente GET/HEAD/OPTIONS podem ser repetidos em outra base. Para métodos
 * mutáveis, a primeira resposta (inclusive 5xx) é devolvida sem replay.
 * Se houver falha de rede/timeout numa mutação, a função lança erro e não
 * tenta outra base, pois o resultado da operação pode ser indeterminado.
 */
export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const pathNorm = path.startsWith('/') ? path : `/${path}`;
  const { timeoutMs = DEFAULT_TIMEOUT_MS, noFailover, ...fetchInit } = init;
  const safeToRetry = isSafeToRetry(fetchInit.method);
  const bases = noFailover || !safeToRetry ? [getApiBase()] : orderedBases();
  const errors: string[] = [];

  for (const base of bases) {
    const controller = new AbortController();
    const external = fetchInit.signal;
    const onAbort = () => controller.abort();
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (external?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const res = await fetch(`${base}${pathNorm}`, {
        ...fetchInit,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (external) external.removeEventListener('abort', onAbort);

      if (shouldFailoverStatus(res.status) && safeToRetry && !noFailover) {
        errors.push(`${base} → HTTP ${res.status}`);
        continue;
      }

      stickyBase = base;
      stickyUntil = Date.now() + STICKY_MS;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('filtra_api_base', base);
        }
      } catch {
        /* ignore */
      }
      return res;
    } catch (e: any) {
      clearTimeout(timer);
      if (external) external.removeEventListener('abort', onAbort);
      if (e?.name === 'AbortError' && external?.aborted) throw e;
      const msg = e?.name === 'AbortError' ? 'timeout/abort' : e?.message || 'network';
      errors.push(`${base} → ${msg}`);
      if (!safeToRetry || noFailover) break;
    }
  }

  const err = new Error(
    `Nenhuma API disponível (${bases.length} tentada(s)). ${errors.join(' | ')}`
  );
  (err as any).name = 'ApiFailoverError';
  throw err;
}

/** Probe rápido de /api/health em todas as bases (debug / admin). */
export async function probeApiBases(): Promise<
  { base: string; ok: boolean; ms: number; detail?: string }[]
> {
  const out: { base: string; ok: boolean; ms: number; detail?: string }[] = [];
  for (const base of listApiBases()) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      out.push({
        base,
        ok: res.ok,
        ms: Date.now() - t0,
        detail: res.ok ? 'ok' : `HTTP ${res.status}`,
      });
    } catch (e: any) {
      out.push({ base, ok: false, ms: Date.now() - t0, detail: e?.message || 'fail' });
    }
  }
  return out;
}

/** Restaura sticky da sessão (opcional no boot do cliente). */
export function restoreStickyFromSession() {
  try {
    const b = sessionStorage.getItem('filtra_api_base');
    if (b && listApiBases().includes(b)) {
      stickyBase = b;
      stickyUntil = Date.now() + STICKY_MS;
    }
  } catch {
    /* ignore */
  }
}
