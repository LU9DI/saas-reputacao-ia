#!/usr/bin/env node

/**
 * Verify the actual HTML emitted by the Cloudflare static export.
 * This intentionally inspects generated files, not React source or client JS.
 *
 * The route-level root layouts are responsible for the initial <html lang>:
 * app/(default)/layout.tsx emits pt-BR and app/[lang]/layout.tsx emits the
 * localized language. No post-build rewrite or client-side patch is allowed.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

if (process.env.CLOUDFLARE_PAGES !== '1') {
  console.log('HTML language guardrail skipped: static export mode is not enabled.');
  process.exit(0);
}

const out = resolve(process.cwd(), 'out');

function htmlForRoute(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [resolve(out, `${clean}.html`), resolve(out, clean, 'index.html')]
    : [resolve(out, 'index.html')];
  const file = candidates.find(existsSync);
  assert.ok(file, `Missing exported HTML for route "/${clean}" (checked: ${candidates.join(', ')})`);
  return { file, html: readFileSync(file, 'utf8') };
}

function routeForFile(file) {
  const path = relative(out, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'/index.html'.length)}`;
  return `/${path.replace(/\.html$/i, '')}`;
}

function expectedLanguage(route) {
  const firstSegment = route.split('/').filter(Boolean)[0] || '';
  return ['en', 'es', 'zh'].includes(firstSegment) ? firstSegment : 'pt-BR';
}

function assertLanguage(route, html) {
  const openingHtml = html.match(/<html\b[^>]*>/i)?.[0];
  assert.ok(openingHtml, `No <html> element in exported route "${route}"`);
  const lang = openingHtml.match(/\blang\s*=\s*(["'])(.*?)\1/i)?.[2];
  const expected = expectedLanguage(route);
  assert.equal(lang, expected, `Expected <html lang="${expected}"> for "${route}", got ${JSON.stringify(lang)}`);
}

function assertNoClientLanguageOverride(route, html) {
  assert.doesNotMatch(
    html,
    /id=["']localized-document-language["']/i,
    `Client-side document language override still present on "${route}"`,
  );
}

function robotsContent(html) {
  const nameFirst = html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];
  const contentFirst = html.match(/<meta\b[^>]*\bcontent=["'][^"']*["'][^>]*\bname=["']robots["'][^>]*>/i)?.[0];
  return nameFirst || contentFirst || '';
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

for (const route of ['/', '/en/google-reviews', '/es/reputacion-google', '/zh']) {
  const { html } = htmlForRoute(route);
  assertLanguage(route, html);
  assertNoClientLanguageOverride(route, html);
  console.log(`OK ${route} -> html lang="${expectedLanguage(route)}"`);
}

const zh = htmlForRoute('/zh').html;
const zhRobots = robotsContent(zh);
assert.match(zhRobots, /\bnoindex\b/i, 'Expected /zh to emit robots noindex');
assert.match(zhRobots, /\bfollow\b/i, 'Expected /zh to emit robots follow');

let checked = 0;
for (const file of walk(out)) {
  const route = routeForFile(file);
  const html = readFileSync(file, 'utf8');
  assertLanguage(route, html);
  assertNoClientLanguageOverride(route, html);
  checked += 1;
}

console.log(`Static HTML language guardrail passed for ${checked} HTML files; /zh is noindex, follow.`);
