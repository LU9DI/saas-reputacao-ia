const STATE_KEY = 'active_origin';
/**
 * Janela sticky de failover (DSV4 REQ-STATE-04 / D-13): após entrar em fallback,
 * nenhuma sondagem é permitida antes de `changedAt + STICKY_WINDOW_MS`.
 * DEVE permanecer alinhada a `frontend/src/app/lib/failoverState.ts`.
 */
const STICKY_WINDOW_MS = 6 * 60 * 60 * 1000;
const STICKY_JITTER_RATIO = 0.15;
const PUBLIC_HTML_CACHE_TTL_SECONDS = 3600;
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
  const privatePrefixes = [
    '/painel', '/admin', '/login', '/widget',
    '/recuperar-senha', '/redefinir-senha',
    '/forgot-password', '/reset-password', '/password-reset',
  ];
  if (
    pathname.startsWith('/api/') ||
    privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/')) ||
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
  let raw;
  try {
    raw = await env.FAILOVER_ORIGIN.get(STATE_KEY);
  } catch {
    // REQ-STATE-06: indisponibilidade do KV não pode derrubar a requisição.
    return { origin: 'primary', changedAt: 0, reason: 'kv-unavailable', nextProbeAt: 0 };
  }
  if (!raw) return { origin: 'primary', changedAt: 0, reason: 'default', nextProbeAt: 0 };
  try {
    const state = JSON.parse(raw);
    const origin = state.origin === 'fallback' ? 'fallback' : 'primary';
    const changedAt = Number(state.changedAt) || 0;
    const rawNext = state.nextProbeAt;
    const hasNext = rawNext !== undefined && rawNext !== null && rawNext !== '';
    const parsedNext = hasNext ? Number(rawNext) : Number.NaN;
    // EF-03: um `nextProbeAt` explícito e numérico (inclusive 0 = "vencido") é
    // autoridade; ausência ou valor inválido NÃO pode abrir a janela e é
    // derivado de changedAt para estado legado em fallback.
    const nextProbeAt = hasNext && Number.isFinite(parsedNext)
      ? parsedNext
      : origin === 'fallback' && changedAt > 0
        ? changedAt + STICKY_WINDOW_MS
        : 0;
    return {
      origin,
      changedAt,
      reason: String(state.reason || 'unknown'),
      nextProbeAt,
      eventId: state.eventId ? String(state.eventId) : undefined,
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state', nextProbeAt: 0 };
  }
}

/** Instante mínimo da próxima sondagem, com jitter (REQ-STATE-04/08). */
function stickyNextProbeAt(changedAt) {
  const jitter = Math.round(STICKY_WINDOW_MS * STICKY_JITTER_RATIO * Math.random());
  return changedAt + STICKY_WINDOW_MS + jitter;
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
    const now = Date.now();
    const inWindow = current.origin === 'fallback' && current.changedAt > 0 && now < current.nextProbeAt;

    // T2: dentro da janela, o evento não renova changedAt/nextProbeAt (REQ-STATE-04).
    if (!inWindow) {
      await writeState(env, {
        origin: 'fallback',
        changedAt: now,
        reason: source === '90pct-monitor' ? 'spend-90-monitor' : 'spend-threshold-' + String(threshold),
        nextProbeAt: stickyNextProbeAt(now),
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

function isPublicHtmlCacheRequest(request) {
  if (!request || request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (!publicPath(url.pathname) || url.search) return false;
  if (
    request.headers.has('authorization') ||
    request.headers.has('cookie') ||
    request.headers.has('range') ||
    request.headers.has('upgrade') ||
    request.headers.has('rsc') ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('next-router-prefetch') ||
    request.headers.has('next-router-segment-prefetch')
  ) return false;
  const purpose = (request.headers.get('purpose') || '') + ' ' + (request.headers.get('sec-purpose') || '');
  return !/prefetch/i.test(purpose);
}

function isPublicHtmlCacheCandidate(request, response) {
  if (!isPublicHtmlCacheRequest(request) || !response || response.status !== 200) return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('text/html') || response.headers.has('set-cookie')) return false;
  const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
  if (/(?:^|,)\s*(?:private|no-store|no-cache)\b/.test(cacheControl)) return false;
  const vary = (response.headers.get('vary') || '').split(',').map((value) => value.trim());
  return !vary.some((value) => value === '*');
}

function applyPublicHtmlCachePolicy(request, response, headers) {
  if (!isPublicHtmlCacheCandidate(request, response)) return;
  headers.set(
    'cache-control',
    `public, max-age=0, s-maxage=${PUBLIC_HTML_CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
  );
  headers.delete('cdn-cache-control');
  headers.delete('cloudflare-cdn-cache-control');
  headers.delete('pragma');
  headers.delete('expires');
  headers.set('x-filtra-cache-policy', `public-html-s-maxage-${PUBLIC_HTML_CACHE_TTL_SECONDS}`);
}

/**
 * Aquece o cache sem bloquear a resposta (REQ-CACHE-08 / EF-12).
 * Em Workers, a promessa vai para `ctx.waitUntil`; fora dele é aguardada com
 * erro descartado. Falha de cache nunca altera a resposta entregue.
 */
function cacheResponse(request, response, ctx) {
  if (!isPublicHtmlCacheCandidate(request, response)) return;

  const write = (async () => {
    const cached = response.clone();
    const headers = new Headers(cached.headers);
    applyPublicHtmlCachePolicy(request, cached, headers);
    headers.set('cache-control', `public, max-age=${PUBLIC_HTML_CACHE_TTL_SECONDS}, stale-while-revalidate=600`);

    await caches.default.put(request, new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    }));
  })().catch(() => {});

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(write);
    return;
  }
  return write;
}

async function readCache(request) {
  if (!isPublicHtmlCacheRequest(request)) return null;
  try {
    const cached = await caches.default.match(request);
    if (!cached || !(cached.headers.get('content-type') || '').toLowerCase().includes('text/html')) return null;
    return new Response(cached.body, cached);
  } catch {
    // Cache indisponível é equivalente a miss (EF-12).
    return null;
  }
}

async function decorate(response, origin, requestUrl = response.url, request = null) {
  const headers = new Headers(response.headers);
  headers.set('x-filtra-failover-origin', origin);
  applyPublicHtmlCachePolicy(request, response, headers);
  const contentType = headers.get('content-type') || '';
  let body = response.body;
  try {
    if (requestUrl && ['/', '/preview'].includes(new URL(requestUrl).pathname) && contentType.includes('text/html')) {
      let html = await response.text();
      body = html;
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.delete('etag');
    }
  } catch {}
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

async function fallbackResponse(request, reason, env, ctx) {
  const fallback = await fetchFallback(request, env);
  if (fallback.response && !fallback.retryable) {
    cacheResponse(request, fallback.response, ctx);
    return decorate(fallback.response, 'cloudflare-fallback', request.url, request);
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
      }), 'cloudflare-cache', request.url, request);
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === WEBHOOK_PATH && request.method === 'POST') {
      return handleFailoverWebhook(request, env);
    }

    const probeInterval = Math.max(60000, Number(env.RECOVERY_PROBE_INTERVAL_MS || 300000));
    let state = await readState(env);

    // In primary mode, serve a fresh public HTML cache hit before contacting
    // Render. Private, personalized, query-string and Next.js RSC requests bypass it.
    if (state.origin === 'primary') {
      const cached = await readCache(request);
      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set('x-filtra-cache', 'hit');
        return decorate(new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers,
        }), 'cloudflare-cache', request.url, request);
      }
    }

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

          cacheResponse(request, primary.response, ctx);
          return decorate(primary.response, 'primary', request.url, request);
        }
      }

      return fallbackResponse(request, 'configured-fallback', env, ctx);
    }

    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
      const staticResponse = await fetchStatic(request);
      if (staticResponse.response && !staticResponse.retryable) return decorate(staticResponse.response, 'cloudflare-static', request.url, request);
    }

    if (url.pathname.startsWith('/api/')) {
      const api = await fetchApi(request);
      if (api.response && !api.retryable) return decorate(api.response, 'render-api', request.url, request);
      const primary = await fetchPrimary(request, env);
      if (primary.response && !primary.retryable) return decorate(primary.response, 'primary', request.url, request);
      return new Response('API temporarily unavailable', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    const runtime = await fetchRuntimeFast(request, env);
    if (runtime.response && !runtime.retryable) {
      cacheResponse(request, runtime.response, ctx);
      return decorate(runtime.response, 'render-frontend-runtime', request.url, request);
    }

    const primary = await fetchPrimary(request, env);
    if (primary.response && !primary.retryable) {
      cacheResponse(request, primary.response, ctx);
      return decorate(primary.response, 'primary', request.url, request);
    }
    return fallbackResponse(request, runtime.response ? 'runtime-http-' + runtime.response.status : 'runtime-network-error', env, ctx);
  },
};
