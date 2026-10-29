const SEO_ORIGIN = 'https://filtra-ai-web-runtime.onrender.com';
const KEY = 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
const KEY_PATH = `/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function fetchCanonicalResource(pathname) {
  const isSitemap = pathname === '/sitemap.xml';
  const cache = isSitemap ? globalThis.caches?.default : null;
  const cacheKey = isSitemap ? new Request('https://filtraai.com/__seo-cache/sitemap.xml') : null;
  let cached = null;
  if (cache && cacheKey) {
    try { cached = await cache.match(cacheKey); } catch {}
    if (cached) {
      const storedAt = Number(cached.headers.get('x-filtra-sitemap-cached-at'));
      if (Number.isFinite(storedAt) && storedAt > 0 && Date.now() - storedAt < 60000) return cached;
    }
  }
  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(new URL(pathname, SEO_ORIGIN), { method: 'GET', headers: { accept: isSitemap ? 'application/xml,text/xml' : 'text/plain' }, redirect: 'follow' });
      if (response.ok) {
        if (cache && cacheKey && isSitemap) {
          const headers = new Headers(response.headers);
          headers.set('cache-control', 'public, max-age=604800');
          headers.set('x-filtra-sitemap-cached-at', String(Date.now()));
          headers.delete('content-length'); headers.delete('content-encoding');
          try { await cache.put(cacheKey, new Response(response.clone().body, { status: 200, headers })); } catch {}
        }
        return response;
      }
      try { await response.body?.cancel(); } catch {}
      if (![429, 500, 502, 503, 504, 521, 522, 523, 524].includes(response.status)) throw new Error('Canonical SEO resource returned HTTP ' + response.status + ': ' + pathname);
      lastError = new Error('Canonical SEO resource returned HTTP ' + response.status + ': ' + pathname);
    } catch (error) { lastError = error; }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, [500, 1500, 3000][attempt]));
  }
  if (isSitemap && cached) {
    const headers = new Headers(cached.headers);
    headers.set('x-filtra-sitemap-cache', 'stale'); headers.set('warning', '110 - "Response is stale"');
    headers.delete('content-length'); headers.delete('content-encoding');
    return new Response(cached.body, { status: 200, headers });
  }
  throw lastError || new Error('Canonical SEO resource temporarily unavailable: ' + pathname);
}

function urlsFromSitemap(xml) {
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].replaceAll('&amp;', '&').trim())
    .filter((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' &&
          url.hostname === 'filtraai.com' &&
          !url.pathname.startsWith('/zh/') &&
          url.pathname !== '/zh' &&
          !url.search &&
          !url.hash;
      } catch {
        return false;
      }
    });
  return [...new Set(urls)];
}

async function submitSitemapToIndexNow() {
  const response = await fetchCanonicalResource('/sitemap.xml');
  const xml = await response.text();
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
        const upstream = await fetchCanonicalResource(url.pathname);
        const body = await upstream.text();
        return new Response(request.method === 'HEAD' ? null : body, {
          status: upstream.status,
          headers: {
            'content-type': upstream.headers.get('content-type') ||
              (url.pathname === '/sitemap.xml' ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8'),
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
          },
        });
      } catch {
        // Do not fall back to a stale hard-coded sitemap or robots policy.
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
