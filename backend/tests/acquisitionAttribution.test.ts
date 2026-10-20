import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeAcquisitionAttribution, summarizeAcquisitionEvents } from '../services/acquisitionAttribution.js';

test('keeps only allowlisted campaign fields and trims values', () => {
  assert.deepEqual(
    sanitizeAcquisitionAttribution({
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
      utm_campaign: 'filtra_48h',
      utm_term: 'private@example.com',
      utm_content: '11999998888',
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

test('summarizes unique consented leads and completed diagnostics without exposing PII', () => {
  const report = summarizeAcquisitionEvents([
    {
      lead_id: 'lead-1',
      event_type: 'consent.granted',
      occurred_at: '2026-10-20T10:00:00.000Z',
      metadata_json: JSON.stringify({
        email: 'private@example.com',
        attribution: { utm_source: 'linkedin', utm_medium: 'organic_social', utm_campaign: 'filtra_48h', utm_content: 'post_a' },
      }),
    },
    {
      lead_id: 'lead-1',
      event_type: 'diagnostic.completed',
      occurred_at: '2026-10-20T10:05:00.000Z',
      metadata_json: JSON.stringify({
        email: 'private@example.com',
        attribution: { utm_source: 'linkedin', utm_medium: 'organic_social', utm_campaign: 'filtra_48h', utm_content: 'post_a' },
      }),
    },
    {
      lead_id: 'lead-1',
      event_type: 'consent.granted',
      occurred_at: '2026-10-20T10:10:00.000Z',
      metadata_json: JSON.stringify({
        attribution: { utm_source: 'linkedin', utm_medium: 'organic_social', utm_campaign: 'filtra_48h', utm_content: 'post_a' },
      }),
    },
    {
      lead_id: 'lead-2',
      event_type: 'consent.granted',
      occurred_at: '2026-10-20T11:00:00.000Z',
      metadata_json: JSON.stringify({ company: 'Empresa B' }),
    },
  ]);

  assert.deepEqual(report.totals, { consented_leads: 2, completed_diagnostics: 1 });
  assert.equal(report.campaigns.length, 2);
  assert.deepEqual(report.campaigns[0], {
    source: 'linkedin',
    medium: 'organic_social',
    campaign: 'filtra_48h',
    content: 'post_a',
    consented_leads: 1,
    completed_diagnostics: 1,
  });
  assert.equal(JSON.stringify(report).includes('private@example.com'), false);
  assert.equal(JSON.stringify(report).includes('Empresa B'), false);
});

test('uses stable first-touch attribution even when events arrive out of order', () => {
  const report = summarizeAcquisitionEvents([
    {
      lead_id: 'lead-first-touch',
      event_type: 'diagnostic.completed',
      occurred_at: '2026-10-20T10:05:00.000Z',
      metadata_json: JSON.stringify({
        attribution: { utm_source: 'later-source', utm_campaign: 'later-campaign' },
      }),
    },
    {
      lead_id: 'lead-first-touch',
      event_type: 'consent.granted',
      occurred_at: '2026-10-20T10:00:00.000Z',
      metadata_json: JSON.stringify({
        attribution: { utm_source: 'first-source', utm_campaign: 'first-campaign' },
      }),
    },
  ]);

  assert.equal(report.campaigns[0].source, 'first-source');
  assert.equal(report.campaigns[0].campaign, 'first-campaign');
  assert.equal(report.campaigns[0].consented_leads, 1);
  assert.equal(report.campaigns[0].completed_diagnostics, 1);
});

test('does not count a diagnostic-only event as a consented campaign lead', () => {
  const report = summarizeAcquisitionEvents([
    {
      lead_id: 'consented-lead',
      event_type: 'consent.granted',
      occurred_at: '2026-10-20T10:00:00.000Z',
      metadata_json: JSON.stringify({
        attribution: { utm_source: 'source-a', utm_campaign: 'campaign-a' },
      }),
    },
    {
      lead_id: 'diagnostic-only-lead',
      event_type: 'diagnostic.completed',
      occurred_at: '2026-10-20T10:05:00.000Z',
      metadata_json: JSON.stringify({
        attribution: { utm_source: 'source-b', utm_campaign: 'campaign-b' },
      }),
    },
  ]);

  assert.deepEqual(report.totals, { consented_leads: 1, completed_diagnostics: 1 });
  const diagnosticOnly = report.campaigns.find((item) => item.source === 'source-b');
  assert.equal(diagnosticOnly?.consented_leads, 0);
  assert.equal(diagnosticOnly?.completed_diagnostics, 1);
});
