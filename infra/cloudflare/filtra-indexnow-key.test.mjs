// Guardrail de alinhamento entre o Worker `filtra-indexnow-key` e a fonte de
// verdade do robots.txt (`frontend/src/app/robots.ts`).
//
// Por que existe: o Worker serve `/robots.txt` e `/sitemap.xml` em rota exata e,
// quando a origem falha, devolve um robots.txt GERADO em código. Em 31/10/2026
// esse fallback ainda anunciava `Sitemap: /sitemap.xml` depois de a fonte passar a
// não anunciá-lo — ou seja, uma falha de origem reintroduziria a descoberta
// duplicada que a correção removeu. Como o Worker usa a sintaxe de
// service-worker (sem `export`), o teste valida o código-fonte, no mesmo padrão de
// `frontend/scripts/validate-seo.mjs`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const worker = readFileSync(path.join(raiz, 'infra/cloudflare/filtra-indexnow-key.js'), 'utf8');
const robotsTs = readFileSync(path.join(raiz, 'frontend/src/app/robots.ts'), 'utf8');

const crawlersDoWorker = [...(worker.match(/const crawlers = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([A-Za-z-]+)'/g)].map((m) => m[1]);
const crawlersDaFonte = [...(robotsTs.match(/const AI_CRAWLERS = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([A-Za-z-]+)'/g)].map((m) => m[1]);

const sitemapsDoWorker = [...worker.matchAll(/'(Sitemap: https:\/\/filtraai\.com[^']*)'/g)].map((m) => m[1]);
const sitemapsDaFonte = [...(robotsTs.match(/sitemap:\s*\[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/`\$\{base\}(\/[^`]*)`/g)].map(
  (m) => `Sitemap: https://filtraai.com${m[1]}`,
);

test('lista de crawlers do Worker espelha frontend/src/app/robots.ts', () => {
  assert.ok(crawlersDaFonte.length >= 10, 'AI_CRAWLERS não foi lida da fonte');
  assert.deepEqual(crawlersDoWorker, crawlersDaFonte);
});

test('robots.txt de fallback anuncia exatamente os mesmos sitemaps da fonte', () => {
  assert.deepEqual(sitemapsDoWorker, sitemapsDaFonte);
});

test('fallback não volta a anunciar o leaf /sitemap.xml (duplicaria a descoberta)', () => {
  assert.ok(!sitemapsDoWorker.includes('Sitemap: https://filtraai.com/sitemap.xml'));
  assert.ok(sitemapsDoWorker.includes('Sitemap: https://filtraai.com/sitemap-index.xml'));
  assert.ok(sitemapsDoWorker.includes('Sitemap: https://filtraai.com/indice/sitemap-index.xml'));
});

test('validResource continua exigindo o índice central no robots de origem', () => {
  // Se a origem parar de anunciar o índice central, o fallback gerado seria usado
  // silenciosamente: a validação precisa continuar barrando isso.
  assert.ok(worker.includes('/sitemap-index\\.xml/i.test(body)'), 'validResource deve validar o robots pela presença do índice central');
  assert.ok(worker.includes('/user-agent:/i.test(body)'));
});

test('o fallback estático de sitemap remove URLs /zh (páginas noindex)', () => {
  const trecho = worker.match(/function sanitizeStaticSitemap\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.ok(trecho.includes("url.pathname !== '/zh'") && trecho.includes("url.pathname.startsWith('/zh/')"));
  assert.ok(trecho.includes("url.hostname === 'filtraai.com'"));
});
