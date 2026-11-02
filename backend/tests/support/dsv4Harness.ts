/**
 * DSV4 Fase 3.4 — harness isolado de testes.
 *
 * Duplês fiéis para os módulos de failover:
 *  - clock injetado (Date.now congelável, avanço explícito);
 *  - FakeKV com latência, falhas injetáveis e log de escritas;
 *  - FakeCache com observação de leitura/escrita, Vary e falhas;
 *  - fetch instrumentado com AbortSignal observável;
 *  - streams controláveis.
 *
 * Regra: nenhum teste pode depender de relógio real ou de espera arbitrária,
 * exceto a suíte de deadline, que mede duração real em escala reduzida.
 */

export const HOUR = 3_600_000;
export const STICKY_6H = 6 * HOUR;

/* ------------------------------------------------------------------ clock */
const realNow = Date.now;
let fakeNow: number | null = null;

export function setClock(t: number): void { fakeNow = t; }
export function advance(ms: number): void {
  if (fakeNow === null) throw new Error('advance() exige setClock() antes');
  fakeNow += ms;
}
export function resetClock(): void { fakeNow = null; }
Date.now = () => (fakeNow === null ? realNow() : fakeNow);
export function realNowMs(): number { return realNow(); }

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

/* -------------------------------------------------------------------- KV  */
export type KVOptions = {
  latencyMs?: number;
  failGet?: boolean;
  failPut?: boolean;
  failPutNth?: number | null;
};

export type KVPut = { key: string; value: string; options?: { expirationTtl?: number } };

export class FakeKV {
  data = new Map<string, string>();
  opts: Required<KVOptions>;
  gets = 0;
  puts = 0;
  putLog: KVPut[] = [];
  keyGets: string[] = [];
  keyPuts: string[] = [];

  constructor(opts: KVOptions = {}) {
    this.opts = { latencyMs: 0, failGet: false, failPut: false, failPutNth: null, ...opts };
  }

  async get(key: string): Promise<string | null> {
    this.gets += 1;
    this.keyGets.push(key);
    await sleep(this.opts.latencyMs);
    if (this.opts.failGet) throw new Error('KV GET 500');
    return this.data.get(key) ?? null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.puts += 1;
    this.keyPuts.push(key);
    await sleep(this.opts.latencyMs);
    if (this.opts.failPut) throw new Error('KV PUT 500');
    if (this.opts.failPutNth && this.puts === this.opts.failPutNth) throw new Error('KV PUT 500 (nth)');
    this.putLog.push({ key, value, options });
    this.data.set(key, value);
  }

  seed(key: string, value: unknown): void {
    this.data.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  raw(key: string): string | null { return this.data.get(key) ?? null; }

  state(): Record<string, unknown> | null {
    const raw = this.raw('active_origin');
    return raw ? JSON.parse(raw) : null;
  }
}

/* ----------------------------------------------------------------- cache  */
export type CacheOptions = {
  failPut?: boolean;
  failMatch?: boolean;
  latencyMs?: number;
  honorVary?: boolean;
};

export type CachedEntry = {
  body: string;
  status: number;
  headers: Headers;
  vary: string;
};

export type CachePutCall = { url: string; setCookie: string | null; vary: string | null };

export class FakeCache {
  entries = new Map<string, CachedEntry>();
  opts: Required<CacheOptions>;
  matchCalls: string[] = [];
  putCalls: CachePutCall[] = [];

  constructor(opts: CacheOptions = {}) {
    this.opts = { failPut: false, failMatch: false, latencyMs: 0, honorVary: true, ...opts };
  }

  keyFor(request: Request): string {
    if (!this.opts.honorVary) return request.url;
    const stored = this.entries.get(request.url);
    const vary = stored?.vary ?? '';
    if (!vary) return request.url;
    const fields = vary.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    return request.url + '#' + fields.map((f) => f + '=' + (request.headers.get(f) ?? '')).join('&');
  }

  async match(request: Request): Promise<Response | undefined> {
    this.matchCalls.push(request.url);
    await sleep(this.opts.latencyMs);
    if (this.opts.failMatch) throw new Error('cache.match failed');
    const hit = this.entries.get(this.keyFor(request));
    if (!hit) return undefined;
    return new Response(hit.body, { status: hit.status, headers: hit.headers });
  }

  async put(request: Request, response: Response): Promise<void> {
    const headers = new Headers(response.headers);
    this.putCalls.push({ url: request.url, setCookie: headers.get('set-cookie'), vary: headers.get('vary') });
    await sleep(this.opts.latencyMs);
    if (this.opts.failPut) throw new Error('cache.put failed');
    const body = await response.text();
    const vary = headers.get('vary') ?? '';
    const fields = vary.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const suffix = fields.length ? '#' + fields.map((f) => f + '=' + (request.headers.get(f) ?? '')).join('&') : '';
    this.entries.set(request.url + suffix, { body, status: response.status, headers, vary });
  }

  install(): this {
    (globalThis as unknown as { caches: unknown }).caches = { default: this };
    return this;
  }
}

/* ------------------------------------------------------------ fetch stub  */
export type FetchCall = {
  url: string;
  init: RequestInit | undefined;
  signal: AbortSignal | undefined;
  start: number;
};

export type FetchStub = {
  calls: FetchCall[];
  restore: () => void;
  hostCount: (host: string) => number;
};

export type FetchHandler = (url: string, init: RequestInit | undefined, call: FetchCall) => Promise<Response>;

export function installFetch(handler: FetchHandler): FetchStub {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const call: FetchCall = { url, init, signal: signal ?? undefined, start: realNowMs() };
    calls.push(call);
    return handler(url, init, call);
  }) as typeof globalThis.fetch;
  return {
    calls,
    restore: () => { globalThis.fetch = original; },
    hostCount: (host: string) => calls.filter((c) => c.url.includes(host)).length,
  };
}

export type CFWrite = { key: string; body: string; ttl: number | null };

/** Intercepta a API REST do Cloudflare usada por failoverState.ts. */
export function installCloudflareApi(store = new Map<string, string>()): {
  store: Map<string, string>;
  writes: CFWrite[];
  restore: () => void;
} {
  const writes: CFWrite[] = [];
  const stub = installFetch(async (url, init) => {
    const method = (init?.method || 'GET').toUpperCase();
    const key = decodeURIComponent(url.split('/values/')[1]?.split('?')[0] ?? '');
    if (method === 'GET') {
      if (!store.has(key)) return new Response('not found', { status: 404 });
      return new Response(store.get(key), { status: 200 });
    }
    if (method === 'PUT') {
      const body = typeof init?.body === 'string' ? init.body : '';
      store.set(key, body);
      const ttl = new URL(url).searchParams.get('expiration_ttl');
      writes.push({ key, body, ttl: ttl ? Number(ttl) : null });
      return new Response('{}', { status: 200 });
    }
    return new Response('unsupported', { status: 405 });
  });
  return { store, writes, restore: stub.restore };
}

/* -------------------------------------------------------------- streams   */
export function slowStream(chunks: string[], delayMs: number): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let i = 0;
      const push = () => {
        if (i < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[i]));
          i += 1;
          setTimeout(push, delayMs);
        } else {
          controller.close();
        }
      };
      setTimeout(push, delayMs);
    },
  });
}

/* ------------------------------------------------------------- helpers    */
export const REPO_ROOT_URL = new URL('../../../', import.meta.url);
export const REPO_ROOT = REPO_ROOT_URL.pathname;

let modCounter = 0;

/**
 * Importa uma cópia temporária do módulo com identidade própria.
 * O caminho é relativo à raiz do repositório (não ao arquivo deste harness).
 * O arquivo temporário fica no mesmo diretório para preservar imports relativos.
 */
export async function freshModule<T = Record<string, unknown>>(repoPath: string): Promise<T> {
  modCounter += 1;

  const targetUrl = new URL(repoPath.replace(/^\/+/, ''), REPO_ROOT_URL);
  const extension = targetUrl.pathname.match(/\.[^/.]+$/)?.[0] ?? '.ts';
  const tempUrl = new URL(targetUrl.href);

  tempUrl.pathname =
    `${targetUrl.pathname.slice(0, -extension.length)}.dsv4-${modCounter}${extension}`;

  const { copyFile, unlink } = await import('node:fs/promises');
  await copyFile(targetUrl, tempUrl);

  try {
    return (await import(tempUrl.href)) as T;
  } finally {
    await unlink(tempUrl).catch(() => undefined);
  }
}

export async function freshWorker(): Promise<{
  fetch: (request: Request, env: unknown, ctx?: unknown) => Promise<Response>;
}> {
  intervalCounterReset();
  return (await import('../../../infra/cloudflare/worker.js')).default as {
    fetch: (request: Request, env: unknown, ctx?: unknown) => Promise<Response>;
  };
}

function intervalCounterReset(): void { /* reservado para isolamento futuro */ }

export type WorkerEnv = Record<string, unknown>;

export const WORKER_ENV = (kv: FakeKV, extra: WorkerEnv = {}): WorkerEnv => ({
  FAILOVER_ORIGIN: kv,
  PRIMARY_ORIGIN: 'https://primary.example.com',
  FALLBACK_ORIGIN: 'https://fallback.example.com',
  VERCEL_WEBHOOK_SECRET: 'vercel-secret',
  FAILOVER_MONITOR_SECRET: 'monitor-secret',
  RECOVERY_PROBE_INTERVAL_MS: String(STICKY_6H),
  ...extra,
});

export function getReq(path = '/filtra-ai', headers: Record<string, string> = {}): Request {
  return new Request('https://filtraai.com' + path, { method: 'GET', headers });
}

export async function hmacSha1(body: string, secret: string): Promise<string> {
  const { createHmac } = await import('node:crypto');
  return createHmac('sha1', secret).update(body, 'utf8').digest('hex');
}

export function postWebhook(body: string, signature: string): Request {
  return new Request('https://filtraai.com/_failover/vercel', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vercel-signature': signature },
    body,
  });
}

export function withCloudflareEnv(): void {
  process.env.CLOUDFLARE_ACCOUNT_ID = 'acc';
  process.env.CLOUDFLARE_KV_NAMESPACE_ID = 'ns';
  process.env.CLOUDFLARE_API_TOKEN = 'tok';
}
