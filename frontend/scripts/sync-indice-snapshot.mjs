#!/usr/bin/env node

/**
 * Gera `src/data/indice-snapshot.json` a partir da base do Índice.
 *
 * Por quê: as páginas comerciais passam a citar contagens reais e verificáveis
 * do Índice Filtra.AI (dado próprio, competência e fonte), em vez de texto
 * genérico. É o ativo que motores generativos podem citar.
 *
 * Uso:
 *   node scripts/sync-indice-snapshot.mjs           # grava o snapshot
 *   node scripts/sync-indice-snapshot.mjs --check   # falha se estiver desatualizado
 *
 * No build da Vercel o diretório ../indice pode não existir; nesse caso o script
 * apenas ignora e usa o JSON já commitado.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const indiceDataDir = path.resolve(frontendDir, '..', 'indice', 'data');
const target = path.resolve(frontendDir, 'src', 'generated', 'indice-snapshot.json');
const checkOnly = process.argv.includes('--check');

const ESTADOS = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

if (!existsSync(indiceDataDir)) {
  // Build da Vercel: o app do Índice não faz parte do contexto do projeto.
  console.log('Skipping Índice snapshot: ../indice/data is not available.');
  process.exit(0);
}

const meta = JSON.parse(readFileSync(path.join(indiceDataDir, 'meta.json'), 'utf8'));
const statsDir = path.join(indiceDataDir, 'stats');
const stats = {};
for (const file of readdirSync(statsDir)) {
  if (!file.endsWith('.json')) continue;
  stats[file.replace(/\.json$/, '')] = JSON.parse(readFileSync(path.join(statsDir, file), 'utf8'));
}

const segmentos = new Map(
  meta.segmentos.map((s) => [
    s.slug,
    {
      nome: s.nome,
      curto: s.curto,
      ativos: 0,
      municipiosComPagina: 0,
      estados: 0,
      topEstados: [],
    },
  ]),
);
const porEstado = new Map(meta.segmentos.map((s) => [s.slug, new Map()]));
const porEstadoTodos = new Map();
const municipiosComPagina = new Map(meta.segmentos.map((s) => [s.slug, new Set()]));
let ativosTodos = 0;
const municipiosTodos = new Set();
const estadosTodos = new Set();
// Contagem de URLs indexáveis do app do Índice (/indice): home + metodologia,
// 1 por UF, 1 por município e 1 por célula município×segmento acima do mínimo.
// Precisa espelhar indice/src/lib/data.ts (todosOsCaminhos). O índice central de
// sitemaps usa esse total para saber quantos shards existem em /indice/sitemap/.
const ufsComPagina = new Set();
let celulasComPagina = 0;

for (const [uf, municipios] of Object.entries(stats)) {
  for (const [municipio, porSegmento] of Object.entries(municipios)) {
    for (const [slug, registro] of Object.entries(porSegmento)) {
      const segmento = segmentos.get(slug);
      if (!segmento) continue;
      segmento.ativos += registro.a;
      ativosTodos += registro.a;
      const mapa = porEstado.get(slug);
      mapa.set(uf, (mapa.get(uf) || 0) + registro.a);
      porEstadoTodos.set(uf, (porEstadoTodos.get(uf) || 0) + registro.a);
      if (registro.a >= meta.minimoParaIndexar) {
        municipiosComPagina.get(slug).add(`${uf}/${municipio}`);
        municipiosTodos.add(`${uf}/${municipio}`);
        ufsComPagina.add(uf);
        celulasComPagina += 1;
      }
      if (registro.a > 0) estadosTodos.add(uf);
    }
  }
}

for (const [slug, segmento] of segmentos) {
  const mapa = porEstado.get(slug);
  segmento.estados = [...mapa.values()].filter((total) => total > 0).length;
  segmento.municipiosComPagina = municipiosComPagina.get(slug).size;
  segmento.topEstados = [...mapa.entries()]
    .filter(([, ativos]) => ativos > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([uf, ativos]) => ({ uf, nome: ESTADOS[uf] || uf, ativos }));
}

const snapshot = {
  competencia: meta.competencia,
  geradoEm: meta.geradoEm,
  minimoParaIndexar: meta.minimoParaIndexar,
  fonte: meta.fonte,
  todos: {
    ativos: ativosTodos,
    municipiosComPagina: municipiosTodos.size,
    estados: estadosTodos.size,
    segmentos: segmentos.size,
    topEstados: [...porEstadoTodos.entries()]
      .filter(([, ativos]) => ativos > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([uf, ativos]) => ({ uf, nome: ESTADOS[uf] || uf, ativos })),
  },
  // URLs indexáveis publicadas em https://filtraai.com/indice — a mesma conta de
  // indice/src/lib/data.ts#todosOsCaminhos. O sitemap central usa `total` para
  // decidir quantos shards /indice/sitemap/<n>.xml existem.
  urls: {
    homeMetodologia: 2,
    ufs: ufsComPagina.size,
    municipios: municipiosTodos.size,
    celulas: celulasComPagina,
    total: 2 + ufsComPagina.size + municipiosTodos.size + celulasComPagina,
  },
  segmentos: Object.fromEntries(segmentos),
};

const json = `${JSON.stringify(snapshot, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(target)) {
    console.error(`Índice snapshot ausente: ${path.relative(frontendDir, target)}. Rode npm run sync:indice.`);
    process.exit(1);
  }
  const atual = JSON.parse(readFileSync(target, 'utf8'));
  if (JSON.stringify(atual) !== JSON.stringify(snapshot)) {
    console.error('Índice snapshot desatualizado em relação a indice/data. Rode npm run sync:indice e commite o JSON.');
    process.exit(1);
  }
  console.log('Índice snapshot em dia com indice/data.');
  process.exit(0);
}

mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, json, 'utf8');
console.log(
  `Índice snapshot: competência ${snapshot.competencia}, ${snapshot.todos.ativos} ativos, ` +
    `${snapshot.todos.municipiosComPagina} municípios com página, ${segmentos.size} segmentos.`,
);
