#!/usr/bin/env node

/**
 * Verify the actual HTML emitted by the Cloudflare static export.
 * This intentionally inspects generated files, not React source or client JS.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve(process.cwd(), 'out');

function htmlForRoute(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [resolve(out, `${clean}.html`), resolve(out, clean, 'index.html')]
    : [resolve(out, 'index.html')];
  const file = candidates.find(existsSync);
  assert.ok(file, `Missing exported HTML for route "/${clean}" (checked: ${candidates.join(', ')})`);
  return readFileSync(file, 'utf8');
}

function assertLanguage(route, expected) {
  const html = htmlForRoute(route);
  const openingHtml = html.match(/<html\b[^>]*>/i)?.[0];
  assert.ok(openingHtml, `No <html> element in exported route "/${route}"`);
  const lang = openingHtml.match(/\blang\s*=\s*(["'])(.*?)\1/i)?.[2];
  assert.equal(lang, expected, `Expected <html lang="${expected}"> for "/${route}", got ${JSON.stringify(lang)}`);
  console.log(`OK / ${route} -> html lang="${lang}"`);
}

assert.ok(existsSync(out), 'Missing out/ directory; run the Cloudflare static export first.');
assertLanguage('/', 'pt-BR');
assertLanguage('/en/google-reviews', 'en');
assertLanguage('/es/reputacion-google', 'es');
assertLanguage('/zh', 'zh');
console.log('Static HTML language guardrail passed.');
