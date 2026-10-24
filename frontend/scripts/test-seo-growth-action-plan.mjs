import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-seo-growth-plan-'));
try {
  const evidencePath = path.join(temp, 'evidence.json');
  const queuePath = path.join(temp, 'queue.json');
  const out = path.join(temp, 'out');
  await writeFile(evidencePath, JSON.stringify({
    provenance: { source: 'GSC CSV', siteUrl: 'https://filtraai.com/', dateRange: { startDate: '2026-09-01', endDate: '2026-09-30' } },
    evidence: [
      { evidenceId: 'e1', query: 'gestao reputacao', source: 'GSC CSV', siteUrl: 'https://filtraai.com/', dateRange: { startDate: '2026-09-01', endDate: '2026-09-30' }, metrics: { clicks: 0, impressions: 100, ctrPercent: 0, averagePosition: 8 } },
      { evidenceId: 'e2', query: 'reputacao clinicas', source: 'GSC CSV', metrics: { clicks: 1, impressions: 30, ctrPercent: 3.333, averagePosition: 42 } },
      { evidenceId: 'e3', query: 'nova consulta', metrics: { clicks: 0, impressions: 2, ctrPercent: 0, averagePosition: 66 } },
      { evidenceId: 'e4', query: 'mapeamento manual', metrics: { clicks: 2, impressions: 20, ctrPercent: 10, averagePosition: 15 } },
    ],
  }));
  await writeFile(queuePath, JSON.stringify({ queue: [
    { evidenceId: 'e4', action: 'optimize-existing-page-review', target: { type: 'existing-page', url: 'https://filtraai.com/gestao-de-reputacao-online', reviewedBy: 'reviewer' } },
  ] }));
  execFileSync(process.execPath, [path.join(frontend, 'scripts/build-seo-growth-action-plan.mjs'), '--evidence', evidencePath, '--queue', queuePath, '--out', out], { cwd: frontend });
  const report = JSON.parse(await readFile(path.join(out, 'growth-action-plan.json'), 'utf8'));
  assert.equal(report.counts.evidenceItems, 4);
  assert.equal(report.counts.actions, 4);
  assert.equal(report.counts.publishAllowed, 0);
  assert.equal(report.actions.find((x) => x.evidenceId === 'e1').type, 'high-visibility-low-ctr-review');
  assert.equal(report.actions.find((x) => x.evidenceId === 'e2').type, 'relevance-and-authority-review');
  assert.equal(report.actions.find((x) => x.evidenceId === 'e4').type, 'optimize-mapped-existing-page');
  assert.equal(report.actions.find((x) => x.evidenceId === 'e3').type, 'map-and-validate-query');
  assert.ok(report.actions.every((x) => x.publishAllowed === false));
  console.log('SEO growth action plan tests passed: priority rules, explicit mappings, and publication guard verified.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
