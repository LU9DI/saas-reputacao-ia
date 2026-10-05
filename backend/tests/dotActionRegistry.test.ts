import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dotActionRequiresApproval, getDotActionDefinition, isDotActionExecutorRegistered, listDotActionDefinitions } from '../services/dotActionRegistry.js';

test('Dot action registry exposes only declared executors', () => {
  assert.equal(getDotActionDefinition('priorizar_e_resolver')?.executorKey, 'local.priorizar_e_resolver');
  assert.equal(getDotActionDefinition('acao_inexistente'), null);
  assert.equal(listDotActionDefinitions().length, 3);
});

test('Every executable DOT action has a registered executor', () => {
  for (const action of listDotActionDefinitions()) assert.equal(isDotActionExecutorRegistered(action.action), true);
  assert.equal(isDotActionExecutorRegistered('acao_inexistente'), false);
});

test('Dot actions are approval-gated and have no external side effects', () => {
  for (const action of listDotActionDefinitions()) {
    assert.equal(dotActionRequiresApproval(action.action), true);
    assert.equal(action.externalSideEffect, false);
  }
});
