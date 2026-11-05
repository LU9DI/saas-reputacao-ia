#!/usr/bin/env node
/**
 * Mede o heap retido pelo modelo de dados do Índice (Brasil + EUA), isolado do
 * servidor Next. Somente leitura: não altera dados, banco nem configuração.
 *
 *   node --expose-gc scripts/diagnose-memory-data.mjs
 *   node --expose-gc scripts/diagnose-memory-data.mjs --json
 *
 * Por que existe: o RSS do servidor mistura runtime do Next + cache ISR + dados.
 * Este script isola a parcela dos dados, para saber se vale otimizar `data.ts` e
 * `us.ts` (ver docs/MEMORIA_INDICE_2026-11-04.md).
 *
 * O carregamento abaixo espelha `src/lib/data.ts:carregar()` e o bloco de carga
 * de `src/lib/us.ts`. Se esses arquivos mudarem de formato, atualize este script.
 * `--expose-gc` é obrigatório: sem GC forçado, o número medido é lixo acumulado.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const raiz = path.resolve(import.meta.dirname, '..');
const brDir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));
const usDir = path.resolve(process.env.INDICE_US_DATA_DIR || path.join(raiz, 'data-us'));
const comoJson = process.argv.includes('--json');

if (typeof global.gc !== 'function') {
  console.error('[diagnose-memory-data] rode com --expose-gc para que a medição tenha sentido.');
  process.exit(1);
}

const mib = (bytes) => Number((bytes / 1048576).toFixed(1));
const heap = () => {
  for (let i = 0; i < 4; i += 1) global.gc();
  return process.memoryUsage().heapUsed;
};
const ler = (arquivo) => JSON.parse(readFileSync(arquivo, 'utf8'));
const saida = [];

// --- Brasil (espelha carregar() de src/lib/data.ts) ---
const t0 = Date.now();
const base = heap();
const meta = ler(path.join(brDir, 'meta.json'));
const municipios = ler(path.join(brDir, 'municipios.json'));
const subclasses = ler(path.join(brDir, 'subclasses.json'));
const arquivosBr = existsSync(path.join(brDir, 'stats'))
  ? readdirSync(path.join(brDir, 'stats')).filter((f) => f.endsWith('.json'))
  : [];
const stats = {};
for (const arquivo of arquivosBr) {
  stats[arquivo.replace(/\.json$/, '')] = ler(path.join(brDir, 'stats', arquivo));
}
const depoisStats = heap();

// ranking: lista ordenada por segmento + 3 mapas de posição por segmento
const ranking = new Map();
for (const segmento of meta.segmentos) {
  const lista = [];
  for (const [uf, porMunicipio] of Object.entries(stats)) {
    for (const [municipio, porSegmento] of Object.entries(porMunicipio)) {
      const registro = porSegmento[segmento.slug];
      if (registro && registro.a > 0) lista.push({ uf, municipio, a: registro.a });
    }
  }
  lista.sort((x, y) => y.a - x.a || x.uf.localeCompare(y.uf) || x.municipio.localeCompare(y.municipio));
  const rankBR = new Map();
  const rankUF = new Map();
  const porUF = new Map();
  lista.forEach((posicao, i) => {
    const anterior = lista[i - 1];
    const chave = `${posicao.uf}/${posicao.municipio}`;
    const valor = anterior && anterior.a === posicao.a ? rankBR.get(`${anterior.uf}/${anterior.municipio}`) : i + 1;
    rankBR.set(chave, valor);
    const grupo = porUF.get(posicao.uf) || [];
    grupo.push(posicao);
    porUF.set(posicao.uf, grupo);
  });
  for (const grupo of porUF.values()) {
    grupo.forEach((posicao, i) => {
      const anterior = grupo[i - 1];
      const chave = `${posicao.uf}/${posicao.municipio}`;
      rankUF.set(chave, anterior && anterior.a === posicao.a ? rankUF.get(`${anterior.uf}/${anterior.municipio}`) : i + 1);
    });
  }
  ranking.set(segmento.slug, { ordenado: lista, rankBR, rankUF });
}
const totalBr = heap() - base;

let ufs = 0, cidades = 0, celulas = 0, chavesAno = 0, chavesSub = 0;
for (const porMunicipio of Object.values(stats)) {
  ufs += 1;
  for (const porSegmento of Object.values(porMunicipio)) {
    cidades += 1;
    for (const registro of Object.values(porSegmento)) {
      celulas += 1;
      chavesAno += Object.keys(registro.ano || {}).length;
      chavesSub += Object.keys(registro.sub || {}).length;
    }
  }
}
const bytesBrStats = arquivosBr.reduce((t, f) => t + statSync(path.join(brDir, 'stats', f)).size, 0);
saida.push({
  conjunto: 'BR',
  heap_MiB: mib(totalBr),
  stats_MiB: mib(depoisStats - base),
  ranking_MiB: mib(totalBr - (depoisStats - base)),
  arquivosStats: arquivosBr.length,
  jsonStatsBytes: bytesBrStats,
  ufs, municipios: cidades, celulas, chavesAno, chavesSub,
  segmentos: meta.segmentos.length,
});

// --- EUA (espelha o bloco de carga de src/lib/us.ts) ---
if (existsSync(path.join(usDir, 'meta.json'))) {
  const inicioUs = heap();
  const usMeta = ler(path.join(usDir, 'meta.json'));
  const condados = ler(path.join(usDir, 'counties.json'));
  const arquivosUs = readdirSync(path.join(usDir, 'stats')).filter((f) => f.endsWith('.json'));
  const usStats = new Map();
  for (const arquivo of arquivosUs) usStats.set(arquivo.replace(/\.json$/, ''), ler(path.join(usDir, 'stats', arquivo)));
  const depoisUsStats = heap();

  const usRanking = new Map();
  for (const segmento of usMeta.segmentos) {
    const lista = [];
    for (const [estado, porCondado] of usStats) {
      for (const [condado, porSegmento] of Object.entries(porCondado)) {
        const registro = porSegmento[segmento.slug];
        if (registro) lista.push({ estado, condado, e: registro.e });
      }
    }
    lista.sort((a, b) => b.e - a.e || `${a.estado}/${a.condado}`.localeCompare(`${b.estado}/${b.condado}`));
    usRanking.set(segmento.slug, { ordenado: lista });
  }
  const totalUs = heap() - inicioUs;

  let estados = 0, municipiosUs = 0, celulasUs = 0;
  for (const porCondado of usStats.values()) {
    estados += 1;
    for (const porSegmento of Object.values(porCondado)) {
      municipiosUs += 1;
      celulasUs += Object.keys(porSegmento).length;
    }
  }
  saida.push({
    conjunto: 'US',
    heap_MiB: mib(totalUs),
    stats_MiB: mib(depoisUsStats - inicioUs),
    ranking_MiB: mib(totalUs - (depoisUsStats - inicioUs)),
    arquivosStats: arquivosUs.length,
    estados, condados: municipiosUs, celulas: celulasUs,
    condadosDeclarados: condados.length,
    segmentos: usMeta.segmentos.length,
  });
}

// --- lastmod (carregado sob demanda, só em rotas de sitemap) ---
const arquivoLastmod = path.join(brDir, 'lastmod.json');
if (existsSync(arquivoLastmod)) {
  const inicioLastmod = heap();
  const lastmod = ler(arquivoLastmod);
  saida.push({
    conjunto: 'lastmod',
    heap_MiB: mib(heap() - inicioLastmod),
    entradas: Object.keys(lastmod).length,
    bytes: statSync(arquivoLastmod).size,
  });
}

const memoria = process.memoryUsage();
saida.push({
  conjunto: 'processo',
  ms: Date.now() - t0,
  rss_MiB: mib(memoria.rss),
  heapTotal_MiB: mib(memoria.heapTotal),
  heapUsed_MiB: mib(memoria.heapUsed),
  external_MiB: mib(memoria.external),
});

if (comoJson) {
  console.log(JSON.stringify(saida, null, 2));
} else {
  for (const linha of saida) console.log(JSON.stringify(linha));
}
