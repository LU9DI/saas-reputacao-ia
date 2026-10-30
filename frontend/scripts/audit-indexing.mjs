#!/usr/bin/env node

/**
 * Validates the static-export artifact intended for Cloudflare Pages.
 * Dependency-free so it can run in CI before deployment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const OUT = resolve(process.cwd(), 'out');
const SITEMAP = join(OUT, 'sitemap.xml');
const ROBOTS = join(OUT, 'robots.txt');
const EXPECTED_HOST = 'filtraai.com';
const REQUIRED_URLS = [
  'https://filtraai.com/',
  'https://filtraai.com/filtra-ai',
  'https://filtraai.com/gestao-de-reputacao-online',
  'https://filtraai.com/avaliacoes-google',
  'https://filtraai.com/reputacao-google',
  'https://filtraai.com/analise-de-avaliacoes-com-ia',
  'https://filtraai.com/feedback-de-clientes',
  'https://filtraai.com/como-melhorar-avaliacoes-google',
  'https://filtraai.com/monitoramento-reputacao-online',
  'https://filtraai.com/gestao-de-feedback',
  'https://filtraai.com/en',
  'https://filtraai.com/es',
];
const NEVER_INDEX = [
  /^\/(?:admin|painel|api|avaliacao|widget)(?:\/|$)/,
  /^\/(?:login|recuperar-senha|teste|preview|pagamento-ok|suporte)(?:\/|$)/,
];
const NOINDEX_ROUTES = [
  '/login',
  '/admin',
  '/admin/login',
  '/painel/preview',
  '/painel/_',
  '/avaliacao/_',
  '/widget/_',
  '/pagamento-ok',
  '/preview',
  '/preview/teste',
  '/teste',
  '/teste/verificar',
  '/recuperar-senha',
  '/suporte',
];

function fail(message) {
  console.error(`Indexing audit FAILED: ${message}`);
  process.exitCode = 1;
}

function normalize(url) {
  const parsed = new URL(url);
  const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
  return `${parsed.origin}${path}`;
}

function htmlCandidates(routePath) {
  if (routePath === '/') return [join(OUT, 'index.html')];
  const safePath = routePath.replace(/^\/+/, '');
  const candidates = [
    join(OUT, `${safePath}.html`),
    join(OUT, safePath, 'index.html'),
    join(OUT, safePath),
  ];
  return candidates.filter((candidate) => {
    const absolute = resolve(candidate);
    return absolute === OUT || absolute.startsWith(OUT + sep);
  });
}

function findHtml(routePath) {
  return htmlCandidates(routePath).find((candidate) => existsSync(candidate));
}

function expectedLanguage(routePath) {
  const firstSegment = routePath.split('/').filter(Boolean)[0] || '';
  return ['en', 'es', 'zh'].includes(firstSegment) ? firstSegment : 'pt-BR';
}

function assertHtmlLanguage(html, routePath) {
  const match = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i);
  const expected = expectedLanguage(routePath);
  if (!match) fail(`missing <html lang> on ${routePath}`);
  else if (match[1] !== expected) fail(`wrong HTML language on ${routePath}: expected ${expected}, got ${match[1]}`);
}

if (!existsSync(SITEMAP)) fail('out/sitemap.xml is missing');
if (!existsSync(ROBOTS)) fail('out/robots.txt is missing');
if (process.exitCode) process.exit(process.exitCode);

const sitemap = readFileSync(SITEMAP, 'utf8');
const robots = readFileSync(ROBOTS, 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) =>
  m[1].replaceAll('&amp;', '&').trim(),
);

if (!urls.length) fail('sitemap contains no <loc> entries');

const normalized = new Set();
for (const raw of urls) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    fail(`invalid URL in sitemap: ${raw}`);
    continue;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== EXPECTED_HOST) {
    fail(`URL must use https://${EXPECTED_HOST}: ${raw}`);
  }
  if (parsed.search || parsed.hash) fail(`query/hash is not allowed in sitemap: ${raw}`);
  if (NEVER_INDEX.some((pattern) => pattern.test(parsed.pathname))) {
    fail(`non-public route must not be in sitemap: ${raw}`);
  }

  const key = normalize(raw);
  if (normalized.has(key)) fail(`duplicate URL in sitemap: ${raw}`);
  normalized.add(key);

  const htmlPath = findHtml(parsed.pathname);
  if (!htmlPath) {
    fail(`sitemap URL has no exported HTML file: ${raw}`);
    continue;
  }

  const html = readFileSync(htmlPath, 'utf8');
  assertHtmlLanguage(html, parsed.pathname);
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  if (!canonicalMatch) {
    fail(`missing canonical link on sitemap URL: ${raw}`);
    continue;
  }
  try {
    const canonical = new URL(canonicalMatch[1], raw).toString();
    if (normalize(canonical) !== key) {
      fail(`canonical mismatch: sitemap ${raw} points to ${canonical}`);
    }
  } catch {
    fail(`invalid canonical URL on ${raw}: ${canonicalMatch[1]}`);
  }

  if (!/<meta[^>]+property=["']og:image["']/i.test(html)) {
    fail(`missing og:image on sitemap URL: ${raw}`);
  }
  if (!/<meta[^>]+name=["']twitter:image["']/i.test(html)) {
    fail(`missing twitter:image on sitemap URL: ${raw}`);
  }
}

for (const required of REQUIRED_URLS) {
  if (!normalized.has(normalize(required))) {
    fail(`required SEO landing page missing from sitemap: ${required}`);
  }
}

if (!robots.includes('Sitemap: https://filtraai.com/sitemap.xml')) {
  fail('robots.txt does not advertise the canonical sitemap URL');
}
if (!/Disallow:\s*\/api\//i.test(robots)) {
  fail('robots.txt must disallow API endpoints');
}
for (const prefix of ['/painel/', '/admin/', '/avaliacao/', '/widget/', '/login', '/recuperar-senha', '/teste', '/preview', '/pagamento-ok', '/planos', '/suporte']) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`Disallow:\\s*${escaped}`, 'i').test(robots)) {
    fail(`robots.txt blocks ${prefix}; crawlers must be able to read its noindex directive`);
  }
}

for (const route of NOINDEX_ROUTES) {
  const htmlPath = findHtml(route);
  if (!htmlPath) {
    fail(`expected noindex route is missing from static export: ${route}`);
    continue;
  }
  const html = readFileSync(htmlPath, 'utf8');
  assertHtmlLanguage(html, route);
  const hasNoindex =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  if (!hasNoindex) fail(`route lacks a robots noindex directive: ${route}`);
}

// Corte do ZH: páginas seguem acessíveis, mas fora do sitemap e com noindex.
for (const route of ['/zh', '/zh/google-reviews', '/zh/blog']) {
  if (normalized.has(normalize(`https://filtraai.com${route}`))) {
    fail(`ZH route must not be in sitemap: ${route}`);
  }
  const htmlPath = findHtml(route);
  if (!htmlPath) continue;
  const html = readFileSync(htmlPath, 'utf8');
  const hasNoindex =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  if (!hasNoindex) fail(`ZH route lacks a robots noindex directive: ${route}`);
}

const notFoundPath = join(OUT, '404.html');
if (!existsSync(notFoundPath)) {
  fail('out/404.html is missing');
} else {
  const notFound = readFileSync(notFoundPath, 'utf8');
  const hasNoindex =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(notFound) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(notFound);
  if (!hasNoindex) fail('404.html must be noindex');
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*index,\s*follow/i.test(notFound)) {
    fail('404.html must not contain an index, follow robots directive');
  }
}

const pluginDemoPath = join(OUT, 'plugin-demo.html');
if (existsSync(pluginDemoPath)) {
  const pluginDemo = readFileSync(pluginDemoPath, 'utf8');
  const hasNoindex =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(pluginDemo) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(pluginDemo);
  if (!hasNoindex) fail('plugin-demo.html must be noindex');
}

const redirectsPath = join(OUT, '_redirects');
if (!existsSync(redirectsPath)) {
  fail('out/_redirects is missing');
} else {
  const redirects = readFileSync(redirectsPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '));
  for (const [route, shell] of [
    ['/painel/*', '/painel/_.html'],
    ['/avaliacao/*', '/avaliacao/_.html'],
    ['/widget/*', '/widget/_.html'],
  ]) {
    if (!redirects.includes(`${route} ${shell} 200`)) {
      fail(`_redirects must map ${route} to ${shell} with status 200`);
    }
  }
}

const centralIndexPath = join(OUT, 'sitemap-index.xml');
if (!existsSync(centralIndexPath)) {
  fail('out/sitemap-index.xml is missing');
} else {
  const centralIndex = readFileSync(centralIndexPath, 'utf8');
  const locs = [...centralIndex.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
  const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), 'src/generated/indice-snapshot.json'), 'utf8'));
  const expectedShards = Math.max(1, Math.ceil(snapshot.urls.total / 10000));
  const indiceShards = locs.filter((loc) => /\/indice\/sitemap\/\d+\.xml$/.test(loc));

  if (!locs.includes('https://filtraai.com/sitemap.xml')) {
    fail('central sitemap index must reference https://filtraai.com/sitemap.xml');
  }
  if (indiceShards.length !== expectedShards) {
    fail(`central sitemap index must list ${expectedShards} Índice shard(s) for ${snapshot.urls.total} URLs, found ${indiceShards.length}`);
  }
  indiceShards.forEach((loc, index) => {
    if (!loc.endsWith(`/indice/sitemap/${index}.xml`)) {
      fail(`central sitemap index shard ${index} must be /indice/sitemap/${index}.xml, got ${loc}`);
    }
  });
  if (locs.some((loc) => !/^https:\/\/filtraai\.com\/(?:sitemap\.xml|indice\/sitemap\/\d+\.xml)$/.test(loc))) {
    fail('central sitemap index must list only /sitemap.xml and /indice/sitemap/<n>.xml');
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Indexing audit PASSED: ${urls.length} unique URLs, static files, canonicals, social images, dynamic shells and noindex routes verified.`);
