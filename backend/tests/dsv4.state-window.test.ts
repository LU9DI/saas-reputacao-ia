/**
 * DSV4 Fase 3.4 — Etapa 2: estado e janela sticky de 6 h.
 * Alvos: EF-01 (janela de 5 min), EF-02 (escritor sem nextProbeAt), EF-03 (leitor zera a janela).
 * Controles positivos (F3, F6) provam que o harness observa o comportamento correto.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FakeKV, FakeCache, installFetch, installCloudflareApi, setClock, advance, resetClock,
  WORKER_ENV, getReq, hmacSha1, postWebhook, freshWorker, freshModule,
  STICKY_6H, HOUR, withCloudflareEnv,
} from './support/dsv4Harness.ts';

const STATE_MOD = 'frontend/src/app/lib/failoverState.ts';
const API_MOD = 'frontend/src/app/utils/apiFailover.ts';
const T0 = 1_800_000_000_000;

test('F1 [EF-02] setFailoverState grava nextProbeAt = changedAt + 6h', async () => {
  setClock(T0); withCloudflareEnv();
  const api = installCloudflareApi();
  try {
    const mod = await freshModule<{
      setFailoverState: (o: string, r: string, e?: string) => Promise<{ origin: string }>;
    }>(STATE_MOD);
    const written = await mod.setFailoverState('fallback', 'spend-threshold-100', 'evt-1');
    assert.equal(api.writes.length, 1, 'deve haver exatamente uma escrita');
    const payload = JSON.parse(api.writes[0].body);
    assert.equal(payload.origin, 'fallback');
    assert.equal(payload.changedAt, T0);
    assert.equal(typeof payload.nextProbeAt, 'number', 'nextProbeAt deve existir no payload');
    const window = payload.nextProbeAt - payload.changedAt;
    assert.ok(window >= STICKY_6H && window <= STICKY_6H * 1.15,
      `janela esperada em [${STICKY_6H}, ${STICKY_6H * 1.15}], obtida ${window}`);
    assert.equal(written.origin, 'fallback');
  } finally { api.restore(); resetClock(); }
});

test('F2 [EF-01] sticky do frontend persiste por 6h (nao 5 min)', async () => {
  setClock(T0);
  process.env.NEXT_PUBLIC_API_URL = 'https://a.example';
  process.env.NEXT_PUBLIC_API_URL_BACKUP = 'https://b.example';
  delete process.env.NEXT_PUBLIC_API_URLS;
  const stub = installFetch(async (url) => (url.startsWith('https://a.example')
    ? new Response('down', { status: 503 })
    : new Response('ok', { status: 200 })));
  try {
    const mod = await freshModule<{
      apiFetch: (p: string, init?: Record<string, unknown>) => Promise<Response>;
      getApiBase: () => string;
    }>(API_MOD);
    await mod.apiFetch('/api/health');
    assert.equal(mod.getApiBase(), 'https://b.example', 'sticky deve ser a base que respondeu');
    advance(5 * 60 * 1000 + 1_000);
    assert.equal(mod.getApiBase(), 'https://b.example', 'sticky de 6h deveria permanecer em 5min+1s');
    advance(STICKY_6H - 5 * 60 * 1000);
    assert.equal(mod.getApiBase(), 'https://a.example', 'apos 6h o sticky deve expirar');
  } finally { stub.restore(); resetClock(); }
});

test('F3 [controle] worker respeita nextProbeAt explicito: 0 probes antes, 1 depois', async () => {
  const kv = new FakeKV();
  kv.seed('active_origin', { origin: 'fallback', changedAt: T0, reason: 'spend-threshold-100', nextProbeAt: T0 + STICKY_6H });
  new FakeCache().install();
  const worker = await freshWorker();

  setClock(T0 + 60_000);
  let stub = installFetch(async () => new Response('<html>primary</html>', { status: 200, headers: { 'content-type': 'text/html' } }));
  try {
    await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(stub.hostCount('primary.example.com'), 0, 'nao pode sondar antes da janela');
    assert.equal(kv.state()?.origin, 'fallback');
  } finally { stub.restore(); }

  setClock(T0 + STICKY_6H + 1);
  stub = installFetch(async () => new Response('<html>primary</html>', { status: 200, headers: { 'content-type': 'text/html' } }));
  try {
    await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(stub.hostCount('primary.example.com'), 1, 'deve sondar exatamente 1 vez apos a janela');
    assert.equal(kv.state()?.origin, 'primary', 'probe bem-sucedido recupera');
  } finally { stub.restore(); resetClock(); }
});

test('F4 [EF-02/EF-03] estado gravado pelo frontend nao causa recuperacao imediata', async () => {
  setClock(T0); withCloudflareEnv();
  const api = installCloudflareApi();
  let frontendPayload = '';
  try {
    const mod = await freshModule<{ setFailoverState: (o: string, r: string, e?: string) => Promise<unknown> }>(STATE_MOD);
    await mod.setFailoverState('fallback', 'spend-threshold-100', 'evt-9');
    frontendPayload = api.writes[0].body;
  } finally { api.restore(); }

  const kv = new FakeKV();
  kv.seed('active_origin', frontendPayload);
  new FakeCache().install();
  const worker = await freshWorker();
  setClock(T0 + 60_000);
  const stub = installFetch(async () => new Response('<html>vercel</html>', { status: 200, headers: { 'content-type': 'text/html' } }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(stub.hostCount('primary.example.com'), 0, 'nao pode sondar 1 min apos o failover');
    assert.equal(kv.state()?.origin, 'fallback', 'failover por orcamento deve sobreviver');
    assert.notEqual(res.headers.get('x-filtra-failover-origin'), 'primary', 'nao pode servir primary');
  } finally { stub.restore(); resetClock(); }
});

test('F5 [EF-03] nextProbeAt invalido e tratado de forma conservadora', async () => {
  const kv = new FakeKV();
  kv.seed('active_origin', { origin: 'fallback', changedAt: T0, reason: 'spend-threshold-100', nextProbeAt: 'not-a-number' });
  new FakeCache().install();
  const worker = await freshWorker();
  setClock(T0 + 60_000);
  const stub = installFetch(async () => new Response('ok', { status: 200 }));
  try {
    await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(stub.hostCount('primary.example.com'), 0,
      'nextProbeAt invalido nao pode ser interpretado como 0 (janela aberta)');
  } finally { stub.restore(); resetClock(); }
});

test('F6 [controle] mesmo eventId grava estado uma unica vez', async () => {
  const kv = new FakeKV();
  kv.seed('active_origin', { origin: 'primary', changedAt: T0, reason: 'test', nextProbeAt: 0 });
  new FakeCache().install();
  const worker = await freshWorker();
  const body = JSON.stringify({ eventId: 'evt-100', thresholdPercent: 100, budgetAmount: 100, currentSpend: 100 });
  const sig = await hmacSha1(body, 'vercel-secret');
  const stub = installFetch(async () => new Response('upstream', { status: 200 }));
  try {
    setClock(T0);
    await worker.fetch(postWebhook(body, sig), WORKER_ENV(kv));
    const afterFirst = kv.puts;
    setClock(T0 + 1_000);
    const dup = await worker.fetch(postWebhook(body, sig), WORKER_ENV(kv));
    assert.match(await dup.text(), /duplicate/);
    assert.equal(kv.puts, afterFirst, 'reenvio de evento ja processado nao escreve nada');
    assert.equal(kv.state()?.changedAt, T0, 'changedAt nao pode ser renovado');
  } finally { stub.restore(); resetClock(); }
});

test('F7 [REQ-STATE-07, fora do escopo 3.4] 5 requisicoes concorrentes geram no maximo 1 probe', async () => {
  const kv = new FakeKV({ latencyMs: 8 });
  kv.seed('active_origin', { origin: 'fallback', changedAt: T0 - HOUR, reason: 'x', nextProbeAt: T0 });
  new FakeCache().install();
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async (url) => (url.includes('primary.example.com')
    ? new Response('down', { status: 503 })
    : new Response('fb', { status: 200 })));
  try {
    await Promise.all(Array.from({ length: 5 }, () => worker.fetch(getReq(), WORKER_ENV(kv))));
    const probes = stub.hostCount('primary.example.com');
    assert.equal(probes, 1, `esperado 1 probe, observado ${probes}`);
  } finally { stub.restore(); resetClock(); }
});

