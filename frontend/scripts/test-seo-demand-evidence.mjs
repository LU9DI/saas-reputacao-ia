import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'filtra-demand-evidence-'));
try {
  const input = path.join(temp, 'gsc.csv');
  await writeFile(input, [
    'Top queries,Clicks,Impressions,CTR,Position',
    '"gestão de reputação",12,240,5%,4.2',
    '"gestao de reputação",3,60,5%,6.2',
    '"consulta sem impressões",0,0,0%,0',
    '"consulta, com vírgula",1,10,10%,8.0',
    '"linha inválida",oops,12,1%,5.0',
  ].join('\n') + '\n');
  execFileSync(process.execPath, [
    path.join(frontend, 'scripts/import-seo-demand-evidence.mjs'),
    '--input', input, '--site', 'https://example.test/', '--start-date', '2026-09-01',
    '--end-date', '2026-09-30', '--out', temp,
  ], { cwd: frontend, stdio: 'pipe' });
  const report = JSON.parse(await readFile(path.join(temp, 'demand-evidence.json'), 'utf8'));
  assert.equal(report.counts.inputRows, 5);
  assert.equal(report.counts.validUniqueQueries, 3);
  assert.equal(report.counts.rejectedRows, 1);
  assert.equal(report.counts.publishAllowed, 0);
  assert.ok(report.evidence.every((item) => item.publishAllowed === false));
  const merged = report.evidence.find((item) => item.normalizedQuery === 'gestao de reputacao');
  assert.equal(merged.metrics.clicks, 15);
  assert.equal(merged.metrics.impressions, 300);
  assert.equal(merged.metrics.ctrPercent, 5);
  assert.equal(merged.metrics.averagePosition, 4.6);
  assert.ok(report.evidence.some((item) => item.query === 'consulta, com vírgula'));
  assert.ok(report.evidence.some((item) => item.flags.includes('no-impression-evidence')));

  // Portuguese locale export: semicolon delimiter and decimal comma metrics.
  const localizedInput = path.join(temp, 'gsc-pt.csv');
  await writeFile(localizedInput, [
    'Principais consultas;Cliques;Impressões;CTR;Posição',
    '"reputação empresarial";2;40;5,00%;7,50',
  ].join('\n') + '\n');
  const localizedOut = path.join(temp, 'localized-output');
  execFileSync(process.execPath, [
    path.join(frontend, 'scripts/import-seo-demand-evidence.mjs'),
    '--input', localizedInput, '--site', 'https://example.test/',
    '--start-date', '2026-09-01', '--end-date', '2026-09-30', '--out', localizedOut,
  ], { cwd: frontend, stdio: 'pipe' });
  const localized = JSON.parse(await readFile(path.join(localizedOut, 'demand-evidence.json'), 'utf8'));
  assert.equal(localized.counts.validUniqueQueries, 1);
  assert.equal(localized.evidence[0].metrics.ctrPercent, 5);
  assert.equal(localized.evidence[0].metrics.averagePosition, 7.5);
  assert.equal(localized.evidence[0].metrics.clicks, 2);
  console.log('SEO demand evidence import tests passed: provenance retained, duplicates aggregated, localized CSV parsed, publication always blocked.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
