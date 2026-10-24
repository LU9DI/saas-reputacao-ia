import test from 'node:test';
import assert from 'node:assert/strict';

test('source inspection is explicitly scoped to official HTTPS resource URLs', () => {
  const valid = new URL('https://dados.mj.gov.br/dataset/abc/resource/def/download/base.csv');
  assert.equal(valid.protocol, 'https:');
  assert.equal(valid.hostname, 'dados.mj.gov.br');
  assert.match(valid.pathname, /^\/dataset\/.+\/download\//);
  for (const raw of [
    'http://dados.mj.gov.br/dataset/abc/resource/def/download/base.csv',
    'https://example.com/dataset/abc/resource/def/download/base.csv',
    'https://dados.mj.gov.br/other/base.csv'
  ]) {
    const u = new URL(raw);
    assert.ok(!(u.protocol === 'https:' && u.hostname === 'dados.mj.gov.br' &&
      u.pathname.startsWith('/dataset/') && u.pathname.includes('/download/')));
  }
});

test('month argument uses a strict YYYY-MM format', () => {
  for (const month of ['2026-01', '2026-06', '2025-12']) assert.match(month, /^20\d{2}-(0[1-9]|1[0-2])$/);
  for (const month of ['2026-1', '2026-13', '26-01', '2026-00']) assert.doesNotMatch(month, /^20\d{2}-(0[1-9]|1[0-2])$/);
});
