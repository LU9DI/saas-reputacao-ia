/**
 * Failover automático de API (estilo Groq → Gemini).
 *
 * Ordem:
 *  1. NEXT_PUBLIC_API_URL          (principal — Render)
 *  2. NEXT_PUBLIC_API_URL_BACKUP   (stand-by — Oracle / outro)
 *  3. NEXT_PUBLIC_API_URLS         (lista extra, separada por vírgula)
 *  4. https://api.filtraai.com     (canônica — garantida em produção)
 *
 * Hosts comprovadamente obsoletos (ex.: serviços descomissionados) nunca
 * entram na rotação.
 *
 * Troca quando: rede falha, timeout, ou HTTP 502/503/504.
 * Mantém a base que funcionou por 6 h (sticky) para não ficar oscilando.
 *
 * IMPORTANTE: para dados iguais nos dois hosts, use o MESMO DATABASE_URL (Postgres).
 */

/**
 * Janela sticky (DSV4 REQ-STATE-04 / D-13).
 * DEVE permanecer igual a `STICKY_WINDOW_MS` de `app/lib/failoverState.ts`
 * e a `infra/cloudflare/worker.js`: 6 horas.
 */
const STICKY_MS = 6 * 60 * 60 * 1000;
/**
 * Orçamento temporal (DSV4 REQ-TEMP-01..04 / D-10, com o achado F-01 da Fase 3.4):
 * o deadline é ÚNICO e compartilhado por todas as tentativas; o timeout de cada
 * tentativa é derivado do orçamento, nunca fixo.
 *   a = ⌊(D − R − B(N_max)) / N_max⌋,  N_max = 5  ⇒  a = 2.056 ms
 */
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_DEADLINE_MS = 12_000;
const DEFAULT_RESPONSE_RESERVE_MS = 400;
const BACKOFF_BASE_MS = 100;
const BACKOFF_MAX_MS = 400;
const BACKOFF_JITTER_RATIO = 0.2;
/** 4 bases configuráveis + a canônica garantida em produção (F-01). */
const MAX_ATTEMPTS = 5;

/**
 * API canônica de produção. É garantida na lista mesmo quando a configuração
 * (NEXT_PUBLIC_API_URL / _BACKUP / _URLS) estiver ausente ou apontar para um
 * host comprovadamente morto — o frontend nunca fica sem uma base válida.
 */
const CANONICAL_API_URL = 'https://api.filtraai.com';

/**
 * Hosts comprovadamente obsoletos (respondem erro de aplicação e não fazem
 * parte da produção). Ficam fora da rotação para não atrasar o boot nem
 * segurar o sticky num host morto.
 */
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

/** Lista de bases configuradas (sem barra no final). */
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
  // Canônica garantida em produção mesmo com env ausente/desatualizada.
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !bases.includes(CANONICAL_API_URL)
  ) {
    bases.push(CANONICAL_API_URL);
  }
  return bases;
}

/** Base preferida no momento (sticky ou primeira da lista). */
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

export type ApiFetchOptions = RequestInit & {
  /** Timeout por tentativa (ms). Default 12s. */
  timeoutMs?: number;
  /** Orçamento total compartilhado por todas as tentativas (ms). Default 12s. */
  deadlineMs?: number;
  /** Reserva após obtenção dos cabeçalhos HTTP; o consumo do body não integra o deadline (ms). */
  responseReserveMs?: number;
  /** Se true, não faz failover (só tenta a base sticky/primary). */
  noFailover?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Liga um controller a múltiplos sinais, sem depender de AbortSignal.any. */
function linkAbort(target: AbortController, sources: Array<AbortSignal | undefined>): void {
  for (const source of sources) {
    if (!source) continue;
    if (source.aborted) { target.abort(); continue; }
    source.addEventListener('abort', () => target.abort(), { once: true });
  }
}

/**
 * Budget de tentativa derivado do deadline (REQ-TEMP-02).
 * Escalas de backoff e reserva acompanham D, preservando a prova do teto.
 */
function attemptBudget(deadlineMs: number, reserveMs: number, attempts: number): {
  perAttempt: number;
  backoffBase: number;
  backoffMax: number;
} {
  const scale = deadlineMs / DEFAULT_DEADLINE_MS;
  const backoffBase = Math.max(1, Math.round(BACKOFF_BASE_MS * scale));
  const backoffMax = Math.max(backoffBase, Math.round(BACKOFF_MAX_MS * scale));
  let backoffBudget = 0;
  for (let k = 1; k <= attempts - 1; k += 1) {
    backoffBudget += Math.round(Math.min(backoffMax, backoffBase * 2 ** (k - 1)) * (1 + BACKOFF_JITTER_RATIO));
  }
  const usable = deadlineMs - reserveMs - backoffBudget;
  const perAttempt = Math.max(1, Math.min(usable > 0 ? Math.floor(usable / attempts) : 1, deadlineMs));
  return { perAttempt, backoffBase, backoffMax };
}

/** Backoff exponencial com jitter (REQ-TEMP-04). */
function backoffFor(k: number, base: number, max: number): number {
  const exponential = Math.min(max, base * 2 ** (k - 1));
  return Math.round(exponential * (1 + Math.random() * BACKOFF_JITTER_RATIO));
}

/**
 * fetch com failover automático entre as bases configuradas.
 * path: '/api/health' ou 'api/health'
 */
export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const pathNorm = path.startsWith('/') ? path : `/${path}`;
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    deadlineMs = DEFAULT_DEADLINE_MS,
    responseReserveMs,
    noFailover,
    ...fetchInit
  } = init;
  const scale = deadlineMs / DEFAULT_DEADLINE_MS;
  const reserveMs = responseReserveMs ?? Math.max(1, Math.round(DEFAULT_RESPONSE_RESERVE_MS * scale));
  const candidateBases = noFailover ? [getApiBase()] : orderedBases();
  const bases = candidateBases.slice(0, MAX_ATTEMPTS);
  const errors: string[] = [];

  const startedAt = Date.now();
  const deadlineAt = startedAt + deadlineMs;
  const { perAttempt, backoffBase, backoffMax } = attemptBudget(deadlineMs, reserveMs, bases.length);
  const external = fetchInit.signal ?? undefined;

  for (let index = 0; index < bases.length; index += 1) {
    const base = bases[index];

    // REQ-TEMP-01: nenhuma tentativa começa sem orçamento para ela + reserva.
    const remaining = deadlineAt - Date.now() - reserveMs;
    if (remaining <= 0) break;

    if (index > 0) {
      const wait = backoffFor(index, backoffBase, backoffMax);
      if (Date.now() + wait + reserveMs >= deadlineAt) break;
      await sleep(wait);
    }

    const controller = new AbortController();
    // O sinal externo permanece ligado após o sucesso para cancelar a leitura do corpo.
    linkAbort(controller, [external]);
    const budget = Math.max(1, Math.min(perAttempt, Math.max(1, timeoutMs), deadlineAt - Date.now() - reserveMs));
    const timer = setTimeout(() => controller.abort(), budget);

    try {
      if (external?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const res = await fetch(`${base}${pathNorm}`, {
        ...fetchInit,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (shouldFailoverStatus(res.status)) {
        errors.push(`${base} → HTTP ${res.status}`);
        // Libera a conexão da tentativa rejeitada antes de iniciar outra base.
        try { await res.body?.cancel(); } catch { /* corpo já consumido/fechado */ }
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
      if (e?.name === 'AbortError' && external?.aborted) throw e;
      const exhausted = Date.now() + reserveMs >= deadlineAt;
      const msg = e?.name === 'AbortError' ? 'timeout/abort' : e?.message || 'network';
      errors.push(`${base} → ${msg}`);
      if (exhausted) break;
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
