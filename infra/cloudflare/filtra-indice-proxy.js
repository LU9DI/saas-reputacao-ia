const ORIGEM = "https://filtra-indice.onrender.com";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 521, 522, 523, 524]);
const CACHEABLE_PATH = /^\/indice\/(?:sitemap-index\.xml|sitemap\/\d+\.xml)$/;
const FRESH_CACHE_MS = 60_000;
const STALE_CACHE_SECONDS = 604800;
const RETRY_DELAYS_MS = [250, 750, 1500, 3000];

function cacheKeyFor(url) {
  return new Request(`${url.origin}${url.pathname}`, { method: "GET" });
}

function withHeaders(response, updates) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(updates)) headers.set(name, value);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function cacheAgeMs(response) {
  const storedAt = Number(response.headers.get("x-indice-cached-at"));
  return Number.isFinite(storedAt) && storedAt > 0 ? Date.now() - storedAt : Infinity;
}

async function readCache(cache, key) {
  if (!cache) return null;
  try {
    return await cache.match(key);
  } catch {
    return null;
  }
}

async function storeSuccessfulSitemap(cache, key, response) {
  if (!cache || response.status !== 200) return;
  const stored = withHeaders(response.clone(), {
    "cache-control": `public, max-age=${STALE_CACHE_SECONDS}`,
    "x-indice-cached-at": String(Date.now()),
  });
  try {
    await cache.put(key, stored);
  } catch {
    // Cache is an optimization only; origin success must still be returned.
  }
}

async function fetchOrigin(target, init) {
  return fetch(new Request(target.toString(), init), {
    cf: { cacheEverything: false, cacheTtl: 0 },
  });
}

function isRetryable(response) {
  return RETRYABLE_STATUSES.has(response.status);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(target, init, shouldRetry) {
  let lastResponse = null;
  let lastError = null;
  const attempts = shouldRetry ? RETRY_DELAYS_MS.length + 1 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchOrigin(target, init);
      if (!shouldRetry || !isRetryable(response) || attempt === attempts - 1) {
        return { response, error: null };
      }
      lastResponse = response;
      try { await response.body?.cancel(); } catch {}
    } catch (error) {
      lastError = error;
      if (!shouldRetry || attempt === attempts - 1) break;
    }

    await wait(RETRY_DELAYS_MS[attempt]);
  }

  return { response: lastResponse, error: lastError };
}

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.pathname !== "/indice" && !incoming.pathname.startsWith("/indice/")) {
      return fetch(request);
    }

    const isSitemap = CACHEABLE_PATH.test(incoming.pathname) &&
      (request.method === "GET" || request.method === "HEAD") &&
      incoming.search === "" &&
      !request.headers.has("authorization") &&
      !request.headers.has("cookie");
    const cache = isSitemap ? globalThis.caches?.default : null;
    const cacheKey = isSitemap ? cacheKeyFor(incoming) : null;
    const cached = isSitemap ? await readCache(cache, cacheKey) : null;

    if (cached && cacheAgeMs(cached) <= FRESH_CACHE_MS) {
      return withHeaders(cached.clone(), {
        "cache-control": "public, max-age=60, s-maxage=60",
        "x-indice-proxy": "render-cache",
        "x-indice-cache": "hit",
        "x-indice-upstream-status": "200",
      });
    }

    const target = new URL(incoming.pathname + incoming.search, ORIGEM);
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("x-forwarded-host");
    headers.set("x-forwarded-host", incoming.host);
    headers.set("x-forwarded-proto", "https");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

    const { response: upstream, error } = await fetchWithRetry(target, init, isSitemap);

    if (upstream && upstream.ok) {
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set("x-indice-proxy", "render-origin");
      responseHeaders.set("x-indice-upstream-status", String(upstream.status));
      responseHeaders.set("cache-control", isSitemap ? "public, max-age=60, s-maxage=60" : "public, max-age=60, s-maxage=60");
      if (isSitemap && request.method === "GET") responseHeaders.set("x-indice-cache", "refreshed");
      responseHeaders.delete("content-length");
      responseHeaders.delete("content-encoding");
      const response = new Response(request.method === "HEAD" ? null : upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
      if (isSitemap && request.method === "GET") {
        await storeSuccessfulSitemap(cache, cacheKey, response.clone());
      }
      return response;
    }

    const retryableFailure = error || (upstream && isRetryable(upstream));
    if (isSitemap && cached && retryableFailure) {
      return withHeaders(cached.clone(), {
        "cache-control": "no-store",
        "x-indice-proxy": "render-stale-cache",
        "x-indice-cache": "stale",
        "x-indice-upstream-status": upstream ? String(upstream.status) : "network-error",
        warning: '110 - "Response is stale"',
      });
    }

    if (upstream) {
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set("x-indice-proxy", "render-origin");
      responseHeaders.set("x-indice-upstream-status", String(upstream.status));
      responseHeaders.set("cache-control", "no-store");
      responseHeaders.delete("content-length");
      responseHeaders.delete("content-encoding");
      return new Response(request.method === "HEAD" ? null : upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    }

    return new Response("Filtra Índice: falha de conexão com a origem Render.", {
      status: 502,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-indice-proxy": "origin-fetch-failed",
        "x-indice-target": target.origin,
      },
    });
  },
};
