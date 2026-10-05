export type FailoverOrigin = 'primary' | 'fallback';

export type FailoverState = {
  origin: FailoverOrigin;
  changedAt: number;
  reason: string;
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
  if (!raw) return { origin: 'primary', changedAt: 0, reason: 'default' };
  try {
    const parsed = JSON.parse(raw) as Partial<FailoverState>;
    return {
      origin: parsed.origin === 'fallback' ? 'fallback' : 'primary',
      changedAt: Number(parsed.changedAt) || 0,
      reason: String(parsed.reason || 'unknown'),
      ...(parsed.eventId ? { eventId: String(parsed.eventId) } : {}),
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state-reset' };
  }
}

export async function setFailoverState(origin: FailoverOrigin, reason: string, eventId?: string): Promise<FailoverState> {
  const state: FailoverState = {
    origin,
    changedAt: Date.now(),
    reason,
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
