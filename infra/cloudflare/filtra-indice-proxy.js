const ORIGEM = "https://filtra-indice.onrender.com";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 521, 522, 523, 524]);
const CACHEABLE_PATH = /^\/indice\/(?:sitemap-index\.xml|sitemap\/\d+\.xml)$/;
// Sitemaps só mudam quando os dados mensais são reingeridos ou há deploy.
// Renovar a cada 60 s acordava o Render o tempo todo durante o crawl.
const FRESH_CACHE_MS = 86_400_000;
const PAGE_FRESH_CACHE_MS = 86_400_000;
const STALE_CACHE_SECONDS = 604800;
const RETRY_DELAYS_MS = [250, 750, 1500, 3000];
const PAGE_CACHEABLE_PATH = /^\/indice(?:\/.*)?$/;

// Proteção da cota Free do Render (nov/2026): fora da janela diária o Worker
// não acorda o Render para HTML nem sitemap. O que já está em cache continua
// sendo servido; URLs nunca vistas recebem 503 temporário. Assets imutáveis do
// Next.js são a exceção: cada chunk é buscado uma vez e cacheado por um ano.
const STATIC_ASSET_PATH = /^\/indice\/_next\/static\//;

// Janela em que a origem pode ser acordada. Fora dela o Render fica dormindo.
const originWindow = {
  enabled: true,
  startHour: 3,
  endHour: 5,
  now: () => new Date(),
};

function originWindowOpen() {
  const hour = originWindow.now().getUTCHours();
  return hour >= originWindow.startHour && hour < originWindow.endHour;
}

// Ponto de ajuste usado pelos testes; em produção fica sempre no padrão acima.
export function configureOriginWindow(next) {
  Object.assign(originWindow, next);
}

// Sitemaps estáticos publicados no KV (binding SITEMAPS). Servidos sem tocar no
// Render, a qualquer hora e em qualquer data center. Sem binding, ou sem a chave,
// o Worker segue o caminho antigo (cache + origem + janela).
// /indice/sitemap-index.xml -> "sitemap-index.xml"; /indice/sitemap/3.xml -> "sitemap/3.xml"
export function chaveSitemapKv(pathname) {
  return CACHEABLE_PATH.test(pathname) ? pathname.replace(/^\/indice\//, "") : null;
}

async function lerSitemapKv(env, pathname) {
  const chave = chaveSitemapKv(pathname);
  if (!chave || !env || !env.SITEMAPS || typeof env.SITEMAPS.get !== "function") return null;
  try {
    const xml = await env.SITEMAPS.get(chave);
    return typeof xml === "string" && xml.startsWith("<?xml") ? xml : null;
  } catch {
    return null;
  }
}

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

function isSafePublicPageResponse(response) {
  if (response.status !== 200 || response.headers.has("set-cookie")) return false;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/markdown")) return false;
  const policy = response.headers.get("cache-control") || "";
  if (/private|no-store|no-cache/i.test(policy)) return false;
  const vary = (response.headers.get("vary") || "").split(",").map((value) => value.trim());
  return !vary.some((value) => value === "*");
}

async function storeSuccessfulPage(cache, key, response) {
  if (!cache || !isSafePublicPageResponse(response)) return;
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
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (incoming.pathname !== "/indice" && !incoming.pathname.startsWith("/indice/")) {
      return fetch(request);
    }

    const isStaticAsset = STATIC_ASSET_PATH.test(incoming.pathname) &&
      (request.method === "GET" || request.method === "HEAD") &&
      !request.headers.has("authorization") &&
      !request.headers.has("cookie");

    if (isStaticAsset) {
      const assetCache = globalThis.caches?.default;
      const assetKey = new Request(`${incoming.origin}${incoming.pathname}${incoming.search}`, { method: "GET" });
      const cachedAsset = await readCache(assetCache, assetKey);
      if (cachedAsset) {
        return withHeaders(cachedAsset.clone(), {
          "cache-control": "public, max-age=31536000, immutable",
          "x-indice-proxy": "static-cache",
          "x-indice-cache": "hit",
        });
      }

      const assetTarget = new URL(incoming.pathname + incoming.search, ORIGEM);
      const assetHeaders = new Headers(request.headers);
      assetHeaders.delete("host");
      assetHeaders.delete("cf-connecting-ip");
      assetHeaders.delete("cf-ipcountry");
      assetHeaders.delete("cf-ray");
      assetHeaders.delete("x-forwarded-host");
      assetHeaders.set("x-forwarded-host", incoming.host);
      assetHeaders.set("x-forwarded-proto", "https");
      const assetFetch = await fetchWithRetry(
        assetTarget,
        { method: "GET", headers: assetHeaders, redirect: "manual" },
        false,
      );

      if (assetFetch.response) {
        const headers = new Headers(assetFetch.response.headers);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set("x-indice-proxy", "static-origin");
        headers.set("x-indice-cache", assetFetch.response.ok ? "refreshed" : "miss");
        headers.delete("content-length");
        headers.delete("content-encoding");
        const response = new Response(assetFetch.response.body, {
          status: assetFetch.response.status,
          statusText: assetFetch.response.statusText,
          headers,
        });
        if (assetFetch.response.ok && assetCache) {
          try {
            await assetCache.put(assetKey, withHeaders(response.clone(), {
              "cache-control": "public, max-age=31536000, immutable",
            }));
          } catch {
            // Cache is an optimization only.
          }
        }
        return response;
      }

      return new Response("Filtra Índice: asset temporariamente indisponível.", {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": "3600",
          "x-indice-proxy": "static-fetch-failed",
        },
      });
    }

    const isSitemap = CACHEABLE_PATH.test(incoming.pathname) &&
      (request.method === "GET" || request.method === "HEAD") &&
      incoming.search === "" &&
      !request.headers.has("authorization") &&
      !request.headers.has("cookie");

    // Sitemap publicado no KV: resposta imediata, sem cache por colo e sem Render.
    if (isSitemap) {
      const xml = await lerSitemapKv(env, incoming.pathname);
      if (xml !== null) {
        return new Response(request.method === "HEAD" ? null : xml, {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=86400",
            "x-indice-proxy": "kv-static",
            "x-indice-cache": "kv",
          },
        });
      }
    }

    const isPublicPage = request.method === "GET" &&
      PAGE_CACHEABLE_PATH.test(incoming.pathname) &&
      !CACHEABLE_PATH.test(incoming.pathname) &&
      incoming.search === "" &&
      !request.headers.has("authorization") &&
      !request.headers.has("cookie");
    const isCacheable = isSitemap || isPublicPage;
    const cache = isCacheable ? globalThis.caches?.default : null;
    const cacheKey = isCacheable ? cacheKeyFor(incoming) : null;
    const cached = isCacheable ? await readCache(cache, cacheKey) : null;
    const freshFor = isSitemap ? FRESH_CACHE_MS : PAGE_FRESH_CACHE_MS;

    if (cached && cacheAgeMs(cached) <= freshFor) {
      return withHeaders(cached.clone(), {
        "cache-control": isSitemap
          ? "public, max-age=3600, s-maxage=86400"
          : "public, max-age=60, s-maxage=86400",
        "x-indice-proxy": "render-cache",
        "x-indice-cache": "hit",
        "x-indice-upstream-status": "200",
      });
    }

    // Congelamento: fora da janela diária nada acorda o Render para página ou
    // sitemap. Cache conhecido continua no ar; URL nunca vista recebe 503.
    if (originWindow.enabled && isCacheable && !originWindowOpen()) {
      if (cached) {
        return withHeaders(cached.clone(), {
          "cache-control": isSitemap
            ? "public, max-age=3600, s-maxage=86400"
            : "public, max-age=60, s-maxage=86400",
          "x-indice-proxy": "frozen-cache",
          "x-indice-cache": "stale",
          "x-indice-upstream-status": "frozen",
          warning: '110 - "Response is stale"',
        });
      }

      return new Response("Índice temporariamente em manutenção. Tente novamente mais tarde.", {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": "3600",
          "x-indice-proxy": "frozen-miss",
        },
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
      const canCachePage = isPublicPage && isSafePublicPageResponse(upstream);
      // Clone before transferring the upstream body into the outgoing Response.
      const pageToCache = canCachePage ? upstream.clone() : null;
      responseHeaders.set("cache-control", isSitemap
        ? "public, max-age=3600, s-maxage=86400"
        : canCachePage ? "public, max-age=60, s-maxage=86400"
          : isPublicPage ? (upstream.headers.get("cache-control") || "no-store")
            : "public, max-age=60, s-maxage=60");
      if (isSitemap && request.method === "GET") responseHeaders.set("x-indice-cache", "refreshed");
      else if (canCachePage) responseHeaders.set("x-indice-cache", "refreshed");
      responseHeaders.delete("content-length");
      responseHeaders.delete("content-encoding");
      const response = new Response(request.method === "HEAD" ? null : upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
      if (isSitemap && request.method === "GET") {
        await storeSuccessfulSitemap(cache, cacheKey, response.clone());
      } else if (pageToCache) {
        await storeSuccessfulPage(cache, cacheKey, pageToCache);
      }
      return response;
    }

    const retryableFailure = error || (upstream && isRetryable(upstream));
    if (isCacheable && cached && cacheAgeMs(cached) <= STALE_CACHE_SECONDS * 1000 && retryableFailure) {
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
