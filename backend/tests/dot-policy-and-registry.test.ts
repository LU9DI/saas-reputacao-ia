import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDotPolicy } from '../services/dotPolicy.js';
import { dotActionRequiresApproval, getDotActionDefinition, isDotActionAllowed } from '../services/dotActionRegistry.js';

test('DOT policy never auto-executes an action', () => {
  for (const autonomy of ['observador', 'assistente', 'proativo', 'autonomo_controlado'] as const) {
    const result = evaluateDotPolicy({
      autonomy,
      checkIntervalMinutes: 60,
      dailySummary: true,
      immediateAlerts: true,
      alertOnRatingDrop: true,
      ratingFloor: 4.5,
      alertOnCriticalTheme: true,
      prepareActionsAutomatically: true,
      requireApprovalForExternalActions: true,
    }, 'high');

    assert.equal(result.executeAutomatically, false);
    assert.equal(result.requiresApproval, true);
  }
});

test('DOT registry keeps all current actions behind explicit approval', () => {
  for (const action of ['priorizar_e_resolver', 'escalar_responsavel', 'corrigir_e_acompanhar']) {
    const definition = getDotActionDefinition(action);
    assert.ok(definition);
    assert.equal(dotActionRequiresApproval(action), true);
    assert.equal(definition.externalSideEffect, false);
    assert.ok(definition.allowedAutonomy.includes('assistente'));
    assert.ok(isDotActionAllowed(action, definition.allowedAutonomy[0]!));
  }
});

test('DOT registry rejects unknown actions', () => {
  assert.equal(getDotActionDefinition('enviar_whatsapp_sem_aprovacao'), null);
  assert.equal(dotActionRequiresApproval('enviar_whatsapp_sem_aprovacao'), true);
});
