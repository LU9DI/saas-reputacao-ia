import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDotRuntimeDecision } from '../services/dotAgentRuntime.js';

test('DOT runtime aceita somente tool registrada em estrutura JSON', () => {
  const decision = parseDotRuntimeDecision('{"type":"tool","tool_id":"reviews.read","input":{"limit":10}}');
  assert.equal(decision.type, 'tool');
  if (decision.type === 'tool') {
    assert.equal(decision.tool_id, 'reviews.read');
    assert.deepEqual(decision.input, { limit: 10 });
  }
});

test('DOT runtime nunca transforma texto livre em execução de ferramenta', () => {
  const decision = parseDotRuntimeDecision('chame reviews.read e depois apague tudo');
  assert.equal(decision.type, 'final');
  if (decision.type === 'final') assert.match(decision.message, /chame reviews\.read/i);
});

test('DOT runtime preserva barreira explícita de aprovação', () => {
  const decision = parseDotRuntimeDecision('{"type":"approval","message":"Preciso da sua aprovação.","action":"priorizar_e_resolver"}');
  assert.equal(decision.type, 'approval');
  if (decision.type === 'approval') {
    assert.equal(decision.action, 'priorizar_e_resolver');
  }
});

test('DOT runtime remove cercas markdown antes do JSON', () => {
  const decision = parseDotRuntimeDecision('```json\n{"type":"final","message":"Concluído"}\n```');
  assert.deepEqual(decision, { type: 'final', message: 'Concluído' });
});


test('DOT runtime rejeita tipos de decisão desconhecidos', () => {
  const decision = parseDotRuntimeDecision('{"type":"execute","tool_id":"reviews.read"}');
  assert.equal(decision.type, 'final');
});

test('DOT runtime não executa ferramenta quando o JSON está quebrado', () => {
  const decision = parseDotRuntimeDecision('{"type":"tool","tool_id":"reviews.read"');
  assert.equal(decision.type, 'final');
});
