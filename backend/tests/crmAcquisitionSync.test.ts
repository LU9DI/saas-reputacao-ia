import assert from 'node:assert/strict';
import test from 'node:test';
import { syncConsentedAcquisitionLead } from '../services/crmAcquisitionSync.js';

test('external CRM and marketing sync stays disabled without explicit opt-in', async () => {
  const keys = ['ACQUISITION_CRM_SYNC_ENABLED', 'HUBSPOT_SERVICE_KEY', 'BREVO_API_KEY'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  try {
    delete process.env.ACQUISITION_CRM_SYNC_ENABLED;
    process.env.HUBSPOT_SERVICE_KEY = 'test-hubspot-key';
    process.env.BREVO_API_KEY = 'test-brevo-key';
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      throw new Error('Network must not be called while sync is disabled');
    }) as typeof fetch;

    const result = await syncConsentedAcquisitionLead({ email: 'test@example.com', company: 'Example' });

    assert.equal(result.ok, true);
    assert.equal(fetchCalls, 0);
    assert.deepEqual(result.results, {
      hubspot: { enabled: false, reason: 'ACQUISITION_CRM_SYNC_ENABLED is not true' },
      brevo: { enabled: false, reason: 'ACQUISITION_CRM_SYNC_ENABLED is not true' },
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
