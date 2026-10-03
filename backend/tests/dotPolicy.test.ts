import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_DOT_PREFERENCES } from '../services/dotPreferences.js';
import { evaluateDotPolicy } from '../services/dotPolicy.js';

test('Dot policy: observador does not prepare actions automatically', () => {
  const policy = evaluateDotPolicy(
    { ...DEFAULT_DOT_PREFERENCES, autonomy: 'observador', prepareActionsAutomatically: true },
    'medium',
  );
  assert.equal(policy.observe, true);
  assert.equal(policy.createDecision, true);
  assert.equal(policy.prepareAction, false);
  assert.equal(policy.requiresApproval, true);
});

test('Dot policy: proativo can prepare the first safe option but not execute it', () => {
  const policy = evaluateDotPolicy(
    { ...DEFAULT_DOT_PREFERENCES, autonomy: 'proativo', prepareActionsAutomatically: true },
    'critical',
  );
  assert.equal(policy.prepareAction, true);
  assert.equal(policy.executeAutomatically, false);
  assert.equal(policy.requiresApproval, true);
});

test('Dot policy: external approval remains mandatory by default', () => {
  const policy = evaluateDotPolicy(
    { ...DEFAULT_DOT_PREFERENCES, autonomy: 'autonomo_controlado', requireApprovalForExternalActions: true },
    'low',
  );
  assert.equal(policy.executeAutomatically, false);
  assert.equal(policy.requiresApproval, true);
});
