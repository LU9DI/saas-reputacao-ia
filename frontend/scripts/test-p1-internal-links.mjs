import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const home = read('src/app/preview/page.tsx');
const guide = read('src/app/blog/gestao-reputacao-online-guia/page.tsx');
const localSeo = read('src/app/blog/seo-local-avaliacoes-local-pack/page.tsx');
const qr = read('src/app/blog/qr-code-balcao-reviews/page.tsx');
const negative = read('src/app/blog/como-responder-avaliacoes-negativas/page.tsx');
const oneStar = read('src/app/blog/review-1-estrela-primeiras-24-horas/page.tsx');

test('homepage navigation exposes the Filtra.AI Index', () => {
  assert.match(home, /<Link href="\/indice"[^>]*>Índice de empresas<\/Link>/);
});

test('homepage contextual links include the national restaurant ranking', () => {
  assert.match(home, /\['\/indice\/rankings\/ativos\/restaurantes','Ranking nacional de restaurantes'/);
});

test('reputation guide links contextually to the national restaurant ranking', () => {
  assert.match(guide, /href="\/indice\/rankings\/ativos\/restaurantes"[^>]*>ranking nacional de restaurantes<\/Link>/);
});

test('local SEO guide links to the São Paulo restaurant cell', () => {
  assert.match(localSeo, /href="\/indice\/sp\/sao-paulo\/restaurantes"[^>]*>restaurantes ativos em São Paulo<\/Link>/);
});

test('QR Code guide preserves the feedback link and adds the national ranking', () => {
  assert.match(qr, /href="\/feedback-de-clientes"[^>]*>registrar feedback<\/Link>/);
  assert.match(qr, /href="\/indice\/rankings\/ativos\/restaurantes"[^>]*>ranking nacional de restaurantes<\/Link>/);
});

test('negative-review guide links to the Rio de Janeiro state ranking', () => {
  assert.match(negative, /href="\/indice\/rankings\/ativos\/restaurantes\/rj"[^>]*>ranking de restaurantes do Rio de Janeiro<\/Link>/);
});

test('the four internal links delivered by PR #199 remain present', () => {
  assert.match(guide, /href="\/blog\/como-responder-avaliacoes-negativas"/);
  assert.match(guide, /href="\/blog\/qr-code-balcao-reviews"/);
  assert.match(qr, /href="\/feedback-de-clientes"/);
  assert.match(oneStar, /href="\/feedback-de-clientes"/);
});
