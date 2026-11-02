export type FailoverOrigin = 'primary' | 'fallback';

/**
 * Janela sticky de failover (DSV4 REQ-STATE-04 / decisão D-13).
 * Fonte da verdade do estado operacional: quando o estado muda para `fallback`,
 * nenhuma sondagem é permitida antes de `changedAt + STICKY_WINDOW_MS`.
 * DEVE permanecer alinhada a `infra/cloudflare/worker.js` (STICKY_WINDOW_MS)
 * e a `frontend/src/app/utils/apiFailover.ts` (STICKY_MS).
 */
export const STICKY_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Jitter máximo aplicado à janela, para evitar sincronismo entre colos. */
export const STICKY_JITTER_RATIO = 0.15;

/** Instante mínimo da próxima sondagem a partir de `changedAt`. */
export function stickyNextProbeAt(changedAt: number, random: () => number = Math.random): number {
  const jitter = Math.round(STICKY_WINDOW_MS * STICKY_JITTER_RATIO * random());
  return changedAt + STICKY_WINDOW_MS + jitter;
}

export type FailoverState = {
  origin: FailoverOrigin;
  changedAt: number;
  reason: string;
  /** Instante mínimo da próxima sondagem; obrigatório em todo estado gravado. */
  nextProbeAt: number;
  eventId?: string;
};

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !namespaceId || !token) {
    throw new Error('Cloudflare KV credentials are not configured');
  }
  return { accountId, namespaceId, token };
}

function valueUrl(key: string) {
  const { accountId, namespaceId } = config();
  return 'https://api.cloudflare.com/client/v4/accounts/' +
    accountId + '/storage/kv/namespaces/' + namespaceId + '/values/' +
    encodeURIComponent(key);
}

async function kvGet(key: string): Promise<string | null> {
  const { token } = config();
  const res = await fetch(valueUrl(key), {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Cloudflare KV GET failed: ' + res.status);
  return res.text();
}

async function kvPut(key: string, value: string, expirationTtl?: number): Promise<void> {
  const { token } = config();
  const url = new URL(valueUrl(key));
  if (expirationTtl) url.searchParams.set('expiration_ttl', String(Math.max(60, expirationTtl)));
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: value,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Cloudflare KV PUT failed: ' + res.status + ' ' + body);
  }
}

export async function getFailoverState(): Promise<FailoverState> {
  const raw = await kvGet('active_origin');
  if (!raw) return { origin: 'primary', changedAt: 0, reason: 'default', nextProbeAt: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<FailoverState>;
    const origin: FailoverOrigin = parsed.origin === 'fallback' ? 'fallback' : 'primary';
    const changedAt = Number(parsed.changedAt) || 0;
    const rawNext = parsed.nextProbeAt;
    const hasNext = rawNext !== undefined && rawNext !== null;
    const parsedNext = hasNext ? Number(rawNext) : Number.NaN;
    // Estado legado (sem nextProbeAt válido) não pode abrir a janela: deriva de changedAt.
    const nextProbeAt = hasNext && Number.isFinite(parsedNext)
      ? parsedNext
      : origin === 'fallback' && changedAt > 0
        ? changedAt + STICKY_WINDOW_MS
        : 0;
    return {
      origin,
      changedAt,
      reason: String(parsed.reason || 'unknown'),
      nextProbeAt,
      ...(parsed.eventId ? { eventId: String(parsed.eventId) } : {}),
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state-reset', nextProbeAt: 0 };
  }
}

export async function setFailoverState(origin: FailoverOrigin, reason: string, eventId?: string): Promise<FailoverState> {
  const changedAt = Date.now();
  const state: FailoverState = {
    origin,
    changedAt,
    reason,
    // Todo escritor grava nextProbeAt (REQ-STATE-03): a janela só existe em fallback.
    nextProbeAt: origin === 'fallback' ? stickyNextProbeAt(changedAt) : 0,
    ...(eventId ? { eventId } : {}),
  };
  await kvPut('active_origin', JSON.stringify(state));
  return state;
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
  return (await kvGet('processed_event:' + eventId)) !== null;
}

export async function markEventProcessed(eventId: string): Promise<void> {
  await kvPut('processed_event:' + eventId, JSON.stringify({ processedAt: Date.now() }), 86400);
}
