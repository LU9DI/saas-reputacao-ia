import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../infra/cloudflare/worker.js';

class FakeKV {
  private data = new Map<string, string>();
  async get(key: string) { return this.data.get(key) ?? null; }
  async put(key: string, value: string) { this.data.set(key, value); }
}

function request(path = '/health') {
  return new Request('https://filtraai.com' + path, { method: 'GET' });
}

test('primary origin is used when KV says primary', async () => {
  const kv = new FakeKV();
  await kv.put('active_origin', JSON.stringify({ origin: 'primary', changedAt: Date.now(), reason: 'test' }));
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    return new Response('primary:' + url, { status: 200 });
  };

  try {
    const response = await worker.fetch(request('/page'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      FALLBACK_ORIGIN: 'https://fallback.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /primary\.example\.com/);
  } finally {
    globalThis.fetch = original;
  }
});

test('primary failure switches request to fallback and persists state', async () => {
  const kv = new FakeKV();
  await kv.put('active_origin', JSON.stringify({ origin: 'primary', changedAt: Date.now(), reason: 'test' }));
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push(url);
    if (url.includes('primary.example.com')) return new Response('down', { status: 503 });
    return new Response('fallback', { status: 200 });
  };

  try {
    const response = await worker.fetch(request('/page'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      FALLBACK_ORIGIN: 'https://fallback.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    const state = JSON.parse((await kv.get('active_origin'))!);
    assert.equal(state.origin, 'fallback');
  } finally {
    globalThis.fetch = original;
  }
});

test('fallback mode probes primary and recovers', async () => {
  const kv = new FakeKV();
  await kv.put('active_origin', JSON.stringify({
    origin: 'fallback',
    changedAt: Date.now() - 600_000,
    reason: 'test',
    nextProbeAt: 0,
  }));
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push(url);
    return new Response(url, { status: 200 });
  };

  try {
    const response = await worker.fetch(request('/page'), {
      FAILOVER_ORIGIN: kv,
      PRIMARY_ORIGIN: 'https://primary.example.com',
      FALLBACK_ORIGIN: 'https://fallback.example.com',
      RECOVERY_PROBE_INTERVAL_MS: '300000',
    } as any);
    assert.equal(response.status, 200);
    assert.equal(calls.some((u) => u.includes('primary.example.com')), true);
    const state = JSON.parse((await kv.get('active_origin'))!);
    assert.equal(state.origin, 'primary');
  } finally {
    globalThis.fetch = original;
  }
});
