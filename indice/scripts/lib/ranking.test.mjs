import test from 'node:test';
import assert from 'node:assert/strict';
import { posicionar } from '../../src/lib/ranking-core.ts';

const por = (ls) => posicionar(ls, (x) => x.v, (x) => x.nome);

test('ordena do maior para o menor', () => {
  const r = por([{ nome: 'B', v: 5 }, { nome: 'A', v: 9 }, { nome: 'C', v: 1 }]);
  assert.deepEqual(r.map((x) => [x.nome, x.pos]), [['A', 1], ['B', 2], ['C', 3]]);
});

test('empates dividem a posição e a seguinte pula (1, 2, 2, 4)', () => {
  const r = por([{ nome: 'D', v: 1 }, { nome: 'B', v: 5 }, { nome: 'A', v: 9 }, { nome: 'C', v: 5 }]);
  assert.deepEqual(r.map((x) => [x.nome, x.pos]), [['A', 1], ['B', 2], ['C', 2], ['D', 4]]);
});

test('desempate alfabético com acentos (pt-BR) e entrada não é alterada', () => {
  const entrada = [{ nome: 'Éden', v: 3 }, { nome: 'Zé', v: 3 }, { nome: 'Abreu', v: 3 }];
  const r = por(entrada);
  assert.deepEqual(r.map((x) => x.nome), ['Abreu', 'Éden', 'Zé']);
  assert.equal(entrada[0].nome, 'Éden');
});
