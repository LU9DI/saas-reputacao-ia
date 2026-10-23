#!/usr/bin/env node

/**
 * Verify the initial HTML language over real HTTP.
 *
 * This is intentionally a separate check from the static-export guardrail:
 * it verifies the document produced by `next start`/Vercel, before any
 * client-side JavaScript runs. It can also be pointed at a deployment:
 *
 *   HTML_LANG_BASE_URL=https://filtraai.com npm run seo:html-lang:http
 */
import assert from 'node:assert/strict';

const baseUrl = (process.env.HTML_LANG_BASE_URL || process.argv[2] || 'http://127.0.0.1:3000').replace(/\/+$/, '');

const routes = [
  ['/', 'pt-BR'],
  ['/en/google-reviews', 'en'],
  ['/es/reputacion-google', 'es'],
  ['/zh', 'zh'],
];

function expectedLanguage(path) {
  const firstSegment = path.split('/').filter(Boolean)[0] || '';
  return ['en', 'es', 'zh'].includes(firstSegment) ? firstSegment : 'pt-BR';
}

function robotsContent(html) {
  const nameFirst = html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];
  const contentFirst = html.match(/<meta\b[^>]*\bcontent=["'][^"']*["'][^>]*\bname=["']robots["'][^>]*>/i)?.[0];
  return nameFirst || contentFirst || '';
}

for (const [path, expected] of routes) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, { redirect: 'manual' });
  assert.equal(response.status, 200, `Expected HTTP 200 for ${url}, got ${response.status}`);
  const html = await response.text();
  const openingHtml = html.match(/<html\b[^>]*>/i)?.[0];
  assert.ok(openingHtml, `No <html> element in HTTP response for ${url}`);
  const lang = openingHtml.match(/\blang\s*=\s*(["'])(.*?)\1/i)?.[2];
  assert.equal(lang, expected, `Expected <html lang="${expected}"> for ${url}, got ${JSON.stringify(lang)}`);
  assert.doesNotMatch(
    html,
    /id=["']localized-document-language["']/i,
    `Client-side document language override still present on ${url}`,
  );
  assert.equal(expected, expectedLanguage(path), `Route expectation mismatch for ${path}`);

  if (path === '/zh') {
    const robots = robotsContent(html);
    assert.match(robots, /\bnoindex\b/i, 'Expected /zh to emit robots noindex');
    assert.match(robots, /\bfollow\b/i, 'Expected /zh to emit robots follow');
  }

  console.log(`OK ${url} -> html lang="${lang}"`);
}

console.log(`HTTP HTML language guardrail passed for ${baseUrl}.`);
