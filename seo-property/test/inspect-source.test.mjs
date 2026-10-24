import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('source inspection is scoped to the exact official monthly CSV path', () => {
  const valid = new URL('https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv');
  const isAllowed = (u, month) => u.protocol === 'https:' && u.hostname === 'dados.mj.gov.br' &&
    !u.username && !u.password && !u.search && !u.hash &&
    new RegExp('^/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/[0-9a-f-]{36}/download/basecompleta' + month + '\\.csv$').test(u.pathname);
  assert.equal(isAllowed(valid, '2026-01'), true);
  for (const raw of [
    'http://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv',
    'https://example.com/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv',
    'https://dados.mj.gov.br/dataset/other/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv',
    'https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-02.csv',
    'https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv?mirror=1',
    'https://dados.mj.gov.br.evil.example/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv'
  ]) assert.equal(isAllowed(new URL(raw), '2026-01'), false, raw);
});

test('month argument uses a strict YYYY-MM format', () => {
  for (const month of ['2026-01', '2026-06', '2025-12']) assert.match(month, /^20\d{2}-(0[1-9]|1[0-2])$/);
  for (const month of ['2026-1', '2026-13', '26-01', '2026-00']) assert.doesNotMatch(month, /^20\d{2}-(0[1-9]|1[0-2])$/);
});


test('local CSV inspection records only metadata and header, never row values', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'seo-source-inspector-'));
  const source = join(temp, 'sample.csv');
  const output = join(temp, 'reports');
  const privateFixtureValue = 'PRIVATE_COMPLAINT_TEXT_DO_NOT_STORE';
  await writeFile(source, 'Empresa;Situação;Texto\r\nAcme;Finalizada;' + privateFixtureValue + '\r\n', 'utf8');
  try {
    const script = resolve(import.meta.dirname, '../scripts/inspect-source.mjs');
    const run = spawnSync(process.execPath, [script, '--local-file', source, '2026-01'], {
      encoding: 'utf8',
      env: { ...process.env, SEO_SOURCE_INSPECTION_OUTPUT_DIR: output }
    });
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const reportPath = join(output, 'consumidor-gov-2026-01-header.json');
    const reportText = await readFile(reportPath, 'utf8');
    const report = JSON.parse(reportText);
    assert.deepEqual(report.headers, ['Empresa', 'Situação', 'Texto']);
    assert.equal(report.delimiter, ';');
    assert.equal(report.schemaStatus, 'DISCOVERED_NOT_APPROVED');
    assert.equal(report.downloadedBytes, Buffer.byteLength('Empresa;Situação;Texto\r\nAcme;Finalizada;' + privateFixtureValue + '\r\n'));
    assert.ok(!reportText.includes(privateFixtureValue));
    assert.ok(!run.stdout.includes(privateFixtureValue));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});


test('local inspector rejects invalid month arguments before touching source files', () => {
  const script = resolve(import.meta.dirname, '../scripts/inspect-source.mjs');
  const run = spawnSync(process.execPath, [script, '--local-file', 'does-not-exist.csv', '2026-13'], {
    encoding: 'utf8'
  });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /YYYY-MM/);
});

test('local inspector fails closed on an ambiguous delimiter and writes no report', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'seo-source-ambiguous-'));
  const source = join(temp, 'ambiguous.csv');
  const output = join(temp, 'reports');
  await writeFile(source, 'Empresa;Status,Texto\nAcme;Finalizada,privado\n', 'utf8');
  try {
    const script = resolve(import.meta.dirname, '../scripts/inspect-source.mjs');
    const run = spawnSync(process.execPath, [script, '--local-file', source, '2026-01'], {
      encoding: 'utf8',
      env: { ...process.env, SEO_SOURCE_INSPECTION_OUTPUT_DIR: output }
    });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /delimiter is ambiguous/i);
    await assert.rejects(readFile(join(output, 'consumidor-gov-2026-01-header.json'), 'utf8'), {
      code: 'ENOENT'
    });
    assert.ok(!run.stdout.includes('privado'));
    assert.ok(!run.stderr.includes('privado'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
