import test from 'node:test';
import assert from 'node:assert/strict';
import { ate, emUF, deUF, rotuloSegmento } from '../../src/lib/rotulos.ts';

test('ate escolhe o primeiro candidato que cabe, senão o último', () => {
  assert.equal(ate(10, 'muito longo mesmo', 'curto'), 'curto');
  assert.equal(ate(10, 'cabe', 'outro'), 'cabe');
  assert.equal(ate(3, 'aaaa', 'bbbb'), 'bbbb');
});

test('artigo dos estados em "em" e "de"', () => {
  assert.equal(emUF('RJ', 'Rio de Janeiro'), 'no Rio de Janeiro');
  assert.equal(emUF('BA', 'Bahia'), 'na Bahia');
  assert.equal(emUF('SP', 'São Paulo'), 'em São Paulo');
  assert.equal(emUF('MS', 'Mato Grosso do Sul'), 'no Mato Grosso do Sul');
  assert.equal(deUF('RJ', 'Rio de Janeiro'), 'do Rio de Janeiro');
  assert.equal(deUF('PB', 'Paraíba'), 'da Paraíba');
  assert.equal(deUF('SE', 'Sergipe'), 'de Sergipe');
});

test('rótulo curto do segmento tem fallback', () => {
  assert.equal(rotuloSegmento('farmacias', 'x'), 'farmácias');
  assert.equal(rotuloSegmento('inexistente', 'fallback'), 'fallback');
});
