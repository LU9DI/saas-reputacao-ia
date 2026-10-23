import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./worker.js', import.meta.url), 'utf8');

test('Cloudflare Worker does not hardcode or intercept the sitemap', () => {
  assert.doesNotMatch(source, /SEO_SITEMAP_XML|url\.pathname\s*===\s*['"]\/sitemap\.xml['"]|filtraai-seo-20261006-a8c2f9d7/);
});

test('Cloudflare Worker does not rewrite SEO metadata or rescue thin pages', () => {
  for (const marker of ['SEO_EDGE', 'SEO_RESCUE', 'seoConfig(', 'rescueResponse(', 'rewriteSeoResponse(', 'enhanceResponse(']) {
    assert.ok(!source.includes(marker), `unexpected SEO mutation remains: ${marker}`);
  }
});

test('Worker preserves the primary and fallback response bodies', () => {
  assert.match(source, /return decorate\(primary\.response, ['"]primary['"]\)/);
  assert.match(source, /return decorate\(fallback\.response, ['"]fallback['"]\)/);
});
