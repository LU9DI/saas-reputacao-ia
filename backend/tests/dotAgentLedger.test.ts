import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDotActionIdempotencyKey } from '../services/dotAgentLedger.js';

test('ledger: mesma ação produz chave idempotente estável', () => {
  const input = {
    empresaId: 'empresa-1',
    actionType: 'reviews.reply',
    targetKey: 'review-42',
    planId: 'plan-7',
    fingerprint: 'signal:42',
  };
  assert.equal(buildDotActionIdempotencyKey(input), buildDotActionIdempotencyKey(input));
});

test('ledger: mudanças de alvo não colidem', () => {
  const base = {
    empresaId: 'empresa-1',
    actionType: 'reviews.reply',
    targetKey: 'review-42',
    planId: 'plan-7',
    fingerprint: 'signal:42',
  };
  const other = { ...base, targetKey: 'review-43' };
  assert.notEqual(buildDotActionIdempotencyKey(base), buildDotActionIdempotencyKey(other));
});
