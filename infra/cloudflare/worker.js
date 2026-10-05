const STATE_KEY = 'active_origin';
const RETRYABLE = new Set([502, 503, 504, 521, 522, 523, 524]);
const CACHEABLE_PREFIXES = ['/','/en','/es','/zh','/filtra-ai','/avaliacoes-google','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/reputacao-google','/como-melhorar-avaliacoes-google','/monitoramento-reputacao-online','/gestao-de-feedback','/blog'];

function normalizeOrigin(value) {
  return new URL(value).origin;
}

function publicPath(pathname) {
  if (pathname.startsWith('/api/') || pathname.startsWith('/painel') || pathname.startsWith('/admin') || pathname.startsWith('/login')) return false;
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
    };
  } catch {
    return { origin: 'primary', changedAt: 0, reason: 'invalid-state', nextProbeAt: 0 };
  }
}

async function writeState(env, state) {
  await env.FAILOVER_ORIGIN.put(STATE_KEY, JSON.stringify(state));
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
  const clone = new Response(response.body, response);
  const headers = new Headers(clone.headers);
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
  }
  headers.set('x-filtra-failover-cache', 'warm');
  await caches.default.put(request, new Response(clone.body, {
    status: clone.status,
    statusText: clone.statusText,
    headers,
  }));
}

async function readCache(request) {
  if (request.method !== 'GET') return null;
  const cached = await caches.default.match(request);
  return cached ? new Response(cached.body, cached) : null;
}

function decorate(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('x-filtra-failover-origin', origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fallbackResponse(request, env, reason) {
  if (publicPath(new URL(request.url).pathname)) {
    const cached = await readCache(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('cache-control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      headers.set('x-filtra-failover-origin', 'cloudflare-cache');
      headers.set('x-filtra-failover-reason', reason);
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
  }
  return new Response('Filtra.AI temporarily unavailable', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-filtra-failover-origin': 'cloudflare-fallback' },
  });
}

export default {
  async fetch(request, env) {
    const probeInterval = Math.max(60_000, Number(env.RECOVERY_PROBE_INTERVAL_MS || 300_000));
    let state = await readState(env);

    if (state.origin === 'fallback') {
      if (Date.now() >= state.nextProbeAt) {
        state = { ...state, nextProbeAt: Date.now() + probeInterval };
        await writeState(env, state);
        const primary = await fetchPrimary(request, env);
        if (primary.response && !primary.retryable) {
          await writeState(env, { origin: 'primary', changedAt: Date.now(), reason: 'automatic-recovery', nextProbeAt: 0 });
          await cacheResponse(request, primary.response);
          return decorate(primary.response, 'primary');
        }
      }
      return fallbackResponse(request, env, 'configured-fallback');
    }

    const primary = await fetchPrimary(request, env);
    if (primary.response && !primary.retryable) {
      await cacheResponse(request, primary.response);
      return decorate(primary.response, 'primary');
    }

    await writeState(env, {
      origin: 'fallback',
      changedAt: Date.now(),
      reason: primary.response ? 'primary-http-' + primary.response.status : 'primary-network-error',
      nextProbeAt: Date.now() + probeInterval,
    });

    return fallbackResponse(request, env, primary.response ? 'primary-http-' + primary.response.status : 'primary-network-error');
  },
};
