import test from 'node:test';
import assert from 'node:assert/strict';
import { validarProveniencia } from './provenance.mjs';

const sha = 'a'.repeat(64);
const arquivosFonte = [
  { arquivo: 'Cnaes.zip', tipo: 'cnaes', url: 'https://example.org/Cnaes.zip', bytes: 10, sha256: sha },
  { arquivo: 'Municipios.zip', tipo: 'municipios', url: null, bytes: 20, sha256: sha },
  { arquivo: 'Estabelecimentos0.zip', tipo: 'estabelecimentos', url: 'https://example.org/Estabelecimentos0.zip', bytes: 30, sha256: sha },
];
const base = { competencia: '2026-10', arquivosEstabelecimentos: 1, proveniencia: { status: 'verificada', algoritmo: 'SHA-256', arquivosFonte } };

test('aceita base histórica explicitamente sem hashes', () => {
  assert.deepEqual(validarProveniencia({ proveniencia: { status: 'nao_capturada_na_geracao', motivo: 'gerada antes do manifesto' } }), []);
});
test('aceita manifesto completo e consistente', () => {
  assert.deepEqual(validarProveniencia(base), []);
});
test('rejeita hash inválido, arquivo obrigatório ausente e URL com credencial', () => {
  const invalid = structuredClone(base);
  invalid.proveniencia.arquivosFonte[0].sha256 = 'invalido';
  invalid.proveniencia.arquivosFonte[1].url = 'https://user:token@example.org/Municipios.zip?token=x';
  invalid.proveniencia.arquivosFonte = invalid.proveniencia.arquivosFonte.slice(0, 2);
  const errors = validarProveniencia(invalid).join(' ');
  assert.match(errors, /sha256 inválido/);
  assert.match(errors, /url não pode conter credenciais/i);
  assert.match(errors, /EstabelecimentosN.zip/);
});
test('exige declaração histórica sem hashes inventados e rejeita proveniência ausente', () => {
  assert.ok(validarProveniencia({}).length);
  assert.ok(validarProveniencia({ proveniencia: { status: 'nao_capturada_na_geracao', motivo: 'legado', arquivosFonte } }).length);
});
