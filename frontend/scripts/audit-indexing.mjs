#!/usr/bin/env node

/**
 * Validates the actual static-export artifact that is intended for Cloudflare Pages.
 * This is deliberately dependency-free so it can run in CI before any deployment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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

function fail(message) {
  console.error(`Indexing audit FAILED: ${message}`);
  process.exitCode = 1;
}

function normalize(url) {
  const parsed = new URL(url);
  const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
  return `${parsed.origin}${path}`;
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

  const routePath = parsed.pathname === '/' ? '' : parsed.pathname;
  const candidates = routePath
    ? [join(OUT, `${routePath}.html`), join(OUT, routePath, 'index.html'), join(OUT, routePath)]
    : [join(OUT, 'index.html')];
  if (!candidates.some((candidate) => existsSync(candidate))) {
    fail(`sitemap URL has no exported HTML file: ${raw}`);
    continue;
  }

  const htmlPath = candidates.find((candidate) => existsSync(candidate));
  const html = readFileSync(htmlPath, 'utf8');
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
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
  if (!normalized.has(normalize(required))) fail(`required SEO landing page missing from sitemap: ${required}`);
}

if (!robots.includes('Sitemap: https://filtraai.com/sitemap.xml')) {
  fail('robots.txt does not advertise the canonical sitemap URL');
}
if (!/Disallow:\s*\/widget\//i.test(robots)) {
  fail('robots.txt must disallow private/widget endpoints');
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Indexing audit PASSED: ${urls.length} unique URLs, canonical host and static files verified.`);
