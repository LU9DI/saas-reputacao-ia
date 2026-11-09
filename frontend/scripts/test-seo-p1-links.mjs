/**
 * Testes da rodada P1 de links internos contextuais para o Índice Filtra.AI.
 *
 * Valida:
 * - Os 8 links autorizados (header, home, 4 artigos, PR #199 preservados).
 * - Correspondência entre texto-âncora e destino.
 * - Ausência de self-links nos artigos abrangidos.
 * - Ausência de links para páginas noindex ou de teste (/preview/teste, /teste).
 * - Preservação dos 4 links introduzidos pelo PR #199.
 * - Integridade da hierarquia BR/EUA (hreflang não afetada).
 * - Integridade dos destinos (links resolvem para rotas existentes no build).
 *
 * Roda sem DOM e sem rede: lê os fontes .tsx e verifica os hrefs.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'app');
const INDICE_APP = join(process.cwd(), '..', 'indice', 'src', 'app');

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

test('SeoPageHeader contém link para /indice', () => {
  const content = read('components/SeoPageHeader.tsx');
  assert.ok(content.includes('href="/indice"'), 'header deve conter href="/indice"');
  assert.ok(/>\s*Índice\s*</.test(content), 'header deve conter âncora "Índice"');
});

test('Homepage (preview) contém link para /indice/rankings/ativos', () => {
  const content = read('preview/page.tsx');
  assert.ok(
    content.includes('href="/indice/rankings/ativos"'),
    'home deve conter link para ranking nacional /indice/rankings/ativos'
  );
  assert.ok(
    content.includes('Ranking nacional de estabelecimentos') ||
      content.includes('National establishment ranking'),
    'home deve conter âncora de ranking nacional'
  );
});

test('Artigo hoteis contém link para /indice/rankings/ativos/hoteis', () => {
  const content = read('blog/reputacao-online-hoteis/page.tsx');
  assert.ok(
    content.includes('href="/indice/rankings/ativos/hoteis"'),
    'artigo hoteis deve linkar rankings/ativos/hoteis'
  );
  assert.ok(
    content.includes('ranking nacional de hotéis no Índice Filtra.AI'),
    'artigo hoteis deve conter âncora de ranking de hotéis'
  );
});

test('Artigo clinicas contém link para /indice/rankings/ativos/clinicas', () => {
  const content = read('blog/reputacao-online-clinicas/page.tsx');
  assert.ok(
    content.includes('href="/indice/rankings/ativos/clinicas"'),
    'artigo clinicas deve linkar rankings/ativos/clinicas'
  );
  assert.ok(
    content.includes('ranking nacional de clínicas no Índice Filtra.AI'),
    'artigo clinicas deve conter âncora de ranking de clínicas'
  );
});

test('Artigo franquias direciona ao Índice geral, sem prometer ranking inexistente', () => {
  const content = read('blog/reputacao-franquias-multilocal/page.tsx');
  assert.ok(
    content.includes('href="/indice"'),
    'artigo franquias deve direcionar ao Índice geral'
  );
  assert.ok(
    content.includes('Índice Filtra.AI'),
    'artigo franquias deve identificar o Índice geral como destino'
  );
});

test('Artigo restaurantes contém link para /indice/rankings/ativos/restaurantes', () => {
  const content = read('blog/avaliacoes-google-restaurantes/page.tsx');
  assert.ok(
    content.includes('href="/indice/rankings/ativos/restaurantes"'),
    'artigo restaurantes deve linkar rankings/ativos/restaurantes'
  );
  assert.ok(
    content.includes('ranking nacional de restaurantes no Índice Filtra.AI'),
    'artigo restaurantes deve conter âncora de ranking de restaurantes'
  );
});

test('Links do PR #199 estão preservados', () => {
  const guia = read('blog/gestao-reputacao-online-guia/page.tsx');
  assert.ok(
    guia.includes('href="/blog/como-responder-avaliacoes-negativas"'),
    'PR #199: gestao-reputacao-online-guia -> como-responder-avaliacoes-negativas preservado'
  );
  assert.ok(
    guia.includes('href="/blog/qr-code-balcao-reviews"'),
    'PR #199: gestao-reputacao-online-guia -> qr-code-balcao-reviews preservado'
  );
  const qr = read('blog/qr-code-balcao-reviews/page.tsx');
  assert.ok(
    qr.includes('href="/feedback-de-clientes"'),
    'PR #199: qr-code-balcao-reviews -> feedback-de-clientes preservado'
  );
  const estrela = read('blog/review-1-estrela-primeiras-24-horas/page.tsx');
  assert.ok(
    estrela.includes('href="/feedback-de-clientes"'),
    'PR #199: review-1-estrela -> feedback-de-clientes preservado'
  );
});


test('Ausência de self-links nos artigos alterados', () => {
  const articles = [
    'blog/reputacao-online-hoteis/page.tsx',
    'blog/reputacao-online-clinicas/page.tsx',
    'blog/reputacao-franquias-multilocal/page.tsx',
    'blog/avaliacoes-google-restaurantes/page.tsx',
  ];
  const slugByFile = {
    'blog/reputacao-online-hoteis/page.tsx': '/reputacao-online-hoteis',
    'blog/reputacao-online-clinicas/page.tsx': '/reputacao-online-clinicas',
    'blog/reputacao-franquias-multilocal/page.tsx': '/reputacao-franquias-multilocal',
    'blog/avaliacoes-google-restaurantes/page.tsx': '/avaliacoes-google-restaurantes',
  };
  for (const file of articles) {
    const content = read(file);
    const self = slugByFile[file];
    const re = new RegExp(`href="${self}"`, 'g');
    let found = false;
    while (re.exec(content)) found = true;
    assert.ok(!found, `${file} não deve conter self-link para ${self}`);
  }
});

test('Ausência de links para páginas noindex/de teste', () => {
  const forbidden = ['/preview/teste', '/teste'];
  const files = [
    'components/SeoPageHeader.tsx',
    'blog/reputacao-online-hoteis/page.tsx',
    'blog/reputacao-online-clinicas/page.tsx',
    'blog/reputacao-franquias-multilocal/page.tsx',
    'blog/avaliacoes-google-restaurantes/page.tsx',
  ];
  for (const file of files) {
    const content = read(file);
    for (const f of forbidden) {
      assert.ok(
        !content.includes(`href="${f}"`),
        `${file} não deve conter link para ${f} (página noindex/teste)`
      );
    }
  }
});

const CHANGED_FILES = [
  'components/SeoPageHeader.tsx',
  'preview/page.tsx',
  'blog/reputacao-online-hoteis/page.tsx',
  'blog/reputacao-online-clinicas/page.tsx',
  'blog/reputacao-franquias-multilocal/page.tsx',
  'blog/avaliacoes-google-restaurantes/page.tsx',
  'blog/gestao-reputacao-online-guia/page.tsx',
  'blog/seo-local-avaliacoes-local-pack/page.tsx',
  'blog/qr-code-balcao-reviews/page.tsx',
  'blog/como-responder-avaliacoes-negativas/page.tsx',
];

test('Destinos /indice existem nos hrefs dos arquivos alterados', () => {
  const expected = [
    '/indice',
    '/indice/rankings/ativos',
    '/indice/rankings/ativos/hoteis',
    '/indice/rankings/ativos/clinicas',
    '/indice/rankings/ativos/restaurantes',
    '/indice/sp/sao-paulo/restaurantes',
    '/indice/rankings/ativos/restaurantes/rj',
  ];
  let total = 0;
  for (const dest of expected) {
    const sources = CHANGED_FILES.filter((file) => read(file).includes(`href="${dest}"`));
    assert.ok(sources.length > 0, `destino ${dest} deve aparecer em algum arquivo alterado`);
    total++;
  }
  assert.strictEqual(total, expected.length, `todos os ${expected.length} destinos /indice devem estar presentes`);
});

/**
 * O Índice é um app Next separado (indice/) servido em filtraai.com/indice.
 * Aqui os hrefs /indice/* são confrontados com a árvore de rotas desse app,
 * para que um link contextual não aponte para uma rota inexistente.
 */
function collectIndiceRoutePatterns(directory = INDICE_APP, prefix = []) {
  const patterns = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
      patterns.push(...collectIndiceRoutePatterns(fullPath, isGroup ? prefix : [...prefix, entry.name]));
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      patterns.push(prefix);
    }
  }
  return patterns;
}

function matchesIndicePattern(pattern, segments) {
  if (pattern.length === 0) return segments.length === 0;
  const [head, ...rest] = pattern;
  if (/^\[\[\.\.\..+\]\]$/.test(head)) return rest.length === 0;
  if (/^\[\.\.\..+\]$/.test(head)) return rest.length === 0 && segments.length >= 1;
  if (segments.length === 0) return false;
  if (/^\[.+\]$/.test(head)) return matchesIndicePattern(rest, segments.slice(1));
  return head === segments[0] && matchesIndicePattern(rest, segments.slice(1));
}

/**
 * A árvore de rotas aceita qualquer `[segmento]`, mas só existem páginas para os
 * segmentos presentes no snapshot do Índice (fonte: indice/data). Este teste evita
 * links contextuais para rankings que respondem 404 — caso do antigo
 * `/indice/rankings/ativos/franquias`.
 */
test('Segmentos usados em /indice/rankings/ativos existem no snapshot do Índice', () => {
  const snapshot = JSON.parse(readFileSync(join(process.cwd(), 'src', 'generated', 'indice-snapshot.json'), 'utf8'));
  const known = new Set(Object.keys(snapshot.segmentos));
  assert.ok(known.size >= 9, 'snapshot do Índice deve listar todos os segmentos');
  let checked = 0;
  for (const file of CHANGED_FILES) {
    for (const [, href, segment] of read(file).matchAll(/href="(\/indice\/rankings\/ativos\/([a-z0-9-]+))"/g)) {
      checked += 1;
      assert.ok(known.has(segment), `${file}: ${href} usa segmento sem página publicada no Índice`);
    }
  }
  assert.ok(checked > 0, 'deve existir pelo menos um link para ranking por segmento');
});

test('Todo href /indice dos arquivos alterados resolve para uma rota do app do Índice', () => {
  const patterns = collectIndiceRoutePatterns();
  assert.ok(patterns.length > 0, 'app do Índice deve expor rotas em indice/src/app');
  for (const file of CHANGED_FILES) {
    for (const [, href] of read(file).matchAll(/href="(\/indice(?:\/[^"]*)?)"/g)) {
      const segments = href.split('/').filter(Boolean).slice(1);
      const matched = patterns.some((pattern) => matchesIndicePattern(pattern, segments));
      assert.ok(matched, `${file}: ${href} não corresponde a nenhuma rota do app do Índice`);
    }
  }
});

test('Hreflang/idioma não afetado (sem novos links /zh/)', () => {
  for (const file of [
    'components/SeoPageHeader.tsx',
    'blog/reputacao-online-hoteis/page.tsx',
    'blog/reputacao-online-clinicas/page.tsx',
    'blog/reputacao-franquias-multilocal/page.tsx',
    'blog/avaliacoes-google-restaurantes/page.tsx',
  ]) {
    const content = read(file);
    const zhLinks = content.match(/href="\/zh\//g) || [];
    assert.ok(
      zhLinks.length === 0,
      `${file} não deve introduzir links /zh/ indevidos`
    );
  }
});
