/**
 * DSV4 Fase 3.4 — Etapa 3: tolerância a falhas de KV e de cache.
 * Alvos: EF-11 (KV.get derruba a requisição) e EF-12 (cache.put/match derrubam a resposta).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FakeKV, FakeCache, installFetch, setClock, resetClock, WORKER_ENV, getReq, freshWorker,
  hmacSha1, postWebhook,
} from './support/dsv4Harness.ts';

const T0 = 1_800_000_000_000;
const HTML = { 'content-type': 'text/html' };
const seedPrimary = (kv: FakeKV) => kv.seed('active_origin', { origin: 'primary', changedAt: T0, reason: 'test', nextProbeAt: 0 });

test('T1 [controle] caminho saudavel entrega 200 com proveniencia', async () => {
  const kv = new FakeKV(); seedPrimary(kv);
  const cache = new FakeCache().install();
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async () => new Response('<html>ok</html>', { status: 200, headers: HTML }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-filtra-failover-origin'), 'render-frontend-runtime');
    assert.equal(cache.putCalls.length, 1, 'deve aquecer o cache uma vez');
  } finally { stub.restore(); resetClock(); }
});

test('T2 [EF-11] falha de KV.get degrada para primary sem rejeitar', async () => {
  const kv = new FakeKV({ failGet: true });
  new FakeCache().install();
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async () => new Response('<html>ok</html>', { status: 200, headers: HTML }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(res.status, 200, 'deve servir do primary mesmo sem KV');
  } finally { stub.restore(); resetClock(); }
});

test('T3 [EF-11] falha de KV.get com cache quente entrega o cache', async () => {
  const kv = new FakeKV({ failGet: true });
  const cache = new FakeCache().install();
  cache.entries.set('https://filtraai.com/filtra-ai', {
    body: '<html>cached</html>', status: 200,
    headers: new Headers({ 'content-type': 'text/html' }), vary: '',
  });
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async () => new Response('down', { status: 503 }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(res.status, 200, 'cache deve cobrir a indisponibilidade de KV');
  } finally { stub.restore(); resetClock(); }
});

test('T4 [EF-12] falha de cache.put preserva a resposta e a proveniencia', async () => {
  const kv = new FakeKV(); seedPrimary(kv);
  new FakeCache({ failPut: true }).install();
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async () => new Response('<html>ok</html>', { status: 200, headers: HTML }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-filtra-failover-origin'), 'render-frontend-runtime');
  } finally { stub.restore(); resetClock(); }
});

test('T5 [EF-12] falha de cache.match e tratada como miss', async () => {
  const kv = new FakeKV(); seedPrimary(kv);
  new FakeCache({ failMatch: true }).install();
  const worker = await freshWorker();
  setClock(T0);
  const stub = installFetch(async () => new Response('down', { status: 503 }));
  try {
    const res = await worker.fetch(getReq(), WORKER_ENV(kv));
    assert.equal(res.status, 503, 'sem origem, deve responder 503 explicito (nao rejeitar)');
  } finally { stub.restore(); resetClock(); }
});

test('T6 [EF-18, fora do escopo 3.4] falha de KV.put no webhook nao marca evento como processado', async () => {
  const kv = new FakeKV({ failPut: true });
  new FakeCache().install();
  const worker = await freshWorker();
  const body = JSON.stringify({ eventId: 'evt-err', thresholdPercent: 100 });
  const sig = await hmacSha1(body, 'vercel-secret');
  setClock(T0);
  const stub = installFetch(async () => new Response('upstream', { status: 200 }));
  let outcome = 'resolved';
  try {
    await worker.fetch(postWebhook(body, sig), WORKER_ENV(kv));
  } catch (e) {
    outcome = 'rejected: ' + (e as Error).message;
  } finally { stub.restore(); }
  try {
    assert.equal(kv.raw('processed_event:evt-err'), null, 'evento nao pode ser marcado se a escrita falhou');
    assert.equal(outcome, 'resolved', 'falha de escrita deve ser erro explicito, nao rejeicao nao tratada');
  } finally { resetClock(); }
});
