import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-seo-qualification-'));
try {
  const evidencePath = path.join(temp, 'evidence.json');
  const candidatesPath = path.join(temp, 'opportunities.json');
  const mappingsPath = path.join(temp, 'mappings.json');
  const outputPath = path.join(temp, 'out');
  await writeFile(evidencePath, JSON.stringify({
    evidence: [
      { evidenceId: 'e1', query: 'Gestão de reputação', normalizedQuery: 'gestao de reputacao', siteUrl: 'https://filtraai.com/', dateRange: { startDate: '2026-09-01', endDate: '2026-09-30' }, metrics: { clicks: 4, impressions: 100, ctrPercent: 4, averagePosition: 8 }, source: 'GSC CSV', exactCandidateMatchIds: ['candidate-1'], flags: [] },
      { evidenceId: 'e2', query: 'como responder avaliações', normalizedQuery: 'como responder avaliacoes', metrics: { clicks: 0, impressions: 0, ctrPercent: 0, averagePosition: null }, exactCandidateMatchIds: [], flags: ['no-impression-evidence'] },
      { evidenceId: 'e3', query: 'marca com mapeamento conflitante', normalizedQuery: 'marca com mapeamento conflitante', metrics: { clicks: 1, impressions: 2, ctrPercent: 50, averagePosition: 1 }, exactCandidateMatchIds: [], flags: [] }
    ]
  }));
  await writeFile(candidatesPath, JSON.stringify({ candidates: [{ id: 'candidate-1' }] }));
  await writeFile(mappingsPath, JSON.stringify({ mappings: [
    { normalizedQuery: 'GESTAO DE REPUTACAO', targetType: 'existing-page', targetUrl: 'https://filtraai.com/reputacao/', reviewedBy: 'reviewer', reviewedAt: '2026-10-23', rationale: 'A URL existente já atende à intenção.' },
    { normalizedQuery: 'marca com mapeamento conflitante', targetType: 'candidate', candidateId: 'candidate-1', reviewedBy: 'reviewer', reviewedAt: '2026-10-23', rationale: 'Avaliar aderência comercial.' },
    { normalizedQuery: 'marca com mapeamento conflitante', targetType: 'candidate', candidateId: 'candidate-1', reviewedBy: 'reviewer', reviewedAt: '2026-10-23', rationale: 'Mapeamento duplicado intencional para testar bloqueio.' },
    { normalizedQuery: 'target desconhecido', targetType: 'candidate', candidateId: 'missing-id', reviewedBy: 'reviewer', reviewedAt: '2026-10-23', rationale: 'Must be rejected.' }
  ] }));
  execFileSync(process.execPath, [
    path.join(frontend, 'scripts/build-seo-qualification-queue.mjs'),
    '--evidence', evidencePath, '--candidates', candidatesPath, '--mappings', mappingsPath, '--out', outputPath,
  ], { cwd: frontend, stdio: 'pipe' });
  const report = JSON.parse(await readFile(path.join(outputPath, 'qualification-queue.json'), 'utf8'));
  assert.equal(report.counts.evidenceItems, 3);
  assert.equal(report.counts.optimizeExistingPageReview, 1);
  assert.equal(report.counts.evaluateNewCandidateReview, 0);
  assert.equal(report.counts.manualMappingRequired, 1);
  assert.equal(report.counts.conflictingMappingsBlocked, 1);
  assert.equal(report.counts.invalidMappings, 1);
  assert.equal(report.counts.publishAllowed, 0);
  assert.equal(report.policy.semanticMatchingEnabled, false);
  assert.ok(report.queue.every((item) => item.publishAllowed === false));
  const existing = report.queue.find((item) => item.evidenceId === 'e1');
  assert.equal(existing.action, 'optimize-existing-page-review');
  assert.equal(existing.target.url, 'https://filtraai.com/reputacao/');
  const conflict = report.queue.find((item) => item.evidenceId === 'e3');
  assert.ok(conflict.reasons.includes('multiple-reviewed-mappings-match-evidence'));
  const unmapped = report.queue.find((item) => item.evidenceId === 'e2');
  assert.equal(unmapped.action, 'manual-mapping-required');
  assert.ok(unmapped.reasons.includes('insufficient-impression-evidence'));
  console.log('SEO qualification queue tests passed: explicit mappings only, conflicts blocked, publication disabled.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
