import assert from 'node:assert/strict';
import test from 'node:test';
import { processAcquisitionBatch } from '../routes/acquisitionRoutes.js';

test('outreach stays disabled without explicit opt-in and never touches the queue or mailer', async () => {
  const previous = process.env.ACQUISITION_OUTREACH_ENABLED;
  const previousDailyLimit = process.env.ACQUISITION_DAILY_LIMIT;

  try {
    delete process.env.ACQUISITION_OUTREACH_ENABLED;
    process.env.ACQUISITION_DAILY_LIMIT = '80';

    const result = await processAcquisitionBatch({ limit: 80, source: 'test' });

    assert.deepEqual(result, {
      enabled: false,
      reason: 'ACQUISITION_OUTREACH_ENABLED is not true',
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      daily_limit: 80,
      sent_today: 0,
    });
  } finally {
    if (previous === undefined) delete process.env.ACQUISITION_OUTREACH_ENABLED;
    else process.env.ACQUISITION_OUTREACH_ENABLED = previous;
    if (previousDailyLimit === undefined) delete process.env.ACQUISITION_DAILY_LIMIT;
    else process.env.ACQUISITION_DAILY_LIMIT = previousDailyLimit;
  }
});
