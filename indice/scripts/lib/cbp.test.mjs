// Testes com linhas SINTÉTICAS no layout do cbp23co.txt. Não representam dados reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { lerCabecalho, parseLinhaCbp, criarAgregadorCbp, condadosDeTxt, resolverCondados } from './cbp.mjs';

const CAB = '"fipstate","fipscty","naics","emp_nf","emp","qp1_nf","qp1","ap_nf","ap","est","n<5","n5_9","n10_19","n20_49","n50_99","n100_249","n250_499","n500_999","n1000","n1000_1","n1000_2","n1000_3","n1000_4"';
const linha = (st, cty, naics, nf, emp, est, sz) => `"${st}","${cty}","${naics}","${nf}",${emp},"G",1,"G",1,${est},${sz.join(',')},"N","N","N","N"`;
const SEG = [
  { slug: 'restaurants', naics: ['7225//', '7224//'] },
  { slug: 'pharmacies', naics: ['446110'] },
];

test('cabeçalho: mapeia colunas e rejeita layout incompleto', () => {
  const idx = lerCabecalho(CAB);
  assert.equal(idx.naics, 2);
  assert.equal(idx['n<5'], 10);
  assert.throws(() => lerCabecalho('"fipstate","fipscty","naics"'), /sem as colunas/);
});

test('agregador soma códigos do mesmo segmento, ignora totais e outros códigos', () => {
  const idx = lerCabecalho(CAB);
  const ag = criarAgregadorCbp(SEG, idx);
  const L = [
    linha('08', '031', '7225//', 'G', 1000, 100, [40, 30, 20, 8, 2, 0, 0, 0, 0]),
    linha('08', '031', '7224//', 'H', 200, 20, [10, 5, 3, 2, 0, 0, 0, 0, 0]),
    linha('08', '031', '722511', 'G', 999, 999, [1, 1, 1, 1, 1, 1, 1, 1, 1]), // subcódigo: não conta
    linha('08', '999', '7225//', 'G', 5, 5, [1, 1, 1, 1, 1, 0, 0, 0, 0]), // total estadual
    linha('08', '031', '446110', 'J', 50, 6, [4, 2, 0, 0, 0, 0, 0, 0, 0]),
    linha('06', '037', '7225//', 'S', 7, 3, [3, 0, 0, 0, 0, 0, 0, 0, 0]),
  ];
  for (const l of L) ag.ingerir(parseLinhaCbp(l));
  const den = ag.dados.get('08031');
  assert.equal(den.restaurants.e, 120);
  assert.equal(den.restaurants.emp, 1200);
  assert.equal(den.restaurants.empOk, true);
  assert.deepEqual(den.restaurants.sz, [50, 35, 23, 10, 2, 0]);
  assert.equal(den.pharmacies.e, 6);
  assert.equal(ag.dados.has('08999'), false);
  assert.equal(ag.dados.get('06037').restaurants.empOk, false); // sinalizador S: emprego não publicável
  assert.equal(ag.contagem().lidas, L.length);
});

test('agregador recusa código NAICS repetido na configuração', () => {
  const idx = lerCabecalho(CAB);
  assert.throws(() => criarAgregadorCbp([{ slug: 'a', naics: ['7225//'] }, { slug: 'b', naics: ['7225//'] }], idx), /repetido/);
});

test('condados: lê arquivo do Census e gera slugs únicos', () => {
  const txt = 'STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT\nCO|08|031|1|Denver County|H6|C\nMO|29|510|2|St. Louis city|C7|F\nMO|29|189|3|St. Louis County|H1|A\nPR|72|001|4|Adjuntas Municipio|H1|A\n';
  const c = condadosDeTxt(txt);
  const r = resolverCondados(['08031', '29510', '29189', '72001', '99999'], c);
  assert.deepEqual(r.map((x) => `${x.state}/${x.slug}`), ['CO/denver-county', 'MO/st-louis-county', 'MO/st-louis-city']);
});
