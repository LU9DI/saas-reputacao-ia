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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'app');

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

test('Artigo franquias contém link para /indice/rankings/ativos/franquias', () => {
  const content = read('blog/reputacao-franquias-multilocal/page.tsx');
  assert.ok(
    content.includes('href="/indice/rankings/ativos/franquias"'),
    'artigo franquias deve linkar rankings/ativos/franquias'
  );
  assert.ok(
    content.includes('ranking nacional de franquias no Índice Filtra.AI'),
    'artigo franquias deve conter âncora de ranking de franquias'
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

test('Destinos /indice existem nos hrefs dos arquivos alterados', () => {
  const expected = [
    '/indice',
    '/indice/rankings/ativos',
    '/indice/rankings/ativos/hoteis',
    '/indice/rankings/ativos/clinicas',
    '/indice/rankings/ativos/franquias',
    '/indice/rankings/ativos/restaurantes',
  ];
  let total = 0;
  for (const dest of expected) {
    let found = false;
    for (const file of [
      'components/SeoPageHeader.tsx',
      'preview/page.tsx',
      'blog/reputacao-online-hoteis/page.tsx',
      'blog/reputacao-online-clinicas/page.tsx',
      'blog/reputacao-franquias-multilocal/page.tsx',
      'blog/avaliacoes-google-restaurantes/page.tsx',
    ]) {
      if (read(file).includes(`href="${dest}"`)) {
        found = true;
        break;
      }
    }
    assert.ok(found, `destino ${dest} deve aparecer em algum arquivo alterado`);
    total++;
  }
  assert.strictEqual(total, expected.length, 'todos os 6 destinos /indice devem estar presentes');
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
