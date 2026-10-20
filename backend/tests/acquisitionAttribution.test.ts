import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeAcquisitionAttribution } from '../services/acquisitionAttribution.js';

test('keeps only allowlisted campaign fields and trims values', () => {
  assert.deepEqual(
    sanitizeAcquisitionAttribution({
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
      utm_campaign: 'filtra_48h',
      email: 'private@example.com',
      arbitrary: 'discard-me',
    }),
    {
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
      utm_campaign: 'filtra_48h',
    },
  );
});

test('rejects malformed input and non-string values', () => {
  assert.deepEqual(sanitizeAcquisitionAttribution(null), {});
  assert.deepEqual(sanitizeAcquisitionAttribution('utm_source=spam'), {});
  assert.deepEqual(sanitizeAcquisitionAttribution({ utm_source: 123, utm_campaign: ['x'] }), {});
});

test('removes control characters and caps field lengths', () => {
  const result = sanitizeAcquisitionAttribution({
    utm_source: '  link\n\u0000edin  ',
    utm_campaign: 'c'.repeat(500),
    referrer_origin: 'https://example.com/some/private/path?token=secret',
  });
  assert.equal(result.utm_source, 'linkedin');
  assert.equal(result.utm_campaign?.length, 120);
  assert.equal(result.referrer_origin, 'https://example.com');
});
