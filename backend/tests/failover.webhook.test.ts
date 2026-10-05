import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  classifySpendEvent,
  shouldFailoverForStatus,
  shouldRespectCooldown,
} from '../../frontend/src/lib/failoverCore.ts';

test('Vercel HMAC-SHA1 signature is deterministic', () => {
  const body = '{"thresholdPercent":100}';
  const secret = 'secret';
  const sig = crypto.createHmac('sha1', secret).update(body).digest('hex');
  assert.equal(sig.length, 40);
  assert.equal(sig, crypto.createHmac('sha1', secret).update(body).digest('hex'));
  assert.notEqual(sig, crypto.createHmac('sha1', 'wrong').update(body).digest('hex'));
});

test('50 and 75 are observation thresholds', () => {
  assert.equal(classifySpendEvent({ thresholdPercent: 50 }), 'observe');
  assert.equal(classifySpendEvent({ thresholdPercent: 75 }), 'observe');
});

test('90 and 100 trigger failover', () => {
  assert.equal(classifySpendEvent({ thresholdPercent: 90 }), 'failover');
  assert.equal(classifySpendEvent({ thresholdPercent: 100 }), 'failover');
});

test('retryable origin statuses trigger failover', () => {
  for (const status of [502, 503, 504, 521, 522, 523, 524]) {
    assert.equal(shouldFailoverForStatus(status), true);
  }
  assert.equal(shouldFailoverForStatus(200), false);
});

test('cooldown is respected', () => {
  const now = 1_000_000;
  assert.equal(shouldRespectCooldown(now - 60_000, now, 300_000), true);
  assert.equal(shouldRespectCooldown(now - 301_000, now, 300_000), false);
});
