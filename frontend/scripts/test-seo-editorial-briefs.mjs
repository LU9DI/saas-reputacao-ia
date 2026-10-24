import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-seo-briefs-'));
try {
  const queuePath = path.join(temp, 'queue.json');
  const candidatesPath = path.join(temp, 'opportunities.json');
  const out = path.join(temp, 'out');
  await writeFile(queuePath, JSON.stringify({ queue: [
    { evidenceId: 'e1', query: 'como melhorar reputacao', source: 'GSC CSV', siteUrl: 'https://filtraai.com/', metrics: { clicks: 3, impressions: 40, averagePosition: 7 }, exactCandidateMatchIds: [], action: 'evaluate-new-candidate-review', target: { candidateId: 'candidate-1' }, publishAllowed: false },
    { evidenceId: 'e2', query: 'sem destino', metrics: { clicks: 0, impressions: 0 }, action: 'manual-mapping-required', target: null, publishAllowed: false },
    { evidenceId: 'e3', query: 'candidate missing', metrics: { clicks: 1, impressions: 10 }, action: 'evaluate-new-candidate-review', target: { candidateId: 'missing' }, publishAllowed: false },
  ] }));
  await writeFile(candidatesPath, JSON.stringify({ candidates: [{ id: 'candidate-1', sectorId: 'clinicas', sector: 'clínicas', intentId: 'how-to', intent: 'como fazer', formatId: 'guide', format: 'guia', productFit: 'conditional', queryHypothesis: 'como melhorar reputacao para clínicas', suggestedPath: '/seo-candidatos/clinicas-how-to-guide', flags: ['verify-product-fit'] }] }));
  execFileSync(process.execPath, [path.join(frontend, 'scripts/build-seo-editorial-briefs.mjs'), '--queue', queuePath, '--candidates', candidatesPath, '--out', out], { cwd: frontend });
  const report = JSON.parse(await readFile(path.join(out, 'editorial-briefs.json'), 'utf8'));
  assert.equal(report.counts.briefs, 1);
  assert.equal(report.counts.blocked, 1);
  assert.equal(report.counts.publishAllowed, 0);
  assert.equal(report.briefs[0].evidence.metrics.impressions, 40);
  assert.equal(report.briefs[0].candidate.id, 'candidate-1');
  assert.equal(report.briefs[0].requiredGates.length, 8);
  assert.ok(report.briefs[0].requiredGates.every((gate) => gate.passed === false));
  assert.equal(report.briefs[0].publishAllowed, false);
  assert.ok(report.blocked.some((item) => item.reason === 'candidate-not-found-in-backlog'));
  console.log('SEO editorial brief tests passed: evidence preserved, unknown candidates blocked, all publication gates closed.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
