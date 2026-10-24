import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
test('keeps opportunity inventory separate from indexable data-backed pages', async () => {
 execFileSync(process.execPath,[resolve(root,'scripts/build.mjs')],{cwd:root,stdio:'pipe'});
 const data=JSON.parse(await readFile(resolve(root,'dist/inventory.json'),'utf8'));
 const sitemap=await readFile(resolve(root,'dist/sitemap.xml'),'utf8');
 assert.equal(data.candidateCount,500);
 assert.equal(new Set(data.candidates.map(p=>p.path)).size,500);
 assert.equal(data.eligiblePageCount,0);
 assert.equal(data.eligiblePages.length,0);
 assert.equal(sitemap.includes('<sitemap>'),false);
 assert.equal(data.minBusinesses,20);
 assert.equal(data.minReviews,100);
});
