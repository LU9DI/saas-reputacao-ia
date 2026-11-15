const SEO_ORIGIN = 'https://filtra-ai-web-runtime.onrender.com';
// The Vercel project builds the same `main` and serves /sitemap.xml as a
// force-static route, so it is the canonical fallback when Render is down.
const FALLBACK_SEO_ORIGIN = 'https://saas-reputacao-ia.vercel.app';
// Retired: https://filtra-ai-frontend.filtra-ai.workers.dev used to serve a
// static export with 125 raw URLs (28 /zh, 97 after sanitization). It is no
// longer read: a fallback must prove parity before it can be served.
const KEY = 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
const KEY_PATH = `/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const CACHE_TTL_MS = 60000;
// v2 isolates the new cache entries from copies written before the parity
// guardrail. Bumping the version invalidates the old cache without a zone purge
// and without touching unrelated paths.
const CACHE_VERSION = 'v2';
// Cold-cache sanity floor for the fallback only. The public sitemap has 107
// URLs (2026-11); a smaller export is treated as truncated/stale instead of
// being served as if it were the canonical site. The primary is never floored.
const MIN_SITEMAP_URLS = 100;
const RETRYABLE = new Set([429, 500, 502, 503, 504, 521, 522, 523, 524]);

function cacheKeyFor(kind, pathname) {
  return new Request(`https://filtraai.com/__seo-cache-${CACHE_VERSION}/${kind}${pathname}`);
}

async function readCached(kind, pathname) {
  const cache = globalThis.caches?.default;
  if (!cache) return null;
  try {
    const response = await cache.match(cacheKeyFor(kind, pathname));
    if (!response) return null;
    const storedAt = Number(response.headers.get('x-filtra-seo-cached-at'));
    const body = pathname === '/sitemap.xml' ? await response.clone().text() : null;
    return {
      response,
      age: Number.isFinite(storedAt) && storedAt > 0 ? Date.now() - storedAt : Infinity,
      origin: response.headers.get('x-filtra-seo-origin') || kind,
      urls: body === null ? null : sitemapUrlSet(body),
    };
  } catch {
    return null;
  }
}

async function storeCached(kind, pathname, body, sourceHeaders, origin) {
  const headers = new Headers(sourceHeaders);
  headers.set('cache-control', 'public, max-age=604800');
  headers.set('x-filtra-seo-cached-at', String(Date.now()));
  headers.set('x-filtra-seo-origin', origin);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('set-cookie');
  const response = new Response(body, { status: 200, headers });
  const cache = globalThis.caches?.default;
  if (cache) {
    try {
      await cache.put(cacheKeyFor(kind, pathname), response.clone());
    } catch {}
  }
  return response;
}

function validResource(pathname, body) {
  if (pathname === '/sitemap.xml') {
    return /<urlset\b/i.test(body) &&
      /<\/urlset>/i.test(body) &&
      !/<sitemapindex\b/i.test(body) &&
      /<loc>\s*https:\/\/filtraai\.com(?:\/|<\/loc>)/i.test(body);
  }
  return /user-agent:/i.test(body) &&
    /sitemap:\s*https:\/\/filtraai\.com\/sitemap-index\.xml/i.test(body);
}

/**
 * Normalizes a sitemap URL to the canonical set: HTTPS, filtraai.com, no
 * query/hash, no trailing slash (except the root) and no /zh.
 */
function normalizeSitemapUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.hostname !== 'filtraai.com') return null;
    if (url.search || url.hash) return null;
    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname === '/zh' || pathname.startsWith('/zh/')) return null;
    return `https://filtraai.com${pathname || '/'}`;
  } catch {
    return null;
  }
}

function sitemapEntries(xml) {
  return [...String(xml).matchAll(/<url\b[\s\S]*?<\/url>/gi)].map((match) => match[0]);
}

function sitemapUrlSet(xml) {
  const urls = new Set();
  for (const entry of sitemapEntries(xml)) {
    const loc = entry.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    const normalized = loc ? normalizeSitemapUrl(loc) : null;
    if (normalized) urls.add(normalized);
  }
  return urls;
}

/**
 * Removes /zh, duplicates, query/hash and foreign hosts. When `referenceUrls`
 * is provided, every reference URL must be present; extras are discarded, so
 * the result is exactly the last known-good canonical set. This prevents a
 * stale fallback from silently reintroducing the 97-URL divergence.
 */
function sanitizeSitemapFallback(xml, referenceUrls = null) {
  const source = String(xml);
  if (!/<urlset\b/i.test(source) || !/<\/urlset>/i.test(source) || /<sitemapindex\b/i.test(source)) {
    throw new Error('Static sitemap fallback is not a complete urlset');
  }
  const seen = new Set();
  const safeEntries = [];
  for (const entry of sitemapEntries(source)) {
    const loc = entry.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    const normalized = loc ? normalizeSitemapUrl(loc) : null;
    if (!normalized || seen.has(normalized)) continue;
    if (referenceUrls && !referenceUrls.has(normalized)) continue;
    seen.add(normalized);
    safeEntries.push(entry.replace(/<loc>\s*[^<]+?\s*<\/loc>/i, `<loc>${normalized}</loc>`));
  }
  if (safeEntries.length === 0) throw new Error('Static sitemap fallback contains no canonical URLs');
  if (referenceUrls) {
    const missing = [...referenceUrls].filter((url) => !seen.has(url));
    if (missing.length > 0) {
      throw new Error(`Static sitemap fallback is missing ${missing.length} canonical URLs`);
    }
  }
  const root = source.match(/<urlset\b[^>]*>[\s\S]*?<\/urlset>/i)?.[0];
  if (!root) throw new Error('Static sitemap fallback has no complete <urlset> element');
  const opening = root.match(/^<urlset\b[^>]*>/i)?.[0] || '<urlset>';
  const sanitized = source.replace(root, () => `${opening}\n${safeEntries.join('\n')}\n</urlset>`);
  return { xml: sanitized, urls: seen };
}

function generatedRobotsFallback() {
  const crawlers = [
    'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
    'Claude-SearchBot', 'Claude-User', 'DuckAssistBot', 'MistralAI-User',
    'GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot',
    'meta-externalagent', 'Amazonbot',
  ];
  const groups = ['User-agent: *\nAllow: /\nDisallow: /api/'];
  for (const crawler of crawlers) groups.push(`User-agent: ${crawler}\nAllow: /\nDisallow: /api/`);
  groups.push(
    'Sitemap: https://filtraai.com/sitemap-index.xml',
    'Sitemap: https://filtraai.com/sitemap.xml',
    'Sitemap: https://filtraai.com/indice/sitemap-index.xml',
  );
  return groups.join('\n') + '\n';
}

async function fetchText(origin, pathname) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(new URL(pathname, origin), {
        method: 'GET',
        headers: { accept: pathname === '/sitemap.xml' ? 'application/xml,text/xml' : 'text/plain' },
        redirect: 'follow',
        signal: AbortSignal.timeout(3500),
      });
      if (response.ok) {
        const body = await response.text();
        if (!validResource(pathname, body)) {
          const error = new Error('SEO resource failed validation: ' + pathname);
          error.retryable = false;
          throw error;
        }
        return { body, headers: response.headers, origin };
      }
      try { await response.body?.cancel(); } catch {}
      if (!RETRYABLE.has(response.status)) {
        const error = new Error('SEO resource returned HTTP ' + response.status + ': ' + pathname);
        error.retryable = false;
        throw error;
      }
      lastError = new Error('SEO resource returned HTTP ' + response.status + ': ' + pathname);
    } catch (error) {
      lastError = error;
      if (error?.retryable === false) break;
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError || new Error('SEO resource temporarily unavailable: ' + pathname);
}

async function resolveSitemap() {
  const primaryCache = await readCached('primary', '/sitemap.xml');
  if (primaryCache && primaryCache.age < CACHE_TTL_MS) {
    return { response: primaryCache.response, origin: primaryCache.origin, cacheState: 'fresh', urls: primaryCache.urls };
  }

  // If the fallback was refreshed recently, do not hammer both origins on
  // every request during a Render outage. The next attempt happens after TTL.
  const fallbackCache = await readCached('fallback', '/sitemap.xml');
  if (fallbackCache && fallbackCache.age < CACHE_TTL_MS) {
    return { response: fallbackCache.response, origin: fallbackCache.origin, cacheState: 'fresh', urls: fallbackCache.urls };
  }

  let primaryError = null;
  try {
    const primary = await fetchText(SEO_ORIGIN, '/sitemap.xml');
    const sanitized = sanitizeSitemapFallback(primary.body);
    const response = await storeCached('primary', '/sitemap.xml', sanitized.xml, primary.headers, 'render-primary');
    return { response, origin: 'render-primary', cacheState: 'miss', urls: sanitized.urls };
  } catch (error) {
    primaryError = error;
  }

  try {
    const fallback = await fetchText(FALLBACK_SEO_ORIGIN, '/sitemap.xml');
    const reference = primaryCache?.urls?.size ? primaryCache.urls : null;
    const sanitized = sanitizeSitemapFallback(fallback.body, reference);
    if (!reference && sanitized.urls.size < MIN_SITEMAP_URLS) {
      throw new Error(`Vercel fallback has only ${sanitized.urls.size} canonical URLs (minimum ${MIN_SITEMAP_URLS})`);
    }
    const response = await storeCached('fallback', '/sitemap.xml', sanitized.xml, fallback.headers, 'vercel-fallback');
    return { response, origin: 'vercel-fallback', cacheState: 'miss', urls: sanitized.urls };
  } catch {
    // The alternate origin also failed or diverged; below we use the last
    // known-good primary copy, never the retired static export.
  }

  if (primaryCache) {
    return { response: primaryCache.response, origin: primaryCache.origin, cacheState: 'stale', urls: primaryCache.urls };
  }

  if (fallbackCache) {
    return { response: fallbackCache.response, origin: fallbackCache.origin, cacheState: 'stale', urls: fallbackCache.urls };
  }

  throw primaryError || new Error('Canonical sitemap temporarily unavailable');
}

async function resolveRobots() {
  const primaryCache = await readCached('primary', '/robots.txt');
  if (primaryCache && primaryCache.age < CACHE_TTL_MS) {
    return { response: primaryCache.response, origin: primaryCache.origin, cacheState: 'fresh' };
  }

  const fallbackCache = await readCached('fallback', '/robots.txt');
  if (fallbackCache && fallbackCache.age < CACHE_TTL_MS) {
    return { response: fallbackCache.response, origin: fallbackCache.origin, cacheState: 'fresh' };
  }

  try {
    const primary = await fetchText(SEO_ORIGIN, '/robots.txt');
    const response = await storeCached('primary', '/robots.txt', primary.body, primary.headers, 'render-primary');
    return { response, origin: 'render-primary', cacheState: 'miss' };
  } catch {}

  try {
    const fallback = await fetchText(FALLBACK_SEO_ORIGIN, '/robots.txt');
    const response = await storeCached('fallback', '/robots.txt', fallback.body, fallback.headers, 'vercel-fallback');
    return { response, origin: 'vercel-fallback', cacheState: 'miss' };
  } catch {}

  if (primaryCache) {
    return { response: primaryCache.response, origin: primaryCache.origin, cacheState: 'stale' };
  }

  if (fallbackCache) {
    return { response: fallbackCache.response, origin: fallbackCache.origin, cacheState: 'stale' };
  }

  return {
    response: new Response(generatedRobotsFallback(), { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } }),
    origin: 'generated-robots-fallback',
    cacheState: 'generated',
  };
}

function publicHeaders(contentType, resolved) {
  const headers = new Headers({
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-filtra-seo-origin': resolved.origin,
    'x-filtra-seo-cache': resolved.cacheState,
    'x-filtra-seo-version': CACHE_VERSION,
  });
  if (resolved.urls) headers.set('x-filtra-seo-urls', String(resolved.urls.size));
  if (resolved.cacheState === 'stale') headers.set('warning', '110 - "Response is stale"');
  return headers;
}

function urlsFromSitemap(xml) {
  return [...sitemapUrlSet(xml)];
}

async function submitSitemapToIndexNow() {
  const resolved = await resolveSitemap();
  const xml = await resolved.response.text();
  const urlList = urlsFromSitemap(xml);
  if (urlList.length === 0) {
    throw new Error('Canonical sitemap did not contain any valid Filtra.AI URLs');
  }
  await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'filtraai.com',
      key: KEY,
      keyLocation: `https://filtraai.com${KEY_PATH}`,
      urlList,
    }),
  });
}

if (typeof addEventListener === 'function') {
  addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      event.respondWith(new Response('Method Not Allowed', {
        status: 405,
        headers: { allow: 'GET, HEAD', 'x-content-type-options': 'nosniff' },
      }));
      return;
    }

    if (url.hostname !== 'filtraai.com') {
      event.respondWith(new Response('Not Found', { status: 404 }));
      return;
    }

    if (url.pathname === KEY_PATH) {
      if (request.method === 'GET') {
        event.waitUntil(submitSitemapToIndexNow().catch(() => undefined));
      }
      event.respondWith(new Response(request.method === 'HEAD' ? null : KEY, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      }));
      return;
    }

    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
      event.respondWith((async () => {
        try {
          const resolved = url.pathname === '/sitemap.xml' ? await resolveSitemap() : await resolveRobots();
          const body = request.method === 'HEAD' ? null : await resolved.response.text();
          const contentType = resolved.response.headers.get('content-type') ||
            (url.pathname === '/sitemap.xml' ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8');
          return new Response(body, {
            status: 200,
            headers: publicHeaders(contentType, resolved),
          });
        } catch {
          // Both origins and the cache were tried. A 503 is safer than serving
          // a sitemap that diverges from the canonical set.
          return new Response('SEO metadata temporarily unavailable', {
            status: 503,
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'cache-control': 'no-store',
              'retry-after': '60',
              'x-content-type-options': 'nosniff',
            },
          });
        }
      })());
      return;
    }

    event.respondWith(new Response('Not Found', {
      status: 404,
      headers: { 'x-content-type-options': 'nosniff' },
    }));
  });
}
