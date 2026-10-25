// Testes com linhas SINTÉTICAS no layout esperado. Não representam dados reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COL,
  TOTAL_COLUNAS,
  parseLinha,
  janelas,
  validarLayout,
  criarAgregador,
  slugify,
  normalizaTexto,
  tituloCase,
  ibgeParaLista,
  resolverMunicipios,
} from './aggregate.mjs';

function linha({ matriz = '1', sit = '02', dsit = '20200101', ini = '20200101', cnae = '5611201', uf = 'GO', mun = '9373' } = {}) {
  const c = new Array(TOTAL_COLUNAS).fill('');
  c[0] = '12345678';
  c[1] = '0001';
  c[2] = '99';
  c[COL.MATRIZ_FILIAL] = matriz;
  c[4] = 'NOME QUE NUNCA DEVE SER LIDO';
  c[COL.SITUACAO] = sit;
  c[COL.DATA_SITUACAO] = dsit;
  c[COL.DATA_INICIO] = ini;
  c[COL.CNAE_PRINCIPAL] = cnae;
  c[COL.UF] = uf;
  c[COL.MUNICIPIO] = mun;
  return `"${c.join('";"')}"`;
}

const SEGMENTOS = [
  { slug: 'restaurantes', classes: ['5611'] },
  { slug: 'hoteis', classes: ['5510'] },
];

test('parseLinha separa os campos e rejeita linhas inválidas', () => {
  const campos = parseLinha(linha());
  assert.equal(campos.length, TOTAL_COLUNAS);
  assert.equal(campos[COL.UF], 'GO');
  assert.equal(parseLinha(''), null);
  assert.equal(parseLinha('cabecalho;sem;aspas;qualquer-coisa-com-mais-de-vinte'), null);
});

test('validarLayout aprova linha válida e reprova layout deslocado', () => {
  assert.deepEqual(validarLayout(parseLinha(linha())), []);
  const quebrada = parseLinha(linha()).slice(1);
  assert.ok(validarLayout(quebrada).length > 0);
  const cnaeRuim = parseLinha(linha({ cnae: 'ABC' }));
  assert.ok(validarLayout(cnaeRuim).some((p) => p.includes('CNAE')));
});

test('janelas: 12 meses fechados antes da competência', () => {
  const j = janelas('2026-10');
  assert.equal(j.inicioComp, 20261001);
  assert.equal(j.inicioJanela, 20251001);
  assert.deepEqual(j.rotuloJanela, { inicio: '2025-10', fim: '2026-09' });
  const jan = janelas('2026-01');
  assert.equal(jan.inicioJanela, 20250101);
  assert.deepEqual(jan.rotuloJanela, { inicio: '2025-01', fim: '2025-12' });
  assert.throws(() => janelas('2026-1'));
});

test('agregador conta ativos, matrizes, aberturas, baixas e subclasses', () => {
  const ag = criarAgregador(SEGMENTOS, '2026-10');
  const linhas = [
    linha({ ini: '20260301' }), // ativo, matriz, aberto na janela
    linha({ matriz: '2', ini: '20100101', cnae: '5611203' }), // ativo, filial, subclasse diferente
    linha({ sit: '08', dsit: '20260215', ini: '20180505' }), // baixado na janela
    linha({ sit: '08', dsit: '20240215', ini: '20180505' }), // baixado fora da janela
    linha({ ini: '20261005' }), // aberto na competência (fora da janela fechada)
    linha({ cnae: '4711301' }), // segmento não monitorado
    linha({ uf: 'EX' }), // exterior
    linha({ cnae: '5510801', mun: '1234', uf: 'SP' }), // outro segmento/município
  ];
  for (const l of linhas) ag.ingerir(parseLinha(l));

  const goiania = ag.dados.get('GO|9373').restaurantes;
  assert.equal(goiania.a, 3); // 2 ativas + 1 aberta em out/2026 (também ativa)
  assert.equal(goiania.m, 2);
  assert.equal(goiania.ab, 1);
  assert.equal(goiania.ba, 1);
  assert.deepEqual(goiania.sub, { 5611201: 2, 5611203: 1 });
  assert.equal(goiania.ano[2026], 2); // inclui a de mar/2026 e a de out/2026
  assert.equal(goiania.ano[2018], 2);
  assert.equal(ag.dados.get('SP|1234').hoteis.a, 1);
  assert.equal(ag.dados.has('EX|9373'), false);
  assert.equal(ag.contagem().lidas, linhas.length);
});

test('agregador não guarda nenhum dado pessoal ou de contato', () => {
  const ag = criarAgregador(SEGMENTOS, '2026-10');
  ag.ingerir(parseLinha(linha()));
  const serializado = JSON.stringify([...ag.dados]);
  assert.equal(serializado.includes('NOME QUE NUNCA'), false);
});

test('slugify, normalizaTexto e tituloCase', () => {
  assert.equal(slugify('Goiânia'), 'goiania');
  assert.equal(slugify("Santa Bárbara d'Oeste"), 'santa-barbara-d-oeste');
  assert.equal(normalizaTexto("SANTA BARBARA D OESTE"), normalizaTexto("Santa Bárbara d'Oeste"));
  assert.equal(tituloCase('SANTA BARBARA DO OESTE'), 'Santa Barbara do Oeste');
});

test('ibgeParaLista tolera as duas hierarquias e ignora itens incompletos', () => {
  const lista = ibgeParaLista([
    { id: 5208707, nome: 'Goiânia', microrregiao: { mesorregiao: { UF: { sigla: 'GO' } } } },
    { id: 1, nome: 'Nova', microrregiao: null, 'regiao-imediata': { 'regiao-intermediaria': { UF: { sigla: 'PA' } } } },
    { id: 2, nome: 'Sem UF' },
  ]);
  assert.deepEqual(lista.map((m) => `${m.uf}:${m.nome}`), ['GO:Goiânia', 'PA:Nova']);
});

test('resolverMunicipios usa nome do IBGE, faz fallback e garante slug único na UF', () => {
  const nomes = new Map([
    ['9373', 'GOIANIA'],
    ['1111', 'BOM JESUS'],
    ['2222', 'BOM JESUS'],
    ['3333', 'LUGAR SEM MATCH'],
  ]);
  const ibge = [
    { id: 5208707, nome: 'Goiânia', uf: 'GO' },
    { id: 10, nome: 'Bom Jesus', uf: 'GO' },
  ];
  const r = resolverMunicipios(
    [
      { uf: 'GO', codigo: '9373' },
      { uf: 'GO', codigo: '1111' },
      { uf: 'GO', codigo: '2222' },
      { uf: 'GO', codigo: '3333' },
    ],
    nomes,
    ibge,
  );
  assert.equal(r[0].nome, 'Goiânia');
  assert.equal(r[0].casouIbge, true);
  assert.equal(r[1].slug, 'bom-jesus');
  assert.equal(r[2].slug, 'bom-jesus-2222');
  assert.equal(r[3].casouIbge, false);
  assert.equal(r[3].nome, 'Lugar Sem Match');
});
