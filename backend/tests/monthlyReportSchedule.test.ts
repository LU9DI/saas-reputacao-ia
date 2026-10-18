import test from 'node:test';
import assert from 'node:assert/strict';
import { subscriptionReportDue } from '../routes/monthlyReportJobsRoutes.js';

test('monthly report runs on the subscription anniversary day', () => {
  assert.equal(subscriptionReportDue(18, new Date('2026-10-18T12:00:00.000Z')), true);
  assert.equal(subscriptionReportDue(18, new Date('2026-10-17T12:00:00.000Z')), false);
});

test('anniversary on day 31 falls back to the last day of shorter months', () => {
  assert.equal(subscriptionReportDue(31, new Date('2026-02-28T12:00:00.000Z')), true);
  assert.equal(subscriptionReportDue(31, new Date('2026-02-27T12:00:00.000Z')), false);
  assert.equal(subscriptionReportDue(31, new Date('2026-03-31T12:00:00.000Z')), true);
});

test('invalid subscription days never trigger scheduled reports', () => {
  const now = new Date('2026-10-18T12:00:00.000Z');
  for (const day of [null, undefined, 0, -1, 32, 'invalid']) {
    assert.equal(subscriptionReportDue(day, now), false);
  }
});
