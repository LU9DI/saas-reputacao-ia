import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const shortGuide = readFileSync(resolve(root, 'public/llms.txt'), 'utf8');
const fullGuide = readFileSync(resolve(root, 'public/llms-full.txt'), 'utf8');
const sitemapSource = readFileSync(resolve(root, 'src/app/sitemap.ts'), 'utf8');

const requiredUrls = [
  'https://filtraai.com/',
  'https://filtraai.com/filtra-ai',
  'https://filtraai.com/gestao-de-reputacao-online',
  'https://filtraai.com/indice-reputacao',
  'https://filtraai.com/auditoria-gratuita',
  'https://filtraai.com/planos',
  'https://filtraai.com/blog',
  'https://filtraai.com/blog/gestao-reputacao-online-guia',
  'https://filtraai.com/blog/seo-local-avaliacoes-local-pack',
  'https://filtraai.com/blog/como-responder-avaliacoes-negativas',
  'https://filtraai.com/blog/como-conseguir-avaliacoes-google',
  'https://filtraai.com/blog/avaliacoes-google-restaurantes',
  'https://filtraai.com/blog/reputacao-online-clinicas',
  'https://filtraai.com/blog/reputacao-online-hoteis',
  'https://filtraai.com/blog/reputacao-franquias-multilocal',
];

for (const url of requiredUrls) {
  assert.ok(shortGuide.includes(url), `llms.txt is missing canonical URL: ${url}`);
  assert.ok(fullGuide.includes(url) || url === 'https://filtraai.com/', `llms-full.txt is missing core URL: ${url}`);
  const path = new URL(url).pathname;
  assert.ok(
    sitemapSource.includes(`'${path}'`) || (path === '/' && sitemapSource.includes("'/'")),
    `sitemap.ts does not appear to declare URL from llms.txt: ${path}`,
  );
}

for (const forbidden of ['/login', '/admin', '/painel', '/api/']) {
  assert.ok(!shortGuide.includes(`https://filtraai.com${forbidden}`), `Private route must not be promoted in llms.txt: ${forbidden}`);
}

assert.ok(!shortGuide.includes('\\n- ['), 'llms.txt must use real line breaks, not escaped newline text');
assert.ok(shortGuide.includes('Não invente') && fullGuide.includes('Não invente'), 'AI reference files must include factuality guidance');
console.log(`LLM discovery validation passed: ${requiredUrls.length} canonical URLs checked.`);
