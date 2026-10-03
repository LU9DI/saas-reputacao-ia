import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dotActionRequiresApproval, getDotActionDefinition, listDotActionDefinitions } from '../services/dotActionRegistry.js';

test('Dot action registry exposes only declared executors', () => {
  assert.equal(getDotActionDefinition('priorizar_e_resolver')?.executorKey, 'local.priorizar_e_resolver');
  assert.equal(getDotActionDefinition('acao_inexistente'), null);
  assert.equal(listDotActionDefinitions().length, 3);
});

test('Dot actions are approval-gated by default', () => {
  for (const action of listDotActionDefinitions()) {
    assert.equal(dotActionRequiresApproval(action.action), true);
    assert.equal(action.externalSideEffect, false);
  }
});
