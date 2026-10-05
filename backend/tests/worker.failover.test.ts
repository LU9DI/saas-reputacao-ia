import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../infra/cloudflare/worker.js';

class FakeKV {
  private data = new Map<string, string>();
  async get(key: string) { return this.data.get(key) ?? null; }
  async put(key: string, value: string) { this.data.set(key, value); }
}

class FakeCache {
  private data = new Map<string, Response>();
  async match(request: Request) {
    const hit = this.data.get(request.url);
    return hit ? new Response(hit.body, hit) : undefined;
  }
  async put(request: Request, response: Response) {
    this.data.set(request.url, response);
  }
}

function installCaches(cache: FakeCache) {
  (globalThis as any).caches = { default: cache };
}

function request(path = '/health') {
  return new Request('https://filtraai.com' + path, { method: 'GET' });
}

test('primary response is used and warmed into Cloudflare cache', async () => {
  const kv = new FakeKV();
  const cache = new FakeCache();
  installCaches(cache);
  await kv.put('active_origin', JSON.stringify({ origin: 'primary', changedAt: Date.now(), reason: 'test', nextProbeAt: 0 }));

  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    return new Response('primary:' + url, { status: 200 });
  };

  try {
    const response = await worker.fetch(request('/filtra-ai'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);

    assert.equal(response.status, 200);
    assert.match(await response.text(), /primary\.example\.com/);
    const cached = await cache.match(request('/filtra-ai'));
    assert.ok(cached);
  } finally {
    globalThis.fetch = original;
  }
});

test('primary failure serves cached page and persists fallback state', async () => {
  const kv = new FakeKV();
  const cache = new FakeCache();
  installCaches(cache);
  await cache.put(request('/filtra-ai'), new Response('<html>cached</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  }));
  await kv.put('active_origin', JSON.stringify({ origin: 'primary', changedAt: Date.now(), reason: 'test', nextProbeAt: 0 }));

  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('down', { status: 503 });

  try {
    const response = await worker.fetch(request('/filtra-ai'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);

    assert.equal(response.status, 200);
    assert.match(await response.text(), /cached/);
    assert.equal(response.headers.get('x-filtra-failover-origin'), 'cloudflare-cache');

    const state = JSON.parse((await kv.get('active_origin'))!);
    assert.equal(state.origin, 'fallback');
  } finally {
    globalThis.fetch = original;
  }
});

test('fallback mode probes primary and recovers', async () => {
  const kv = new FakeKV();
  const cache = new FakeCache();
  installCaches(cache);
  await kv.put('active_origin', JSON.stringify({
    origin: 'fallback',
    changedAt: Date.now() - 600_000,
    reason: 'test',
    nextProbeAt: 0,
  }));

  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    return new Response('recovered:' + url, { status: 200 });
  };

  try {
    const response = await worker.fetch(request('/filtra-ai'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);

    assert.equal(response.status, 200);
    assert.match(await response.text(), /primary\.example\.com/);
    const state = JSON.parse((await kv.get('active_origin'))!);
    assert.equal(state.origin, 'primary');
  } finally {
    globalThis.fetch = original;
  }
});


async function hmacSha1(body: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

test('Cloudflare worker verifies spend webhook and switches to fallback', async () => {
  const kv = new FakeKV();
  const cache = new FakeCache();
  installCaches(cache);
  const payload = JSON.stringify({
    eventId: 'evt-100',
    budgetAmount: 100,
    currentSpend: 100,
    thresholdPercent: 100,
  });
  const signature = await hmacSha1(payload, 'vercel-secret');

  const response = await worker.fetch(
    new Request('https://filtraai.com/_failover/vercel', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-signature': signature,
      },
      body: payload,
    }),
    {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      VERCEL_WEBHOOK_SECRET: 'vercel-secret',
      FAILOVER_MONITOR_SECRET: 'monitor-secret',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any,
  );

  assert.equal(response.status, 200);
  const state = JSON.parse((await kv.get('active_origin'))!);
  assert.equal(state.origin, 'fallback');

  const duplicate = await worker.fetch(
    new Request('https://filtraai.com/_failover/vercel', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-signature': signature,
      },
      body: payload,
    }),
    {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      VERCEL_WEBHOOK_SECRET: 'vercel-secret',
      FAILOVER_MONITOR_SECRET: 'monitor-secret',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any,
  );

  assert.equal(duplicate.status, 200);
  assert.match(await duplicate.text(), /duplicate/);
});
