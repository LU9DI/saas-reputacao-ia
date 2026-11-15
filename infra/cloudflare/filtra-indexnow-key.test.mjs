// Guardrails do Worker `filtra-indexnow-key`.
//
// O Worker serve `/robots.txt` e `/sitemap.xml` na borda. O incidente de
// 2026-11-11 expôs duas falhas: (1) o fallback estático legado tinha 125 URLs
// brutas, 28 `/zh` e apenas 97 canônicas, 10 a menos que o primário; (2) o cache
// interno não era versionado, então uma cópia antiga podia sobreviver ao deploy.
//
// Estes testes rodam o próprio Worker em um contexto `vm` com `fetch`, `caches`
// e `Response` controlados. Não dependem de rede. A paridade com
// `frontend/src/app/robots.ts` continua validada por inspeção de fonte no fim.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workerPath = path.join(raiz, 'infra/cloudflare/filtra-indexnow-key.js');
const workerSource = readFileSync(workerPath, 'utf8');
const robotsTs = readFileSync(path.join(raiz, 'frontend/src/app/robots.ts'), 'utf8');

const SITE = 'https://filtraai.com';
const RENDER = 'https://filtra-ai-web-runtime.onrender.com';
const VERCEL = 'https://saas-reputacao-ia.vercel.app';
const RETIRED = 'https://filtra-ai-frontend.filtra-ai.workers.dev';

// As 10 URLs que faltavam no fallback estático em 2026-11-11.
const MISSING_TEN = [
  '/calculadora-nota-google',
  '/metodologia',
  '/glossario',
  '/sobre',
  '/blog/quanto-custa-gestao-de-reputacao-online',
  '/blog/como-escolher-software-de-gestao-de-reputacao',
  '/blog/panorama-estabelecimentos-ativos-brasil-2026',
  '/planos',
  '/en/blog/ai-review-analysis-guide',
  '/es/blog/analisis-resenas-ia',
];

const OTHER_96 = Array.from(
  { length: 96 },
  (_, i) => `${SITE}/pagina-${String(i + 1).padStart(3, '0')}`,
);
const STALE_97 = [`${SITE}/`, ...OTHER_96];
const CANONICAL_107 = [`${SITE}/`, ...OTHER_96, ...MISSING_TEN.map((p) => `${SITE}${p}`)];
const LEGACY_125 = [
  ...STALE_97,
  ...Array.from({ length: 28 }, (_, i) => `${SITE}/zh/pagina-${i + 1}`),
];
const LEGACY_WITH_NOISE = [
  ...LEGACY_125,
  `${SITE}/`,
  `${SITE}//`,
  `${STALE_97[1]}/`,
  `${STALE_97[1]}?utm=1`,
  'https://example.com/fora',
];

const ROBOTS_OK = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  '',
  'Sitemap: https://filtraai.com/sitemap-index.xml',
  'Sitemap: https://filtraai.com/sitemap.xml',
  'Sitemap: https://filtraai.com/indice/sitemap-index.xml',
  '',
].join('\n');

function makeSitemap(locs) {
  const entries = locs.map((loc, index) => [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>2026-11-${String((index % 28) + 1).padStart(2, '0')}</lastmod>`,
    '  </url>',
  ].join('\n'));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

const locsOf = (xml) => [...String(xml).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

function makeCache() {
  const entries = new Map();
  return {
    entries,
    async match(key) {
      const value = entries.get(typeof key === 'string' ? key : key.url);
      return value ? value.clone() : undefined;
    },
    async put(key, value) {
      entries.set(typeof key === 'string' ? key : key.url, value.clone());
    },
  };
}

function loadWorker({ fetchImpl, cache = makeCache() }) {
  let fetchHandler = null;
  const contexto = vm.createContext({
    addEventListener(tipo, handler) {
      if (tipo === 'fetch') fetchHandler = handler;
    },
    fetch: fetchImpl,
    caches: { default: cache },
    Response,
    Request,
    Headers,
    URL,
    AbortSignal,
    setTimeout,
    clearTimeout,
    console,
  });
  vm.runInContext(
    `${workerSource}\n;globalThis.__workerTest = {\n` +
      '  resolveSitemap, resolveRobots, sanitizeSitemapFallback, sitemapUrlSet,\n' +
      '  normalizeSitemapUrl, generatedRobotsFallback, validResource,\n' +
      '  SEO_ORIGIN, FALLBACK_SEO_ORIGIN, CACHE_VERSION, MIN_SITEMAP_URLS, KEY, KEY_PATH,\n' +
      '};',
    contexto,
    { filename: 'filtra-indexnow-key.js' },
  );
  assert.equal(typeof fetchHandler, 'function', 'o Worker precisa registrar addEventListener(fetch)');
  return {
    cache,
    hooks: contexto.__workerTest,
    async handle(url, method = 'GET') {
      const pending = [];
      let responsePromise = null;
      fetchHandler({
        request: new Request(url, { method }),
        respondWith(value) { responsePromise = Promise.resolve(value); },
        waitUntil(value) { pending.push(Promise.resolve(value)); },
      });
      assert.ok(responsePromise, 'o Worker não chamou respondWith');
      return { response: await responsePromise, pending };
    },
  };
}

function sitemapResponse(xml) {
  return new Response(xml, {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}

function robotsResponse(body = ROBOTS_OK) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

function mockFetch(routes, calls = []) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input.url ?? input.href ?? String(input));
    calls.push({ url, init });
    const rota = Object.entries(routes).find(([prefixo]) => url.startsWith(prefixo));
    if (!rota) return new Response('not found', { status: 404 });
    return rota[1](url, init);
  };
}

async function seedCache(cache, kind, pathname, body, { ageMs = 0, origin = kind } = {}) {
  const headers = {
    'content-type': pathname === '/sitemap.xml' ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8',
    'x-filtra-seo-cached-at': String(Date.now() - ageMs),
    'x-filtra-seo-origin': origin,
  };
  await cache.put(
    new Request(`${SITE}/__seo-cache-v2/${kind}${pathname}`),
    new Response(body, { status: 200, headers }),
  );
}

// --- Normalização e sanitização ---------------------------------------------

test('normaliza URLs e descarta /zh, query, hash e hosts estranhos', () => {
  const { hooks } = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  const xml = makeSitemap([
    `${SITE}/`,
    `${SITE}/sobre`,
    `${SITE}/sobre/`,
    `${SITE}/sobre?utm=1`,
    `${SITE}/sobre#top`,
    `${SITE}/zh`,
    `${SITE}/zh/blog`,
    'http://filtraai.com/planos',
    'https://www.filtraai.com/planos',
    'https://example.com/planos',
    `${SITE}/planos`,
  ]);
  assert.deepEqual(
    [...hooks.sitemapUrlSet(xml)].sort(),
    [`${SITE}/`, `${SITE}/planos`, `${SITE}/sobre`].sort(),
  );
  assert.equal(hooks.normalizeSitemapUrl(`${SITE}/`), `${SITE}/`);
  assert.equal(hooks.normalizeSitemapUrl(`${SITE}/sobre/`), `${SITE}/sobre`);
  assert.equal(hooks.normalizeSitemapUrl(`${SITE}/zh/`), null);
  assert.equal(hooks.normalizeSitemapUrl('https://example.com/'), null);
});

test('sanitiza o export estático legado de 125 para 97 URLs canônicas', () => {
  const { hooks } = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  const { xml, urls } = hooks.sanitizeSitemapFallback(makeSitemap(LEGACY_WITH_NOISE));
  assert.equal(urls.size, 97);
  assert.equal(locsOf(xml).length, 97);
  assert.ok(![...urls].some((url) => url.includes('/zh')));
  assert.ok(!xml.includes('/zh'));
});

test('rejeita fallback de 97 quando a referência canônica tem 107', () => {
  const { hooks } = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  assert.throws(
    () => hooks.sanitizeSitemapFallback(makeSitemap(STALE_97), new Set(CANONICAL_107)),
    /missing 10 canonical URLs/,
  );
});

test('aceita fallback com os mesmos 107 URLs da referência', () => {
  const { hooks } = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  const { urls } = hooks.sanitizeSitemapFallback(makeSitemap(CANONICAL_107), new Set(CANONICAL_107));
  assert.equal(urls.size, 107);
});

test('rejeita urlset incompleto e sitemapindex no fallback', () => {
  const { hooks } = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  assert.throws(
    () => hooks.sanitizeSitemapFallback('<urlset><url><loc>https://filtraai.com/x</loc></url>'),
    /complete urlset/,
  );
  assert.throws(
    () => hooks.sanitizeSitemapFallback(
      '<sitemapindex><sitemap><loc>https://filtraai.com/s.xml</loc></sitemap></sitemapindex>',
    ),
    /complete urlset/,
  );
});

// --- Sitemap: cadeia Render -> Vercel -> cache v2 -> 503 ---------------------

test('serve o sitemap primário com 107 URLs e grava cache v2', async () => {
  const cache = makeCache();
  const calls = [];
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
    }, calls),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'render-primary');
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'miss');
  assert.equal(response.headers.get('x-filtra-seo-version'), 'v2');
  assert.equal(response.headers.get('x-filtra-seo-urls'), '107');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(locsOf(await response.text()).length, 107);
  assert.ok(cache.entries.has(`${SITE}/__seo-cache-v2/primary/sitemap.xml`));
  assert.equal(calls.filter((c) => c.url.startsWith(RENDER)).length, 1);
  assert.equal(calls.filter((c) => c.url.startsWith(VERCEL)).length, 0);
});

test('usa a Vercel com paridade quando o Render falha', async () => {
  const cache = makeCache();
  const calls = [];
  let renderCalls = 0;
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => {
        renderCalls += 1;
        return new Response('bad gateway', { status: 502 });
      },
      [`${VERCEL}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
    }, calls),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'vercel-fallback');
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'miss');
  assert.equal(response.headers.get('x-filtra-seo-version'), 'v2');
  assert.equal(response.headers.get('x-filtra-seo-urls'), '107');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(locsOf(await response.text()).length, 107);
  assert.equal(renderCalls, 2);
  assert.equal(calls.filter((c) => c.url.startsWith(VERCEL)).length, 1);
  assert.ok(cache.entries.has(`${SITE}/__seo-cache-v2/fallback/sitemap.xml`));
});

test('rejeita fallback de 97 mesmo com o Render fora e serve o cache 107', async () => {
  const cache = makeCache();
  await seedCache(cache, 'primary', '/sitemap.xml', makeSitemap(CANONICAL_107), {
    ageMs: 5 * 60 * 1000,
    origin: 'render-primary',
  });
  let renderCalls = 0;
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => {
        renderCalls += 1;
        return new Response('bad gateway', { status: 502 });
      },
      [`${VERCEL}/sitemap.xml`]: () => sitemapResponse(makeSitemap(STALE_97)),
    }),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'render-primary');
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'stale');
  assert.equal(response.headers.get('x-filtra-seo-urls'), '107');
  assert.match(response.headers.get('warning') ?? '', /110/);
  assert.equal(locsOf(await response.text()).length, 107);
  assert.equal(renderCalls, 2);
});

test('cold cache + Vercel 97 retorna 503 em vez de servir o conjunto menor', async () => {
  const cache = makeCache();
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/sitemap.xml`]: () => sitemapResponse(makeSitemap(STALE_97)),
    }),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(cache.entries.has(`${SITE}/__seo-cache-v2/fallback/sitemap.xml`), false);
  assert.match(await response.text(), /temporarily unavailable/);
});

test('serve o último sitemap íntegro quando Render e Vercel falham', async () => {
  const cache = makeCache();
  await seedCache(cache, 'primary', '/sitemap.xml', makeSitemap(CANONICAL_107), {
    ageMs: 5 * 60 * 1000,
    origin: 'render-primary',
  });
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
    }),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'stale');
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'render-primary');
  assert.match(response.headers.get('warning') ?? '', /110/);
  assert.equal(locsOf(await response.text()).length, 107);
});

test('sem cache e com as duas origens fora, retorna 503 sem tocar no host legado', async () => {
  const calls = [];
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
    }, calls),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.ok(!calls.some((c) => c.url.includes('filtra-ai-frontend.filtra-ai.workers.dev')));
  assert.equal(calls.filter((c) => c.url.startsWith(RENDER)).length, 2);
  assert.equal(calls.filter((c) => c.url.startsWith(VERCEL)).length, 2);
});

test('ignora a cópia antiga do cache v1 (97 URLs)', async () => {
  const cache = makeCache();
  await cache.put(
    new Request(`${SITE}/__seo-cache/sitemap.xml`),
    new Response(makeSitemap(STALE_97), {
      status: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'x-filtra-seo-cached-at': String(Date.now() - 5 * 60 * 1000),
        'x-filtra-seo-origin': 'cloudflare-static-fallback',
      },
    }),
  );
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/sitemap.xml`]: () => new Response('bad gateway', { status: 502 }),
    }),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 503);
  assert.equal(cache.entries.has(`${SITE}/__seo-cache-v2/fallback/sitemap.xml`), false);
});

test('cache fresco do fallback evita bater nas duas origens a cada request', async () => {
  const cache = makeCache();
  const calls = [];
  let renderCalls = 0;
  const worker = loadWorker({
    cache,
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => {
        renderCalls += 1;
        return new Response('bad gateway', { status: 502 });
      },
      [`${VERCEL}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
    }, calls),
  });
  const primeira = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(primeira.response.status, 200);
  assert.equal(primeira.response.headers.get('x-filtra-seo-cache'), 'miss');
  const renderDepoisDaPrimeira = renderCalls;
  const chamadasDepoisDaPrimeira = calls.length;

  const segunda = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(segunda.response.status, 200);
  assert.equal(segunda.response.headers.get('x-filtra-seo-origin'), 'vercel-fallback');
  assert.equal(segunda.response.headers.get('x-filtra-seo-cache'), 'fresh');
  assert.equal(renderCalls, renderDepoisDaPrimeira);
  assert.equal(calls.length, chamadasDepoisDaPrimeira);
});

test('resposta pública é no-store com versão e contagem; HEAD não tem corpo', async () => {
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
    }),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`, 'HEAD');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-filtra-seo-version'), 'v2');
  assert.equal(response.headers.get('x-filtra-seo-urls'), '107');
  assert.match(response.headers.get('content-type') ?? '', /application\/xml/);
});

test('rejeita método, host e caminho fora do contrato', async () => {
  const worker = loadWorker({ fetchImpl: async () => new Response('', { status: 500 }) });
  const { response: metodo } = await worker.handle(`${SITE}/sitemap.xml`, 'POST');
  assert.equal(metodo.status, 405);
  assert.equal(metodo.headers.get('allow'), 'GET, HEAD');
  const { response: host } = await worker.handle('https://example.com/sitemap.xml');
  assert.equal(host.status, 404);
  const { response: caminho } = await worker.handle(`${SITE}/nao-existe`);
  assert.equal(caminho.status, 404);
});

test('sitemapindex na origem primária é rejeitado e a Vercel é usada', async () => {
  const calls = [];
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => sitemapResponse(
        '<sitemapindex><sitemap><loc>https://filtraai.com/sitemap.xml</loc></sitemap></sitemapindex>',
      ),
      [`${VERCEL}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
    }, calls),
  });
  const { response } = await worker.handle(`${SITE}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'vercel-fallback');
  assert.equal(calls.filter((c) => c.url.startsWith(RENDER)).length, 1);
});

// --- IndexNow ---------------------------------------------------------------

test('GET na chave devolve a chave e envia as 107 URLs válidas ao IndexNow', async () => {
  const calls = [];
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
      'https://api.indexnow.org/indexnow': () => new Response('', { status: 200 }),
    }, calls),
  });
  const { response, pending } = await worker.handle(`${SITE}${worker.hooks.KEY_PATH}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), worker.hooks.KEY);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  await Promise.all(pending);

  const envio = calls.find((c) => c.url === 'https://api.indexnow.org/indexnow');
  assert.ok(envio, 'o IndexNow não foi chamado');
  const corpo = JSON.parse(envio.init.body);
  assert.equal(corpo.host, 'filtraai.com');
  assert.equal(corpo.key, worker.hooks.KEY);
  assert.equal(corpo.keyLocation, `${SITE}${worker.hooks.KEY_PATH}`);
  assert.equal(corpo.urlList.length, 107);
  assert.ok(!corpo.urlList.some((url) => url.includes('/zh')));
});

test('HEAD na chave não dispara envio ao IndexNow', async () => {
  const calls = [];
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/sitemap.xml`]: () => sitemapResponse(makeSitemap(CANONICAL_107)),
      'https://api.indexnow.org/indexnow': () => new Response('', { status: 200 }),
    }, calls),
  });
  const { response, pending } = await worker.handle(`${SITE}${worker.hooks.KEY_PATH}`, 'HEAD');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(pending.length, 0);
  assert.equal(calls.length, 0);
});

// --- robots.txt -------------------------------------------------------------

test('serve o robots.txt primário com no-store', async () => {
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/robots.txt`]: () => robotsResponse(),
    }),
  });
  const { response } = await worker.handle(`${SITE}/robots.txt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'render-primary');
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'miss');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
  assert.match(await response.text(), /Sitemap: https:\/\/filtraai\.com\/sitemap-index\.xml/);
});

test('usa o robots.txt da Vercel quando o Render falha', async () => {
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/robots.txt`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/robots.txt`]: () => robotsResponse(),
    }),
  });
  const { response } = await worker.handle(`${SITE}/robots.txt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'vercel-fallback');
});

test('robots.txt inválido na origem primária não é servido', async () => {
  const calls = [];
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/robots.txt`]: () => robotsResponse('User-agent: *\nAllow: /\n'),
      [`${VERCEL}/robots.txt`]: () => robotsResponse(),
    }, calls),
  });
  const { response } = await worker.handle(`${SITE}/robots.txt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'vercel-fallback');
  assert.equal(calls.filter((c) => c.url.startsWith(RENDER)).length, 1);
});

test('gera robots.txt de emergência quando não há origem nem cache', async () => {
  const worker = loadWorker({
    fetchImpl: mockFetch({
      [`${RENDER}/robots.txt`]: () => new Response('bad gateway', { status: 502 }),
      [`${VERCEL}/robots.txt`]: () => new Response('bad gateway', { status: 502 }),
    }),
  });
  const { response } = await worker.handle(`${SITE}/robots.txt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-filtra-seo-origin'), 'generated-robots-fallback');
  assert.equal(response.headers.get('x-filtra-seo-cache'), 'generated');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const corpo = await response.text();
  assert.match(corpo, /User-agent: OAI-SearchBot/);
  assert.match(corpo, /Sitemap: https:\/\/filtraai\.com\/sitemap-index\.xml/);
  assert.match(corpo, /Sitemap: https:\/\/filtraai\.com\/sitemap\.xml/);
  assert.match(corpo, /Sitemap: https:\/\/filtraai\.com\/indice\/sitemap-index\.xml/);
});

// --- Paridade com a fonte do robots.txt -------------------------------------

const crawlersDoWorker = [...(workerSource.match(/const crawlers = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([A-Za-z-]+)'/g)].map((m) => m[1]);
const crawlersDaFonte = [...(robotsTs.match(/const AI_CRAWLERS = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([A-Za-z-]+)'/g)].map((m) => m[1]);

const sitemapsDoWorker = [...workerSource.matchAll(/'(Sitemap: https:\/\/filtraai\.com[^']*)'/g)].map((m) => m[1]);
const sitemapsDaFonte = [...(robotsTs.match(/sitemap:\s*\[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/`\$\{base\}(\/[^`]*)`/g)].map(
  (m) => `Sitemap: https://filtraai.com${m[1]}`,
);

test('lista de crawlers do Worker espelha frontend/src/app/robots.ts', () => {
  assert.ok(crawlersDaFonte.length >= 10, 'AI_CRAWLERS não foi lida da fonte');
  assert.deepEqual(crawlersDoWorker, crawlersDaFonte);
});

test('robots.txt de fallback anuncia exatamente os mesmos sitemaps da fonte', () => {
  assert.deepEqual(sitemapsDoWorker, sitemapsDaFonte);
});

test('fallback mantém o leaf porque o workflow de CI ainda o exige', () => {
  // A desduplicação do leaf (/sitemap.xml é filho do índice central) é desejável,
  // mas `.github/workflows/ci.yml` ainda verifica o leaf em robots.txt e o token
  // automatizado não tem permissão `workflows` para atualizar o workflow. Até lá,
  // a paridade com frontend/src/app/robots.ts (teste acima) é o contrato.
  assert.ok(sitemapsDoWorker.includes('Sitemap: https://filtraai.com/sitemap-index.xml'));
  assert.ok(sitemapsDoWorker.includes('Sitemap: https://filtraai.com/indice/sitemap-index.xml'));
  assert.ok(sitemapsDoWorker.includes('Sitemap: https://filtraai.com/sitemap.xml'));
});

test('validResource continua exigindo o índice central no robots de origem', () => {
  // Se a origem parar de anunciar o índice central, o fallback gerado seria usado
  // silenciosamente: a validação precisa continuar barrando isso.
  assert.ok(workerSource.includes('/sitemap-index\\.xml/i.test(body)'), 'validResource deve validar o robots pela presença do índice central');
  assert.ok(workerSource.includes('/user-agent:/i.test(body)'));
});

test('o host estático legado não é mais consultado em runtime', () => {
  assert.ok(workerSource.includes(RETIRED), 'a origem aposentada deve permanecer documentada');
  assert.ok(!/fetch\s*\(\s*new URL\([^)]*RETIRED/.test(workerSource));
  assert.ok(!workerSource.includes("STATIC_SEO_ORIGIN"));
});
