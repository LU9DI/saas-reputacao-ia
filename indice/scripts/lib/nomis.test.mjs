import test from 'node:test';
import assert from 'node:assert/strict';
import { campos, parseCsv, slugify, montarAutoridades, agregarAutoridade } from './nomis.mjs';

test('campos respeita aspas e vírgulas internas', () => {
  assert.deepEqual(campos('"a","b, c","d""e",5'), ['a', 'b, c', 'd"e', '5']);
});
test('parseCsv usa o cabeçalho em minúsculas', () => {
  const r = parseCsv('"INDUSTRY_CODE","OBS_VALUE"\n"56101",120\n"56102",35\n');
  assert.deepEqual(r, [{ industry_code: '56101', obs_value: '120' }, { industry_code: '56102', obs_value: '35' }]);
});
test('slugify', () => {
  assert.equal(slugify('Bristol, City of'), 'bristol-city-of');
  assert.equal(slugify('Na h-Eileanan Siar'), 'na-h-eileanan-siar');
  assert.equal(slugify('Newry, Mourne and Down'), 'newry-mourne-and-down');
  assert.equal(slugify('Ards & North Down'), 'ards-and-north-down');
});
test('montarAutoridades desempata nomes repetidos e descarta códigos fora das 4 nações', () => {
  const nacao = (c) => ({ E: 'england', S: 'scotland' })[c[0]];
  const r = montarAutoridades([
    { codigo: 'E06000001', nome: 'Hartlepool' },
    { codigo: 'E07000001', nome: 'Dup' }, { codigo: 'E07000002', nome: 'Dup' },
    { codigo: 'K02000001', nome: 'UK' },
  ], nacao);
  assert.deepEqual(r.map((x) => x.slug), ['hartlepool', 'dup-e07000001', 'dup-e07000002']);
});
test('agregarAutoridade soma códigos da categoria e distribui faixas', () => {
  const L = (c, f, v) => ({ industry_code: c, employment_sizeband: String(f), obs_value: String(v) });
  const linhas = [
    L('56101', 0, 100), L('56101', 1, 60), L('56101', 2, 20), L('56101', 3, 10), L('56101', 4, 5), L('56101', 5, 5), L('56101', 6, 0), L('56101', 40, 0),
    L('56102', 0, 40), L('56102', 1, 30), L('56102', 2, 10),
    L('37748736', 0, 9999), // total geral: não é classe de 5 dígitos
    L('99999', 0, 5),
  ];
  const seen = new Set();
  const r = agregarAutoridade(linhas, [{ slug: 'restaurants', sic: ['56101', '56102'] }, { slug: 'nada', sic: ['11111'] }], seen);
  assert.deepEqual(r, { restaurants: { e: 140, sz: [90, 30, 10, 5, 5, 0] } });
  assert.ok(seen.has('56101') && !seen.has('37748736'));
});
