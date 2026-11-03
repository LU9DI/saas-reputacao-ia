// Contrato de descoberta interna entre os dois hubs do Índice.
//
// Por que existe: em 2026-11-03 a auditoria do Search Console mostrou que as
// 15.067 URLs dos EUA estavam publicadas e no sitemap, mas com ZERO links
// internos apontando para `/us` — o único caminho de descoberta era o sitemap,
// que o Google ainda não havia relido. Este teste impede a regressão: cada hub
// precisa anunciar o outro em HTML, e nenhum link literal pode apontar para uma
// rota que o gerador não publica.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { caminhosIndexaveis, caminhosUS, lerEstadosUS } from './static-sitemaps.mjs';
import { anosPublicados, calcularRanking, podePublicar } from './rankings.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ler = (relativo) => readFileSync(path.join(raiz, relativo), 'utf8');
const hrefsDe = (fonte) => [...fonte.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith('/'));

const LAYOUT_BR = 'src/app/(br)/layout.tsx';
const LAYOUT_US = 'src/app/(us)/layout.tsx';
const HEADER_BR = 'src/components/SiteHeader.tsx';

/** Rotas realmente publicadas, na mesma regra do sitemap (BR e EUA separados). */
function conjuntosPublicados() {
  const dirDados = path.join(raiz, 'data');
  const lerJson = (relativo) => JSON.parse(readFileSync(path.join(dirDados, relativo), 'utf8'));
  const meta = lerJson('meta.json');
  const municipios = lerJson('municipios.json');
  const stats = {};
  for (const arquivo of readdirSync(path.join(dirDados, 'stats')).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
    stats[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(dirDados, 'stats', arquivo), 'utf8'));
  }
  const br = new Set(caminhosIndexaveis({ meta, municipios, stats, rankings: { anosPublicados, calcularRanking, podePublicar } }));

  // Os EUA são opcionais: sem data-us/ as rotas /us devolvem 404.
  const dirUS = path.join(raiz, 'data-us');
  const us = new Set();
  try {
    const metaUS = JSON.parse(readFileSync(path.join(dirUS, 'meta.json'), 'utf8'));
    const counties = JSON.parse(readFileSync(path.join(dirUS, 'counties.json'), 'utf8'));
    const statsUS = {};
    for (const arquivo of readdirSync(path.join(dirUS, 'stats')).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
      statsUS[arquivo.slice(0, 2)] = JSON.parse(readFileSync(path.join(dirUS, 'stats', arquivo), 'utf8'));
    }
    const estados = lerEstadosUS(ler('src/lib/us-states.ts'));
    for (const caminho of caminhosUS({ meta: metaUS, counties, stats: statsUS, estados })) us.add(caminho);
  } catch {
    // sem data-us/: nenhuma rota dos EUA é publicada
  }
  return { br, us };
}

/** União das rotas publicadas — usada para provar que nenhum link aponta para 404. */
function rotasPublicadas() {
  const { br, us } = conjuntosPublicados();
  return new Set([...br, ...us]);
}

test('o hub brasileiro anuncia o hub dos EUA em HTML', () => {
  assert.ok(hrefsDe(ler(HEADER_BR)).includes('/us'), `${HEADER_BR} deve conter um link literal para /us`);
  assert.ok(hrefsDe(ler(LAYOUT_BR)).includes('/us'), `${LAYOUT_BR} deve conter um link literal para /us no rodapé`);
});

test('o hub dos EUA anuncia o hub brasileiro em HTML', () => {
  const hrefs = hrefsDe(ler(LAYOUT_US));
  assert.ok(hrefs.includes('/'), `${LAYOUT_US} deve conter um link literal para / (Índice Brasil)`);
});

test('o rótulo de cada link cruzado está marcado com o idioma de destino', () => {
  // Misturar pt-BR e en na mesma árvore de acessibilidade confunde leitores de tela
  // e o próprio Google sobre o idioma do destino.
  assert.match(ler(HEADER_BR), /href="\/us"\s+hrefLang="en"\s+lang="en"/);
  assert.match(ler(LAYOUT_BR), /href="\/us"\s+hrefLang="en"\s+lang="en"/);
  assert.match(ler(LAYOUT_US), /href="\/"\s+hrefLang="pt-BR"\s+lang="pt-BR"/);
});

test('nenhum link literal dos layouts aponta para rota não publicada', () => {
  const publicadas = rotasPublicadas();
  const origens = [HEADER_BR, LAYOUT_BR, LAYOUT_US];
  const quebrados = [];
  for (const origem of origens) {
    for (const href of hrefsDe(ler(origem))) {
      if (!publicadas.has(href)) quebrados.push(`${origem} -> ${href}`);
    }
  }
  assert.deepEqual(quebrados, [], 'todos os hrefs literais devem existir no sitemap publicado');
});

test('os links cruzados não criam URLs novas nem duplicadas', () => {
  // A linkagem interna é navegação, não publicação: o conjunto de rotas continua
  // sendo exatamente o que o gerador de sitemap emite (sem alias novo como
  // /estados-unidos, sem barra final, sem sobreposição BR/EUA).
  const { br, us } = conjuntosPublicados();
  assert.ok(br.has('/') && us.has('/us'));
  assert.ok(!br.has('/estados-unidos') && !us.has('/estados-unidos'));
  assert.ok(![...br, ...us].some((p) => p !== '/' && p.endsWith('/')));
  const intersecao = [...br].filter((p) => us.has(p));
  assert.deepEqual(intersecao, [], 'BR e EUA não podem compartilhar o mesmo caminho');
});
