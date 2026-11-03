import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ate, emUF, deUF, rotuloSegmento } from '../../src/lib/rotulos.ts';

/** Extrai os literais de string de uma chamada `ate(60, ...)` do fonte. */
function candidatosDoTitulo(relativo) {
  const fonte = readFileSync(new URL(relativo, import.meta.url), 'utf8');
  const chamada = fonte.match(/const\s+tituloMeta\s*=\s*ate\(\s*60\s*,([\s\S]*?)\);/);
  assert.ok(chamada, `${relativo} deve definir tituloMeta com ate(60, …)`);
  return [...chamada[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
}

test('os hubs do Índice limitam o título a 60 caracteres via ate()', () => {
  const hubs = ['../../src/app/(br)/page.tsx', '../../src/app/(us)/us/page.tsx'];
  for (const hub of hubs) {
    const candidatos = candidatosDoTitulo(hub);
    assert.ok(candidatos.length > 0, `${hub} deve ter ao menos um candidato de título`);
    for (const candidato of candidatos) {
      assert.ok(
        candidato.length <= 60,
        `${hub}: candidato com ${candidato.length} caracteres excede 60 -> "${candidato}"`,
      );
    }
    // O primeiro candidato é o que vence: precisa caber, não pode depender do truncamento.
    assert.ok(ate(60, ...candidatos).length <= 60);
    assert.equal(ate(60, ...candidatos), candidatos[0], `${hub}: o primeiro candidato deve caber em 60`);
  }
});

test('ate escolhe o primeiro candidato que cabe', () => {
  assert.equal(ate(10, 'muito longo mesmo', 'curto'), 'curto');
  assert.equal(ate(10, 'cabe', 'outro'), 'cabe');
  assert.equal(ate(10, '1234567890', 'fallback'), '1234567890');
});

test('ate nunca ultrapassa o limite quando todos os candidatos são longos', () => {
  assert.equal(ate(3, 'aaaa', 'bbbb'), 'bb…');
  assert.equal(ate(10, 'candidato extenso', 'um nome muito comprido'), 'um nome…');
  assert.equal(ate(1, 'texto longo'), '…');
  assert.equal(ate(60, 'x'.repeat(114)), `${'x'.repeat(59)}…`);
  assert.equal(ate(8), '');
});

test('ate rejeita limites inválidos', () => {
  assert.throws(() => ate(0, 'título'), RangeError);
  assert.throws(() => ate(-1, 'título'), RangeError);
  assert.throws(() => ate(1.5, 'título'), RangeError);
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
