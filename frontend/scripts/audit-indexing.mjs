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
  'https://filtraai.com/zh',
];
const NEVER_INDEX = [
  /^\/(?:admin|painel|api|avaliacao|widget)(?:\/|$)/,
  /^\/(?:login|recuperar-senha|teste|preview|pagamento-ok|suporte)(?:\/|$)/,
];
const NOINDEX_ROUTES = [
  '/login',
  '/admin',
  '/painel/_',
  '/avaliacao/_',
  '/widget/_',
  '/pagamento-ok',
  '/preview',
  '/teste',
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
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  if (canonicalMatch) {
    try {
      const canonical = new URL(canonicalMatch[1], raw).toString();
      if (normalize(canonical) !== key) {
        fail(`canonical mismatch: sitemap ${raw} points to ${canonical}`);
      }
    } catch {
      fail(`invalid canonical URL on ${raw}: ${canonicalMatch[1]}`);
    }
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
for (const prefix of ['/painel/', '/admin/', '/avaliacao/', '/widget/', '/login', '/recuperar-senha', '/teste', '/preview', '/pagamento-ok', '/suporte']) {
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
  const hasNoindex =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  if (!hasNoindex) fail(`route lacks a robots noindex directive: ${route}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Indexing audit PASSED: ${urls.length} unique URLs, static files, canonicals and noindex routes verified.`);
