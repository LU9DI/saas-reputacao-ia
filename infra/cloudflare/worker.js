const STATE_KEY = 'active_origin';
const RETRYABLE = new Set([402, 429, 500, 502, 503, 504, 521, 522, 523, 524]);
const WEBHOOK_PATH = '/_failover/vercel';
const STATIC_ORIGIN = 'https://filtra-ai-frontend.filtra-ai.workers.dev';
const API_ORIGIN = 'https://filtra-ia-api.onrender.com';
const CACHEABLE_PREFIXES = [
  '/', '/en', '/es', '/zh',
  '/filtra-ai', '/avaliacoes-google', '/feedback-de-clientes',
  '/analise-de-avaliacoes-com-ia', '/gestao-de-reputacao-online',
  '/agencias', '/clinicas', '/franquias', '/auditoria-gratuita', '/planos',
  '/pedir-estrela-vs-filtrar', '/tourism', '/restaurants', '/hotels', '/associations', '/partners',
  '/reputacao-google', '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online', '/gestao-de-feedback', '/blog',
];

function normalizeOrigin(value) { return new URL(value).origin; }

function publicPath(pathname) {
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/painel') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname === WEBHOOK_PATH
  ) return false;
  return CACHEABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function buildTarget(origin, requestUrl) {
  const incoming = new URL(requestUrl);
  const target = new URL(normalizeOrigin(origin));
  target.pathname = incoming.pathname;
  target.search = incoming.search;
  return target.toString();
}

async function readState(env) {
  const raw = await env.FAILOVER_ORIGIN.get(STATE_KEY);
  if (!raw) return { origin: 'primary', changedAt: 0, reason: 'default', nextProbeAt: 0 };
  try {
    const state = JSON.parse(raw);
    return {
      origin: state.origin === 'fallback' ? 'fallback' : 'primary',
      changedAt: Number(state.changedAt) || 0,
      reason: String(state.reason || 'unknown'),
      nextProbeAt: Number(state.nextProbeAt) || 0,
      eventId: state.eventId ? String(state.eventId) : undefined,
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state', nextProbeAt: 0 };
  }
}

async function writeState(env, state) { await env.FAILOVER_ORIGIN.put(STATE_KEY, JSON.stringify(state)); }

async function eventProcessed(env, eventId) {
  if (!eventId) return false;
  return (await env.FAILOVER_ORIGIN.get('processed_event:' + eventId)) !== null;
}

async function markEventProcessed(env, eventId) {
  if (!eventId) return;
  await env.FAILOVER_ORIGIN.put('processed_event:' + eventId, JSON.stringify({ processedAt: Date.now() }), { expirationTtl: 86400 });
}

function safeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha1(body, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return bytesToHex(signature);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(digest);
}

async function handleFailoverWebhook(request, env) {
  const body = await request.text();
  let payload;
  try { payload = JSON.parse(body); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const vercelSignature = request.headers.get('x-vercel-signature');
  const monitorSignature = request.headers.get('x-filtra-monitor-secret');
  let source = 'vercel';
  let valid = false;

  if (monitorSignature && env.FAILOVER_MONITOR_SECRET) {
    valid = safeEqualHex(await hmacSha1(body, env.FAILOVER_MONITOR_SECRET), monitorSignature);
    source = '90pct-monitor';
  } else if (vercelSignature && env.VERCEL_WEBHOOK_SECRET) {
    valid = safeEqualHex(await hmacSha1(body, env.VERCEL_WEBHOOK_SECRET), vercelSignature);
  }

  if (!valid) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  const eventId = String(payload.eventId || await sha256(body));
  if (await eventProcessed(env, eventId)) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const threshold = Number(payload.thresholdPercent);
  let action = 'ignore';
  if (threshold >= 90) action = 'failover';
  else if (threshold === 50 || threshold === 75) action = 'observe';

  if (action === 'failover') {
    const current = await readState(env);
    const cooldownMs = 300000;
    const inCooldown = current.changedAt > 0 && Date.now() - current.changedAt < cooldownMs;

    if (current.origin !== 'fallback' || !inCooldown) {
      await writeState(env, {
        origin: 'fallback',
        changedAt: Date.now(),
        reason: source === '90pct-monitor' ? 'spend-90-monitor' : 'spend-threshold-' + String(threshold),
        nextProbeAt: Date.now() + cooldownMs,
        eventId,
      });
    }
  }

  await markEventProcessed(env, eventId);

  return new Response(JSON.stringify({
    ok: true,
    action,
    source,
    thresholdPercent: Number.isFinite(threshold) ? threshold : null,
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

async function fetchFallback(request, env) {
  try {
    const response = await fetch(buildTarget(env.FALLBACK_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch {
    return { response: null, retryable: true };
  }
}

async function fetchStatic(request) {
  try {
    const response = await fetch(buildTarget(STATIC_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch { return { response: null, retryable: true }; }
}

async function fetchRuntime(request, env) {
  try {
    const response = await fetch(buildTarget(env.FALLBACK_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch { return { response: null, retryable: true }; }
}

async function fetchRuntimeFast(request, env) {
  try {
    const u = new URL(request.url);
    const target = new URL(u.pathname + u.search, env.FALLBACK_ORIGIN);
    const headers = new Headers(request.headers);
    headers.set('host', new URL(env.FALLBACK_ORIGIN).host);
    const response = await fetch(new Request(target.toString(), { method: request.method, headers, body: ['GET','HEAD'].includes(request.method) ? undefined : request.body, redirect: 'follow' }));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch { return { response: null, retryable: true }; }
}

async function fetchApi(request) {
  try {
    const response = await fetch(buildTarget(API_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch { return { response: null, retryable: true }; }
}

async function fetchPrimary(request, env) {
  try {
    const response = await fetch(buildTarget(env.PRIMARY_ORIGIN, request.url), new Request(request));
    return { response, retryable: RETRYABLE.has(response.status) };
  } catch {
    return { response: null, retryable: true };
  }
}

async function cacheResponse(request, response) {
  if (request.method !== 'GET' || !response || !response.ok) return;
  if (!publicPath(new URL(request.url).pathname)) return;

  const cached = response.clone();
  const headers = new Headers(cached.headers);
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');

  await caches.default.put(request, new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers,
  }));
}

async function readCache(request) {
  if (request.method !== 'GET') return null;
  const cached = await caches.default.match(request);
  return cached ? new Response(cached.body, cached) : null;
}

async function decorate(response, origin, requestUrl = response.url) {
  const headers = new Headers(response.headers);
  headers.set('x-filtra-failover-origin', origin);
  const contentType = headers.get('content-type') || '';
  let body = response.body;
  try {
    if (requestUrl && ['/', '/preview'].includes(new URL(requestUrl).pathname) && contentType.includes('text/html')) {
      let html = await response.text();
      html = html.replace(/<a\b(?=[^>]*\bhref\s*=\s*(["'])(?:https?:\/\/(?:www\.)?filtraai\.com)?\/indice(?:\/)?(?:\?[^"']*)?\1)[^>]*>[\s\S]*?<\/a>/gi, '');
      body = html;
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.delete('etag');
    }
  } catch {}
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

async function fallbackResponse(request, reason, env) {
  const fallback = await fetchFallback(request, env);
  if (fallback.response && !fallback.retryable) {
    await cacheResponse(request, fallback.response);
    return decorate(fallback.response, 'cloudflare-fallback');
  }
  if (publicPath(new URL(request.url).pathname)) {
    const cached = await readCache(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('x-filtra-failover-origin', 'cloudflare-cache');
      headers.set('x-filtra-failover-reason', reason);
      return decorate(new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      }), 'cloudflare-cache', request.url);
    }
  }
  return new Response('Filtra.AI temporarily unavailable', {
    status: 503,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-filtra-failover-origin': 'cloudflare-fallback',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH && request.method === 'POST') {
      return handleFailoverWebhook(request, env);
    }

    const probeInterval = Math.max(60000, Number(env.RECOVERY_PROBE_INTERVAL_MS || 300000));
    let state = await readState(env);

    if (state.origin === 'fallback') {
      if (Date.now() >= state.nextProbeAt) {
        state = { ...state, nextProbeAt: Date.now() + probeInterval };
        await writeState(env, state);

        const primary = await fetchPrimary(request, env);
        if (primary.response && !primary.retryable) {
          await writeState(env, {
            origin: 'primary',
            changedAt: Date.now(),
            reason: 'automatic-recovery',
            nextProbeAt: 0,
          });

          await cacheResponse(request, primary.response);
          return decorate(primary.response, 'primary');
        }
      }

      return fallbackResponse(request, 'configured-fallback', env);
    }

    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
      const staticResponse = await fetchStatic(request);
      if (staticResponse.response && !staticResponse.retryable) return decorate(staticResponse.response, 'cloudflare-static');
    }

    if (url.pathname.startsWith('/api/')) {
      const api = await fetchApi(request);
      if (api.response && !api.retryable) return decorate(api.response, 'render-api');
      const primary = await fetchPrimary(request, env);
      if (primary.response && !primary.retryable) return decorate(primary.response, 'primary');
      return new Response('API temporarily unavailable', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    const runtime = await fetchRuntimeFast(request, env);
    if (runtime.response && !runtime.retryable) {
      await cacheResponse(request, runtime.response);
      return decorate(runtime.response, 'render-frontend-runtime');
    }

    const primary = await fetchPrimary(request, env);
    if (primary.response && !primary.retryable) {
      await cacheResponse(request, primary.response);
      return decorate(primary.response, 'primary');
    }
    return fallbackResponse(request, runtime.response ? 'runtime-http-' + runtime.response.status : 'runtime-network-error', env);
  },
};
