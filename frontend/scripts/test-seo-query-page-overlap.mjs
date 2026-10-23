import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-query-page-overlap-'));
try {
  const input = path.join(temp, 'query-page.csv');
  await writeFile(input, [
    'Top queries,Top pages,Clicks,Impressions,CTR,Position',
    '"gestão de reputação","https://filtraai.com/gestao-de-reputacao-online",10,200,5%,3.2',
    '"gestao de reputação","https://filtraai.com/blog/gestao-reputacao-online-guia",4,100,4%,5.2',
    '"auditoria gratuita","https://filtraai.com/auditoria-gratuita",2,40,5%,7.0',
    '"consulta externa","https://other.example/page",1,20,5%,8.0',
    '"linha inválida","https://filtraai.com/",oops,12,1%,5.0',
  ].join('\n') + '\n');
  execFileSync(process.execPath, [
    path.join(frontend, 'scripts/analyze-seo-query-page-overlap.mjs'),
    '--input', input, '--site', 'https://filtraai.com/', '--start-date', '2026-09-01',
    '--end-date', '2026-09-30', '--out', temp,
  ], { cwd: frontend, stdio: 'pipe' });
  const report = JSON.parse(await readFile(path.join(temp, 'query-page-overlap.json'), 'utf8'));
  assert.equal(report.counts.queries, 3);
  assert.equal(report.counts.potentialOverlapQueries, 1);
  assert.equal(report.counts.rejectedRows, 1);
  assert.equal(report.counts.publishAllowed, 0);
  const overlap = report.evidence.find((item) => item.normalizedQuery === 'gestao de reputacao');
  assert.equal(overlap.classification, 'potential-query-page-overlap-review');
  assert.equal(overlap.eligiblePageCount, 2);
  assert.equal(overlap.totalImpressions, 300);
  assert.equal(overlap.pages[0].url, 'https://filtraai.com/gestao-de-reputacao-online');
  assert.equal(overlap.pages[0].averagePosition, 3.2);
  const external = report.evidence.find((item) => item.normalizedQuery === 'consulta externa');
  assert.equal(external.eligiblePageCount, 0);
  assert.ok(external.pages[0].flags.includes('page-origin-does-not-match-site-property'));
  assert.ok(report.evidence.every((item) => item.publishAllowed === false));
  console.log('SEO query-page overlap tests passed: duplicate query URLs flagged for review, off-property URLs excluded, invalid rows rejected, publication blocked.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
