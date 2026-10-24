import test from 'node:test';
import assert from 'node:assert/strict';
import { extractOfficialMonthlyResources, isOfficialMonthlyCsvUrl } from '../scripts/source-catalog.mjs';

const officialUrl = 'https://dados.mj.gov.br/dataset/0182f1bf-e73d-42b1-ae8c-fa94d9ce9451/resource/786a616a-b4fc-4cc0-a09b-098aa06883ba/download/basecompleta2026-01.csv';

test('official monthly CSV URL requires exact HTTPS host, dataset, UUID and month', () => {
  assert.equal(isOfficialMonthlyCsvUrl(officialUrl, '2026-01'), true);
  for (const [url, month] of [
    [officialUrl.replace('https:', 'http:'), '2026-01'],
    [officialUrl.replace('dados.mj.gov.br', 'dados.mj.gov.br.example.com'), '2026-01'],
    [officialUrl.replace('786a616a-b4fc-4cc0-a09b-098aa06883ba', '------------------------------------'), '2026-01'],
    [officialUrl.replace('basecompleta2026-01.csv', 'basecompleta2026-02.csv'), '2026-01'],
    [officialUrl + '?mirror=1', '2026-01'],
    [officialUrl, '2026-13']
  ]) assert.equal(isOfficialMonthlyCsvUrl(url, month), false, url);
});

test('catalog extraction returns only valid official monthly CSV metadata, sorted by month', () => {
  const payload = {
    success: true,
    result: {
      name: 'reclamacoes-do-consumidor-gov-br',
      resources: [
        { name: 'basecompleta2026-02.csv', url: officialUrl.replace('2026-01', '2026-02'), format: 'CSV', size: '1234', last_modified: '2026-03-01' },
        { name: 'basecompleta2026-01.csv', url: officialUrl, format: 'CSV', size: 1000 },
        { name: 'basecompleta2026-03.csv', url: 'https://example.com/basecompleta2026-03.csv', format: 'CSV' },
        { name: 'other-file.csv', url: officialUrl, format: 'CSV' }
      ]
    }
  };
  const resources = extractOfficialMonthlyResources(payload);
  assert.deepEqual(resources.map(r => r.referenceMonth), ['2026-01', '2026-02']);
  assert.equal(resources[0].url, officialUrl);
  assert.equal(resources[1].size, 1234);
  assert.equal(resources[1].lastModified, '2026-03-01');
  assert.ok(resources.every(r => !Object.hasOwn(r, 'description')));
});

test('catalog extraction fails closed on unexpected catalog response shape', () => {
  assert.throws(() => extractOfficialMonthlyResources({ success: false, result: {} }), /failed validation/);
  assert.throws(() => extractOfficialMonthlyResources({
    success: true,
    result: { name: 'different-dataset', resources: [] }
  }), /failed validation/);
});
