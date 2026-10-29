const SEO_ORIGIN = 'https://filtra-ai-web-runtime.onrender.com';
const STATIC_SEO_ORIGIN = 'https://filtra-ai-frontend.filtra-ai.workers.dev';
const KEY = 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82';
const KEY_PATH = `/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const CACHE_TTL_MS = 60000;
const RETRYABLE = new Set([429, 500, 502, 503, 504, 521, 522, 523, 524]);

function cacheKeyFor(pathname) {
  return new Request(`https://filtraai.com/__seo-cache${pathname}`);
}

async function readCached(pathname) {
  const cache = globalThis.caches?.default;
  if (!cache) return null;
  try {
    const response = await cache.match(cacheKeyFor(pathname));
    if (!response) return null;
    const storedAt = Number(response.headers.get('x-filtra-seo-cached-at'));
    return { response, age: Number.isFinite(storedAt) && storedAt > 0 ? Date.now() - storedAt : Infinity };
  } catch {
    return null;
  }
}

async function storeCached(pathname, response, origin) {
  const cache = globalThis.caches?.default;
  if (!cache) return response;
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'public, max-age=604800');
  headers.set('x-filtra-seo-cached-at', String(Date.now()));
  headers.set('x-filtra-seo-origin', origin);
  headers.delete('content-length');
  headers.delete('content-encoding');
  const copy = new Response(response.clone().body, { status: 200, headers });
  try { await cache.put(cacheKeyFor(pathname), copy.clone()); } catch {}
  return copy;
}

function validResource(pathname, body) {
  if (pathname === '/sitemap.xml') {
    return /<urlset\b/i.test(body) && /<loc>https:\/\/filtraai\.com\//i.test(body);
  }
  return /user-agent:/i.test(body) && /sitemap:\s*https:\/\/filtraai\.com\/sitemap-index\.xml/i.test(body);
}

function sanitizeStaticSitemap(xml) {
  if (!/<urlset\b/i.test(xml)) throw new Error('Static sitemap fallback is not a urlset');
  const entries = [...xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)].map((match) => match[0]);
  const safeEntries = entries.filter((entry) => {
    const loc = entry.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1]?.trim();
    if (!loc) return false;
    try {
      const url = new URL(loc);
      return url.protocol === 'https:' && url.hostname === 'filtraai.com' &&
        url.pathname !== '/zh' && !url.pathname.startsWith('/zh/');
    } catch {
      return false;
    }
  });
  if (safeEntries.length === 0) throw new Error('Static sitemap fallback contains no canonical URLs');
  return xml.replace(/<urlset\b[^>]*>[\s\S]*?<\/urlset>/i, (root) => {
    const opening = root.match(/^<urlset\b[^>]*>/i)?.[0] || '<urlset>';
    return `${opening}\n${safeEntries.join('\n')}\n</urlset>`;
  });
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

async function fetchCanonicalResource(pathname) {
  const cached = await readCached(pathname);
  if (cached && cached.age < CACHE_TTL_MS) return cached.response;

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(new URL(pathname, SEO_ORIGIN), {
        method: 'GET',
        headers: { accept: pathname === '/sitemap.xml' ? 'application/xml,text/xml' : 'text/plain' },
        redirect: 'follow',
        signal: AbortSignal.timeout(3500),
      });
      if (response.ok) {
        const body = await response.text();
        if (!validResource(pathname, body)) throw new Error('Primary SEO resource failed validation: ' + pathname);
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        return storeCached(pathname, new Response(body, { status: 200, headers }), 'render-primary');
      }
      try { await response.body?.cancel(); } catch {}
      if (!RETRYABLE.has(response.status)) throw new Error('Canonical SEO resource returned HTTP ' + response.status + ': ' + pathname);
      lastError = new Error('Canonical SEO resource returned HTTP ' + response.status + ': ' + pathname);
    } catch (error) {
      lastError = error;
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
  }

  // The runtime origin can cold-start or return a transient 502. Keep the public
  // sitemap available from the static Cloudflare Pages export rather than
  // returning a gateway error to Google. Remove /zh URLs because those pages are noindex.
  if (pathname === '/sitemap.xml') {
    try {
      const fallback = await fetch(new URL(pathname, STATIC_SEO_ORIGIN), {
        method: 'GET',
        headers: { accept: 'application/xml,text/xml' },
        signal: AbortSignal.timeout(2500),
      });
      if (fallback.ok) {
        const xml = sanitizeStaticSitemap(await fallback.text());
        const response = new Response(xml, {
          status: 200,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=60',
            'x-filtra-seo-origin': 'cloudflare-static-fallback',
          },
        });
        return storeCached(pathname, response, 'cloudflare-static-fallback');
      }
      try { await fallback.body?.cancel(); } catch {}
      lastError = new Error('Static sitemap fallback returned HTTP ' + fallback.status);
    } catch (error) {
      lastError = error;
    }
  } else if (pathname === '/robots.txt') {
    const response = new Response(generatedRobotsFallback(), {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'x-filtra-seo-origin': 'generated-robots-fallback',
      },
    });
    return storeCached(pathname, response, 'generated-robots-fallback');
  }

  // Serve the last known-good copy even after its normal freshness window.
  if (cached) {
    const headers = new Headers(cached.response.headers);
    headers.set('x-filtra-seo-cache', 'stale');
    headers.set('warning', '110 - "Response is stale"');
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(cached.response.body, { status: 200, headers });
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
        // The upstreams above already provide a validated fallback for this SEO resource.
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
