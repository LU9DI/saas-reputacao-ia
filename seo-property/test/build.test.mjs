import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
test('creates 500 unique draft candidates and only indexes explicitly approved URLs', async () => {
 execFileSync(process.execPath,[resolve(root,'scripts/build.mjs')],{cwd:root,stdio:'pipe'});
 const data=JSON.parse(await readFile(resolve(root,'dist/inventory.json'),'utf8'));
 const sitemap=await readFile(resolve(root,'dist/sitemap.xml'),'utf8');
 assert.equal(data.sectorCount,50); assert.equal(data.intentCount,10); assert.equal(data.candidateCount,500);
 assert.equal(new Set(data.pages.map(p=>p.path)).size,500); assert.equal(data.approvedCount,0); assert.equal(data.draftCount,500);
 assert.equal(sitemap.includes('<url>'),false); assert.ok(data.pages.every(p=>!p.indexable&&p.status==='draft'));
});
