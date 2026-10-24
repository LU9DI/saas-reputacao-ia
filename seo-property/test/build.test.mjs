import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const builder = resolve(root, 'scripts/build.mjs');
const benchmarksPath = resolve(root, 'data/benchmarks.json');
const fixture = [{
  sector: 'academias',
  state: 'GO',
  sampleBusinesses: 20,
  reviewCount: 100,
  averageRating: 4.2,
  responseRate: 70,
  periodStart: '2026-01-01',
  periodEnd: '2026-09-30',
  updatedAt: '2026-10-01T00:00:00.000Z',
  sourceDescription: 'Fonte <teste>',
  methodologyUrl: 'https://example.test/metodologia',
  topThemes: ['Atendimento & clareza']
}];

test('publishes only qualified data, requires a real origin, and escapes content', async () => {
  const original = await readFile(benchmarksPath, 'utf8');
  const envWithoutOrigin = { ...process.env };
  delete envWithoutOrigin.SEO_PROPERTY_ORIGIN;

  try {
    await writeFile(benchmarksPath, JSON.stringify([]) + '\n');
    execFileSync(process.execPath, [builder], { cwd: root, env: envWithoutOrigin, stdio: 'pipe' });
    const empty = JSON.parse(await readFile(resolve(root, 'dist/inventory.json'), 'utf8'));
    const emptySitemap = await readFile(resolve(root, 'dist/sitemap.xml'), 'utf8');
    assert.equal(empty.candidateCount, 500);
    assert.equal(new Set(empty.candidates.map(p => p.path)).size, 500);
    assert.equal(empty.eligiblePageCount, 0);
    assert.equal(empty.eligiblePages.length, 0);
    assert.equal(emptySitemap.includes('<sitemap>'), false);
    assert.equal(empty.minBusinesses, 20);
    assert.equal(empty.minReviews, 100);

    await writeFile(benchmarksPath, JSON.stringify(fixture, null, 2) + '\n');
    assert.throws(
      () => execFileSync(process.execPath, [builder], { cwd: root, env: envWithoutOrigin, stdio: 'pipe' }),
      error => String(error.stderr || '').includes('SEO_PROPERTY_ORIGIN is required')
    );

    const envWithOrigin = { ...envWithoutOrigin, SEO_PROPERTY_ORIGIN: 'https://index.example.test' };
    execFileSync(process.execPath, [builder], { cwd: root, env: envWithOrigin, stdio: 'pipe' });
    const page = await readFile(resolve(root, 'dist/indice/academias/go/index.html'), 'utf8');
    const inventory = JSON.parse(await readFile(resolve(root, 'dist/inventory.json'), 'utf8'));
    const sitemap = await readFile(resolve(root, 'dist/sitemap-000.xml'), 'utf8');

    assert.equal(inventory.eligiblePageCount, 1);
    assert.ok(page.includes('https://index.example.test/indice/academias/go/'));
    assert.ok(page.includes('Fonte &lt;teste&gt;'));
    assert.ok(page.includes('Atendimento &amp; clareza'));
    assert.ok(sitemap.includes('<lastmod>2026-10-01T00:00:00.000Z</lastmod>'));
    assert.ok(!page.includes('seo-property-not-configured.invalid'));
  } finally {
    await writeFile(benchmarksPath, original);
    execFileSync(process.execPath, [builder], { cwd: root, env: envWithoutOrigin, stdio: 'pipe' });
  }
});
