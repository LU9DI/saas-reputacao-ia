#!/usr/bin/env node
import assert from 'node:assert/strict';

const base = (process.env.SEO_PRODUCTION_BASE_URL || process.argv[2] || 'https://filtraai.com').replace(/\/+$/, '');
const required = [
  '/', '/planos', '/calculadora-nota-google', '/filtra-ai', '/clinicas',
  '/hoteis', '/restaurantes', '/franquias', '/agencias', '/turismo',
  '/associacoes', '/reputacao-google',
];
const normalizeUrl = (value) => {\n  const parsed = new URL(value);\n  return parsed.origin + (parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\\/$/, ''));\n};\nconst expectedLang = (pathname) => {
  const first = pathname.split('/').filter(Boolean)[0] || '';
  return ['en', 'es', 'zh'].includes(first) ? first : 'pt-BR';
};
const response = await fetch(`${base}/sitemap.xml`, { redirect: 'manual' });
assert.equal(response.status, 200, `Expected sitemap HTTP 200, got ${response.status}`);
assert.match(response.headers.get('content-type') || '', /xml/i, 'Sitemap response must be XML');
const xml = await response.text();
const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].replaceAll('&amp;', '&').trim());
assert.ok(urls.length > 0, 'Production sitemap has no URLs');
const set = new Set(urls.map((url) => new URL(url).origin + new URL(url).pathname.replace(/\/$/, '')));
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.hostname, 'filtraai.com', `Unexpected sitemap host: ${url}`);
  assert.ok(!/^\/zh(?:\/|$)/.test(parsed.pathname), `ZH noindex URL must not be in sitemap: ${url}`);
}
for (const path of required) {
  const canonicalPath = path === '/' ? '/' : path.replace(/\/$/, '');
  assert.ok(set.has(normalizeUrl(`https://filtraai.com${canonicalPath}`)), `Required URL missing from production sitemap: ${path}`);
}
const targets = [...new Set([...required, ...urls.map((url) => new URL(url).pathname)])];
let cursor = 0;
const errors = [];
async function worker() {
  while (cursor < targets.length) {
    const path = targets[cursor++];
    const url = `${base}${path}`;
    try {
      const page = await fetch(url, { redirect: 'manual' });
      assert.equal(page.status, 200, `${path}: expected HTTP 200, got ${page.status}`);
      const html = await page.text();
      const opening = html.match(/<html\b[^>]*>/i)?.[0];
      assert.ok(opening, `${path}: missing initial HTML element`);
      const lang = opening.match(/\blang=[\"']([^\"']+)[\"']/i)?.[1];
      assert.equal(lang, expectedLang(path), `${path}: incorrect initial html lang`);
      const canonicalTag = html.match(/<link\b[^>]*rel=[\"']canonical[\"'][^>]*>/i)?.[0]
        || html.match(/<link\b[^>]*href=[\"'][^\"']+[\"'][^>]*rel=[\"']canonical[\"'][^>]*>/i)?.[0];
      assert.ok(canonicalTag, `${path}: missing canonical`);
      const canonical = canonicalTag.match(/\bhref=[\"']([^\"']+)[\"']/i)?.[1];
      assert.ok(canonical, `${path}: canonical missing href`);
      assert.equal(new URL(canonical, url).origin + new URL(canonical, url).pathname.replace(/\/$/, ''), `https://filtraai.com${path === '/' ? '/' : path.replace(/\/$/, '')}`, `${path}: canonical is not self-referencing`);
      if (/^\/zh(?:\/|$)/.test(path)) {
        assert.match(html, /<meta\b[^>]*name=[\"']robots[\"'][^>]*content=[\"'][^\"']*noindex/i, `${path}: ZH page must be noindex`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
assert.deepEqual(errors, [], `Production SEO smoke failures:\n${errors.join('\n')}`);
console.log(`Production SEO smoke passed: sitemap has ${urls.length} URLs; ${targets.length} pages returned 200 with expected language and canonical; no ZH sitemap entries.`);
