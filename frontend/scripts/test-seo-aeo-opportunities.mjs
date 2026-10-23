import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-seo-aeo-'));
try {
  execFileSync(process.execPath, [
    path.join(frontend, 'scripts/build-seo-aeo-opportunities.mjs'),
    '--out',
    temp,
  ], { cwd: frontend, stdio: 'pipe' });

  const report = JSON.parse(await readFile(path.join(temp, 'opportunities.json'), 'utf8'));
  const taxonomy = JSON.parse(await readFile(path.join(frontend, 'data/seo-aeo-opportunity-taxonomy.json'), 'utf8'));
  const expected = taxonomy.sectors.length * taxonomy.intents.length * taxonomy.formats.length;

  assert.equal(report.counts.candidates, expected, 'candidate count must match the taxonomy cartesian product');
  assert.equal(report.counts.uniqueSlugs, expected, 'candidate IDs must be unique');
  assert.equal(report.counts.publishAllowed, 0, 'candidate generation must never authorize publication');
  assert.ok(report.candidates.every((item) => item.status === 'candidate-only'), 'all generated records must remain candidates');
  assert.ok(report.candidates.every((item) => item.demandEvidence === null), 'demand must not be fabricated');
  assert.ok(report.candidates.every((item) => item.publishAllowed === false), 'no candidate may be publishable by default');
  assert.ok(report.candidates.some((item) => item.formatId === 'benchmark' && item.flags.includes('dataset-required')));
  assert.ok(report.candidates.some((item) => item.formatId === 'tool' && item.flags.includes('working-tool-required')));

  // Every member of a normalized duplicate-label group must be flagged, including
  // the first occurrence (not just later entries encountered by the generator).
  for (const group of report.duplicateSectorLabelGroups) {
    for (const sectorId of group.ids) {
      const sectorCandidates = report.candidates.filter((item) => item.sectorId === sectorId);
      assert.ok(sectorCandidates.length > 0, `duplicate sector ${sectorId} must have candidates`);
      assert.ok(
        sectorCandidates.every((item) => item.flags.includes('duplicate-sector-label')),
        `all candidates for duplicate sector ${sectorId} must be flagged`,
      );
    }
  }

  assert.ok(
    report.candidates.filter((item) => item.productFit === 'adjacent')
      .every((item) => item.flags.includes('verify-commercial-relevance')),
    'adjacent intents must be flagged for commercial relevance review',
  );
  assert.ok(
    report.candidates.filter((item) => item.productFit === 'conditional')
      .every((item) => item.flags.includes('verify-product-fit')),
    'conditional intents must be flagged for product-fit review',
  );
  console.log(`SEO/AEO opportunity generator tests passed: ${expected} candidates; 0 authorized for publication.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
