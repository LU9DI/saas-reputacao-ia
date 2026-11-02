/**
 * DSV4 Fase 3.4 — Etapa 4: deadline global.
 * Alvo: EF-14 (timeout por tentativa em vez de deadline compartilhado).
 * Orçamentos reduzidos (escala 1:100) preservam a estrutura matemática:
 *   D = R + sum(a_i) + sum(b_k),  a = floor((D - R - B(N)) / N),  N_max = 5 (F-01).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { installFetch, freshModule, realNowMs, type FetchStub } from './support/dsv4Harness.ts';

const API_MOD = 'frontend/src/app/utils/apiFailover.ts';
const DEADLINE = 1200;
const EPS = 50;

type ApiMod = {
  apiFetch: (p: string, init?: Record<string, unknown>) => Promise<Response>;
};

function hangingFetch(): FetchStub {
  return installFetch((_url, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal as AbortSignal | undefined;
    if (!signal) return;
    if (signal.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }
    signal.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')), { once: true });
  }));
}

function withBases(): void {
  process.env.NEXT_PUBLIC_API_URL = 'https://a.example';
  process.env.NEXT_PUBLIC_API_URL_BACKUP = 'https://b.example';
  process.env.NEXT_PUBLIC_API_URLS = 'https://c.example,https://d.example';
  process.env.NODE_ENV = 'production';
}

test('D1 [EF-14] deadline global limita o total de todas as tentativas', async () => {
  withBases();
  const stub = hangingFetch();
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const t0 = realNowMs();
    let error: unknown = null;
    try { await mod.apiFetch('/api/health', { timeoutMs: 90, deadlineMs: DEADLINE }); } catch (e) { error = e; }
    const elapsed = realNowMs() - t0;
    assert.ok(error, 'deve falhar quando todas as bases penduram');
    assert.ok(elapsed <= DEADLINE + EPS, `elapsed=${elapsed}ms excede deadline=${DEADLINE}ms + ${EPS}ms`);
  } finally { stub.restore(); }
});

test('D2 [EF-14] nenhuma tentativa inicia apos o deadline', async () => {
  withBases();
  const stub = hangingFetch();
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const t0 = realNowMs();
    try { await mod.apiFetch('/api/health', { timeoutMs: 90, deadlineMs: DEADLINE }); } catch { /* esperado */ }
    const startOffsets = stub.calls.map((c) => c.start - t0);
    assert.ok(stub.calls.length >= 1, 'deve haver tentativas');
    assert.ok(startOffsets.every((s) => s <= DEADLINE),
      `tentativas iniciadas em ${JSON.stringify(startOffsets)} (deadline ${DEADLINE})`);
  } finally { stub.restore(); }
});

test('D3 [EF-14] tentativas consumidas respeitam o orcamento (nao N x timeout)', async () => {
  withBases();
  const stub = hangingFetch();
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const t0 = realNowMs();
    try { await mod.apiFetch('/api/health', { timeoutMs: 90, deadlineMs: DEADLINE }); } catch { /* esperado */ }
    const elapsed = realNowMs() - t0;
    const worst = 5 * 90; // modelo por tentativa com 5 bases (F-01)
    assert.ok(elapsed < worst, `elapsed=${elapsed}ms nao pode se aproximar de ${worst}ms`);
  } finally { stub.restore(); }
});

test('D4 [controle] sucesso imediato nao e penalizado pelo deadline', async () => {
  withBases();
  const stub = installFetch(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const t0 = realNowMs();
    const res = await mod.apiFetch('/api/health', { timeoutMs: 90, deadlineMs: DEADLINE });
    const elapsed = realNowMs() - t0;
    assert.equal(res.status, 200);
    assert.ok(elapsed < DEADLINE, `sucesso em ${elapsed}ms deve caber no orcamento`);
    assert.equal(stub.calls.length, 1, 'nao deve tentar outras bases');
  } finally { stub.restore(); }
});

test('D5 [controle] cancelamento do cliente e propagado sem tentar mais bases', async () => {
  withBases();
  const stub = hangingFetch();
  const ac = new AbortController();
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const p = mod.apiFetch('/api/health', { timeoutMs: 5000, deadlineMs: 5000, signal: ac.signal });
    await new Promise((r) => setTimeout(r, 20));
    ac.abort();
    let name: string | null = null;
    try { await p; } catch (e) { name = (e as Error)?.name ?? null; }
    assert.equal(name, 'AbortError', 'deve rejeitar com AbortError');
    assert.equal(stub.calls.length, 1, 'nao pode continuar apos o abort do cliente');
  } finally { stub.restore(); }
});


test('D7 [EF-14] corpo de resposta retryable e cancelado antes do failover', async () => {
  withBases();
  let bodyCancelled = false;
  const stub = installFetch(async (url) => {
    if (url.startsWith('https://a.example')) {
      const body = new ReadableStream<Uint8Array>({
        cancel() { bodyCancelled = true; },
      });
      return new Response(body, { status: 503 });
    }
    return new Response('ok', { status: 200 });
  });
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const response = await mod.apiFetch('/api/health');
    assert.equal(response.status, 200);
    assert.equal(bodyCancelled, true, 'corpo 503 deve ser cancelado antes da segunda base');
    assert.equal(stub.calls.length, 2);
  } finally { stub.restore(); }
});

test('D8 [EF-14] cancelamento pendente do body nao bloqueia o failover', async () => {
  withBases();
  let cancelRequested = false;
  const stub = installFetch(async (url) => {
    if (url.startsWith('https://a.example')) {
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          cancelRequested = true;
          return new Promise<void>(() => { /* simula cancelamento que nunca termina */ });
        },
      });
      return new Response(body, { status: 503 });
    }
    return new Response('ok', { status: 200 });
  });
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const response = await mod.apiFetch('/api/health', { deadlineMs: DEADLINE, timeoutMs: 500 });
    assert.equal(response.status, 200, 'segunda base deve responder apesar do cancelamento pendente');
    await Promise.resolve();
    assert.equal(cancelRequested, true, 'o cancelamento do body deve ser solicitado');
    assert.equal(stub.calls.length, 2, 'failover deve prosseguir para a segunda base');
  } finally { stub.restore(); }
});

test('D6 [EF-14] ultima tentativa deixa reserva para a resposta (R)', async () => {
  withBases();
  const stub = hangingFetch();
  const RESERVE = 40;
  try {
    const mod = await freshModule<ApiMod>(API_MOD);
    const t0 = realNowMs();
    try { await mod.apiFetch('/api/health', { timeoutMs: 90, deadlineMs: DEADLINE, responseReserveMs: RESERVE }); } catch { /* esperado */ }
    const elapsed = realNowMs() - t0;
    assert.ok(elapsed <= DEADLINE - RESERVE + EPS,
      `elapsed=${elapsed}ms deveria parar antes de D-R=${DEADLINE - RESERVE}ms (+EPS)`);
  } finally { stub.restore(); }
});
