#!/usr/bin/env node

/**
 * Verify the actual HTML emitted by the build, not React source or client JS.
 *
 * `CLOUDFLARE_PAGES=1` inspects the static export in `out/`; otherwise it
 * inspects the prerendered server output in `.next/server/app/`, which is what
 * `next start` (Render) sends to crawlers on the first response.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const staticExport = process.env.CLOUDFLARE_PAGES === '1';
const onVercel = process.env.VERCEL === '1';
const out = resolve(process.cwd(), staticExport ? 'out' : '.next/server/app');
const label = staticExport ? 'out/' : '.next/server/app/';

// Na Vercel o HTML não é publicado a partir de `.next/server/app`; o idioma do
// domínio público é verificado por verify-production-seo.mjs contra o Render.
if (onVercel && !staticExport) {
  console.log('HTML language guardrail skipped: Vercel deployment layout.');
  process.exit(0);
}
if (!existsSync(out)) {
  if (staticExport) throw new Error('Missing out/; run the static export first.');
  console.log(`${label} not found; HTML language guardrail skipped for this build.`);
  process.exit(0);
}

function htmlForRoute(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [resolve(out, `${clean}.html`), resolve(out, clean, 'index.html')]
    : [resolve(out, 'index.html')];
  const file = candidates.find(existsSync);
  assert.ok(file, `Missing generated HTML for route "/${clean}" (checked: ${candidates.join(', ')})`);
  return readFileSync(file, 'utf8');
}

function assertLanguage(route, expected) {
  const html = htmlForRoute(route);
  const openingHtml = html.match(/<html\b[^>]*>/i)?.[0];
  assert.ok(openingHtml, `No <html> element in generated route "/${route}"`);
  const lang = openingHtml.match(/\blang\s*=\s*(["'])(.*?)\1/i)?.[2];
  assert.equal(lang, expected, `Expected <html lang="${expected}"> for "/${route}", got ${JSON.stringify(lang)}`);
  console.log(`OK / ${route} -> html lang="${lang}"`);
}

assertLanguage('/', 'pt-BR');
assertLanguage('/en', 'en');
assertLanguage('/es', 'es');
assertLanguage('/zh', 'zh');
assertLanguage('/en/google-reviews', 'en');
assertLanguage('/es/reputacion-google', 'es');
assertLanguage('/blog', 'pt-BR');
console.log(`${label} HTML language guardrail passed.`);
