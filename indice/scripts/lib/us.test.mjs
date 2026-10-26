// Testes com linhas SINTÉTICAS. Não representam dados reais do Census.
import test from 'node:test';
import assert from 'node:assert/strict';
import { linhaCsv, naicsLimpo, mapearCabecalho, criarAgregadorUS, nomesDeCondados, resolverCondados, slugify } from './us.mjs';

const CAB = 'fipstate,fipscty,naics,empflag,emp_nf,emp,qp1_nf,qp1,ap_nf,ap,est,n<5,n5_9,n10_19,n1000'.split(',');
const SEG = [
  { slug: 'restaurants', naics: ['7225'] },
  { slug: 'doctors-and-dentists', naics: ['6211', '6212'] },
  { slug: 'pharmacies', naics: ['4461', '4561'] },
];
const l = (s) => linhaCsv(s);

test('naicsLimpo remove / e -', () => {
  assert.equal(naicsLimpo('7225//'), '7225');
  assert.equal(naicsLimpo('------'), '');
  assert.equal(naicsLimpo('713940'), '713940');
});

test('mapearCabecalho acha colunas e faixas, e falha sem as obrigatórias', () => {
  const c = mapearCabecalho(CAB);
  assert.equal(c.est, 10);
  assert.deepEqual(c.faixas.map((f) => f.n), ['n<5', 'n5_9', 'n10_19', 'n1000']);
  assert.throws(() => mapearCabecalho(['a', 'b']), /sem as colunas/);
});

test('agregador soma códigos do mesmo segmento, ignora outros e territórios', () => {
  const cab = mapearCabecalho(CAB);
  const ag = criarAgregadorUS(SEG);
  const linhas = [
    '13,121,7225//,,,100,,1,,1,40,20,10,5,0',
    '13,121,722511,,,50,,1,,1,15,8,4,2,0', // 6 dígitos: não deve somar com o 4 dígitos
    '13,121,6211//,,,10,,1,,1,30,20,5,3,0',
    '13,121,6212//,,,10,,1,,1,12,6,3,1,0',
    '13,121,------,,,900,,1,,1,500,1,1,1,1', // total
    '13,999,7225//,,,1,,1,,1,3,3,0,0,0', // condado não especificado
    '72,001,7225//,,,1,,1,,1,3,3,0,0,0', // Porto Rico: fora
    '13,121,4561//,,,5,,1,,1,9,5,2,1,0',
  ];
  for (const x of linhas) ag.ingerir(l(x), cab);
  const g = ag.dados.get('13|121');
  assert.equal(g.restaurants.e, 40);
  assert.equal(g.restaurants.f['n<5'], 20);
  assert.equal(g['doctors-and-dentists'].e, 42);
  assert.equal(g.pharmacies.e, 9);
  assert.equal(ag.dados.size, 1);
  assert.equal(ag.contagem().lidas, linhas.length);
});

test('nomesDeCondados lê os dois formatos', () => {
  const census = 'STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT\nGA|13|121|00000|Fulton County|H1|A\n';
  assert.equal(nomesDeCondados(census).get('13|121'), 'Fulton County');
  const csv = 'fips,county_name,state_abbr\n13121,Fulton County,GA\n';
  assert.equal(nomesDeCondados(csv).get('13|121'), 'Fulton County');
  assert.throws(() => nomesDeCondados('x,y\n1,2\n'), /desconhecido/);
});

test('resolverCondados gera slug único por estado', () => {
  const nomes = new Map([['51|760', 'Richmond city'], ['51|159', 'Richmond County'], ['51|001', 'Richmond County']]);
  const r = resolverCondados(['51|760', '51|159', '51|001'], nomes);
  const slugs = r.map((x) => x.slug);
  assert.equal(new Set(slugs).size, 3);
  assert.equal(slugify("St. John's County"), 'st-john-s-county');
});
