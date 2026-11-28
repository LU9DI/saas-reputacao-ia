import test from 'node:test';
import assert from 'node:assert/strict';
import { campos, parseCsv, slugify, montarAutoridades, agregarAutoridade, DATASET, UNIDADE, API, urlAutoridade, FAIXAS, lerContagemNomis } from './nomis.mjs';

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
test('série fixada em local units (NM_141_1), nunca enterprises (NM_142_1)', () => {
  assert.equal(DATASET, 'NM_141_1');
  assert.equal(UNIDADE, 'local units');
  assert.match(API, /\/NM_141_1\.data\.csv$/);
  assert.doesNotMatch(API, /NM_142_1/);
  assert.match(urlAutoridade('E06000001'), /NM_141_1\.data\.csv/);
  assert.deepEqual(FAIXAS, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
});

test('lerContagemNomis distingue zero real de ausente/suprimido', () => {
  assert.deepEqual(lerContagemNomis('0'), { valor: 0, status: null });
  assert.deepEqual(lerContagemNomis('15'), { valor: 15, status: null });
  assert.deepEqual(lerContagemNomis('N'), { valor: null, status: 'unavailable' });
  assert.deepEqual(lerContagemNomis('S'), { valor: null, status: 'suppressed' });
  assert.deepEqual(lerContagemNomis('X'), { valor: null, status: 'not_applicable' });
  assert.deepEqual(lerContagemNomis(''), { valor: null, status: 'invalid' });
});

test('agregarAutoridade não transforma faixa ausente em zero', () => {
  const L = (c, f, v) => ({ industry_code: c, employment_sizeband: String(f), obs_value: String(v) });
  const r = agregarAutoridade([
    L('56101', 0, 10), L('56101', 1, 6), L('56101', 2, 'S'), L('56101', 3, 2), L('56101', 4, 1), L('56101', 5, 1), L('56101', 6, 0),
  ], [{ slug: 'restaurants', sic: ['56101'] }]);
  assert.deepEqual(r.restaurants.sz, [6, null, 2, 1, 1, 0]);
  assert.equal(r.restaurants.szStatus, 'partial');
});

test('agregarAutoridade soma faixas detalhadas 7/8/9 em 100+ e ignora agregados', () => {
  const L = (c, f, v) => ({ industry_code: c, employment_sizeband: String(f), obs_value: String(v) });
  const r = agregarAutoridade([
    L('56101', 0, 100), L('56101', 1, 60), L('56101', 2, 20), L('56101', 3, 10), L('56101', 4, 5), L('56101', 5, 5), L('56101', 6, 0),
    L('56101', 7, 0), L('56101', 8, 0), L('56101', 9, 0),
    L('56101', 10, 100), L('56101', 40, 100), // agregados derivados: ignorados
  ], [{ slug: 'restaurants', sic: ['56101'] }]);
  assert.equal(r.restaurants.e, 100);
  assert.deepEqual(r.restaurants.sz, [60, 20, 10, 5, 5, 0]);
  assert.equal(r.restaurants.szStatus, 'complete');
});

test('agregarAutoridade marca distribuição arredondada quando as faixas não somam o total', () => {
  const L = (c, f, v) => ({ industry_code: c, employment_sizeband: String(f), obs_value: String(v) });
  const r = agregarAutoridade([
    L('56101', 0, 10), L('56101', 1, 0), L('56101', 2, 0), L('56101', 3, 0), L('56101', 4, 0), L('56101', 5, 0), L('56101', 6, 0),
  ], [{ slug: 'restaurants', sic: ['56101'] }]);
  assert.equal(r.restaurants.szStatus, 'rounded');
  assert.deepEqual(r.restaurants.sz, [0, 0, 0, 0, 0, 0]);
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
  assert.deepEqual(r, { restaurants: { e: 140, eStatus: null, sz: [90, 30, 10, 5, 5, 0], szStatus: 'complete' } });
  assert.ok(seen.has('56101') && !seen.has('37748736'));
});
