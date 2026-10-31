// Testes do gerador de sitemap estático do Índice.
// Cobrem a regra de publicação (o que entra e o que fica fora), a divisão em
// shards e as checagens de integridade que o CI usa.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { anosPublicados, calcularRanking, podePublicar } from './rankings.mjs';
import {
  caminhosIndexaveis,
  criarLastmodDe,
  dividirShards,
  validarArtefato,
  xmlSitemapIndex,
  xmlUrlset,
  MIN_MUNICIPIOS_RANKING_UF,
  POR_ARQUIVO,
} from './static-sitemaps.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const rankingsFake = {
  anosPublicados: () => [],
  calcularRanking: () => ({ ordenado: [] }),
  podePublicar: () => false,
};

const meta = {
  competencia: '2026-10',
  geradoEm: '2026-10-26T07:34:27.901Z',
  minimoParaIndexar: 10,
  segmentos: [
    { slug: 'restaurantes', nome: 'Restaurantes', curto: 'restaurantes', classes: ['5611'] },
    { slug: 'hoteis', nome: 'Hotéis', curto: 'hotéis', classes: ['5510'] },
  ],
};

// Duas UFs: SP com célula publicável em restaurantes, AC só abaixo do mínimo.
const stats = {
  AC: { acrelandia: { restaurantes: { a: 5, m: 5, ab: 0, ba: 0, ano: {}, sub: {} } } },
  SP: {
    'sao-paulo': {
      restaurantes: { a: 42, m: 10, ab: 1, ba: 0, ano: {}, sub: {} },
      hoteis: { a: 3, m: 3, ab: 0, ba: 0, ano: {}, sub: {} },
    },
    campinas: { restaurantes: { a: 15, m: 4, ab: 0, ba: 0, ano: {}, sub: {} } },
  },
};
const municipios = [
  { uf: 'AC', slug: 'acrelandia', nome: 'Acrelândia', ibge: 1200013 },
  { uf: 'SP', slug: 'sao-paulo', nome: 'São Paulo', ibge: 3550308 },
  { uf: 'SP', slug: 'campinas', nome: 'Campinas', ibge: 3509502 },
];

const caminhos = caminhosIndexaveis({ meta, municipios, stats, rankings: rankingsFake });

test('inclui base, UF, município e célula publicável', () => {
  for (const caminho of ['/', '/metodologia', '/rankings/aberturas', '/rankings/ativos', '/sp', '/sp/sao-paulo']) {
    assert.ok(caminhos.includes(caminho), `faltou ${caminho}`);
  }
  assert.ok(caminhos.includes('/sp/sao-paulo/restaurantes'), 'célula com 42 ativos deve entrar');
  assert.ok(caminhos.includes('/sp/campinas/restaurantes'), 'célula com 15 ativos deve entrar');
});

test('exclui UF, município e célula abaixo do mínimo', () => {
  assert.ok(!caminhos.some((c) => c.startsWith('/ac')), 'UF sem célula publicável não deve entrar');
  assert.ok(!caminhos.includes('/sp/sao-paulo/hoteis'), 'célula com 3 ativos não deve entrar');
});

test('não duplica caminhos e não usa barra final nem parâmetros', () => {
  assert.equal(new Set(caminhos).size, caminhos.length);
  assert.ok(caminhos.every((c) => !c.endsWith('/') || c === '/'));
  assert.ok(caminhos.every((c) => !/[?#]/.test(c)));
});

test('dividirShards respeita o limite e nunca devolve shard vazio', () => {
  const muitos = Array.from({ length: 23 }, (_, i) => `/p${i}`);
  const shards = dividirShards(muitos, 10);
  assert.deepEqual(shards.map((s) => s.length), [10, 10, 3]);
  assert.deepEqual(dividirShards([], 10), [[]]);
  assert.throws(() => dividirShards(muitos, 0));
});

test('xmlUrlset emite canaleta canônica, lastmod e escapa caracteres', () => {
  const lastmodDe = criarLastmodDe({ '/sp/sao-paulo': 'abc|2026-10-20' }, meta.geradoEm);
  const xml = xmlUrlset(['/', '/sp/sao-paulo', '/x?a=1&b=2'], lastmodDe);
  assert.match(xml, /<loc>https:\/\/filtraai\.com\/indice<\/loc>/);
  assert.match(xml, /<loc>https:\/\/filtraai\.com\/indice\/sp\/sao-paulo<\/loc><lastmod>2026-10-20<\/lastmod>/);
  assert.match(xml, /a=1&amp;b=2/);
  assert.equal((xml.match(/<lastmod>2026-10-26T07:34:27.901Z<\/lastmod>/g) ?? []).length, 2);
});

test('xmlSitemapIndex declara todos os shards', () => {
  const xml = xmlSitemapIndex(3, meta.geradoEm);
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 3);
  for (const id of [0, 1, 2]) assert.ok(xml.includes(`https://filtraai.com/indice/sitemap/${id}.xml`));
});

test('validarArtefato aprova o artefato coerente', () => {
  const shards = dividirShards(caminhos, POR_ARQUIVO);
  const xmlIndex = xmlSitemapIndex(shards.length, meta.geradoEm);
  const lastmodDe = criarLastmodDe({}, meta.geradoEm);
  assert.deepEqual(validarArtefato({ caminhos, shards, xmlIndex, lastmodDe }), []);
});

test('validarArtefato reprova duplicata, barra final e descompasso com o índice', () => {
  const shards = [['/a', '/a'], ['/b/']];
  const lastmodDe = criarLastmodDe({}, meta.geradoEm);
  // Índice declara 3 shards, artefato tem 2: descompasso de contagem.
  const errosContagem = validarArtefato({ caminhos: ['/a', '/a', '/b/'], shards, xmlIndex: xmlSitemapIndex(3, meta.geradoEm), lastmodDe });
  assert.ok(errosContagem.some((e) => e.includes('duplicada')));
  assert.ok(errosContagem.some((e) => e.includes('barra final')));
  assert.ok(errosContagem.some((e) => e.includes('índice declara 3 shards')));
  // Índice declara 1 shard, artefato tem 2: o shard 1 fica sem referência.
  const errosShard = validarArtefato({ caminhos: ['/a', '/a', '/b/'], shards, xmlIndex: xmlSitemapIndex(1, meta.geradoEm), lastmodDe });
  assert.ok(errosShard.some((e) => e.includes('índice não declara o shard 1')));
});

test('a regra de ranking por UF não divergiu do app', () => {
  const dataTs = readFileSync(path.resolve(raiz, 'src/lib/data.ts'), 'utf8');
  const valor = dataTs.match(/MIN_MUNICIPIOS_RANKING_UF = (\d+)/)?.[1];
  assert.equal(Number(valor), MIN_MUNICIPIOS_RANKING_UF);
});

test('dados reais: 28.853 URLs em três shards de até 10.000', () => {
  const dir = path.resolve(raiz, 'data');
  const metaReal = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const municipiosReal = JSON.parse(readFileSync(path.join(dir, 'municipios.json'), 'utf8'));
  const statsReal = {};
  for (const arquivo of readdirSync(path.join(dir, 'stats'))) {
    if (/^[A-Z]{2}\.json$/.test(arquivo)) {
      statsReal[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(dir, 'stats', arquivo), 'utf8'));
    }
  }
  const real = caminhosIndexaveis({
    meta: metaReal,
    municipios: municipiosReal,
    stats: statsReal,
    rankings: { anosPublicados, calcularRanking, podePublicar },
  });
  const shards = dividirShards(real, POR_ARQUIVO);
  assert.equal(real.length, 28853);
  assert.deepEqual(shards.map((s) => s.length), [10000, 10000, 8853]);
  assert.equal(new Set(real).size, real.length);
});
