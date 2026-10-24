// Gera, a partir do HTML do export estático, uma versão .md "gêmea" de cada
// página indexável + um llms-full.txt com o conteúdo das páginas principais.
//
// Por quê: agentes e assistentes de IA consomem o mesmo conteúdo em uma fração
// dos tokens, sem JS, navegação ou banners. O HTML continua sendo a URL
// canônica; o .md só é descoberto via llms.txt e NÃO entra no sitemap.
//
// Como o deploy é estático (Cloudflare Pages), não há negociação de conteúdo
// por header Accept. As rotas .md são explícitas e o `public/_headers` define
// Content-Type e `Link: rel="canonical"` apontando para o HTML.
//
// Convenção emergente, não padrão: o Google afirma não usar llms.txt. Custo de
// manutenção ~zero porque tudo é derivado do HTML publicado.

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

const SITE = 'https://filtraai.com';
const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(frontendDir, 'out');
const publicDir = path.join(frontendDir, 'public');

const exists = (p) => access(p).then(() => true, () => false);

if (!(await exists(outputDir))) {
  // Build da Vercel (.next) não gera "out"; este passo é só do export estático.
  console.log('Skipping markdown twins: no "out" directory was generated.');
  process.exit(0);
}

const sitemapXml = await readFile(path.join(outputDir, 'sitemap.xml'), 'utf8');
const urls = [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
const lastmodByUrl = new Map(
  [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => [
    (m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1],
    (m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1],
  ]),
);

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});
// Cards inteiros clicáveis (<a><h2/><p/></a>) viram "[\n\n## Título\n\n](url)" no
// Markdown padrão. Aqui o bloco sai como texto e a URL vai logo abaixo.
td.addRule('blockLink', {
  filter: (node) =>
    node.nodeName === 'A' &&
    node.getAttribute('href') &&
    [...node.querySelectorAll('h1,h2,h3,h4,p,div,ul,ol')].length > 0,
  replacement: (content, node) => {
    const href = node.getAttribute('href');
    const abs = href.startsWith('/') ? `${SITE}${href}` : href;
    return `\n\n${content.trim()}\n\n→ ${abs}\n\n`;
  },
});
// Imagens decorativas não ajudam um agente; mantém só as que têm alt útil.
td.addRule('imgWithAlt', {
  filter: 'img',
  replacement: (_c, node) => {
    const alt = (node.getAttribute('alt') || '').trim();
    return alt ? `![${alt}](${node.getAttribute('src') || ''})` : '';
  },
});

const NOISE = 'script, style, noscript, svg, button, form, input, select, textarea, iframe, canvas, video, audio, [hidden], [aria-hidden="true"]';

function langOf(pathname) {
  const seg = pathname.split('/')[1];
  return ['en', 'es', 'zh'].includes(seg) ? seg : 'pt-BR';
}

function htmlFileFor(pathname) {
  if (pathname === '/') return path.join(outputDir, 'index.html');
  const flat = path.join(outputDir, `${pathname.slice(1)}.html`);
  return flat;
}

function toMarkdown(html) {
  const root = parse(html);
  // Landing pages usam <main>; os artigos do blog usam <article>.
  const main = root.querySelector('main') ?? root.querySelector('article');
  if (!main) return null;
  main.querySelectorAll(NOISE).forEach((n) => n.remove());
  // Navegação repetida (breadcrumb visual, menus internos) é ruído para agente.
  main.querySelectorAll('nav').forEach((n) => n.remove());
  // Logotipo da marca dentro do conteúdo viraria uma linha solta "Filtra.AI".
  main.querySelectorAll('a[aria-label="Filtra.AI"]').forEach((n) => n.remove());
  const body = td
    .turndown(main.innerHTML)
    // Links relativos viram absolutos: o .md é lido fora do contexto do site.
    .replace(/\]\((\/[^)\s]*)\)/g, (_m, p) => `](${SITE}${p})`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return body;
}

const twins = [];
const skipped = [];

for (const url of urls) {
  const { pathname } = new URL(url);
  // A home não ganha .md: `/index.md` colidiria com a regra `/*.md` do _headers
  // (canonical errado). Ela é descrita pelo próprio llms.txt.
  if (pathname === '/') continue;

  const file = htmlFileFor(pathname);
  if (!(await exists(file))) {
    skipped.push(`${pathname} (sem HTML)`);
    continue;
  }
  const md = toMarkdown(await readFile(file, 'utf8'));
  if (!md || md.length < 200) {
    skipped.push(`${pathname} (sem <main> ou conteúdo curto)`);
    continue;
  }

  const lastmod = lastmodByUrl.get(url);
  const header = [`Fonte canônica: ${url}`, `Idioma: ${langOf(pathname)}`, lastmod ? `Atualizado: ${lastmod.slice(0, 10)}` : null]
    .filter(Boolean)
    .join(' · ');
  const content = `> ${header}\n\n${md}\n`;

  const target = path.join(outputDir, `${pathname.slice(1)}.md`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
  twins.push({ pathname, url, lang: langOf(pathname), md, bytes: Buffer.byteLength(content) });
}

// ---- llms.txt: índice curado (public/) + seção gerada com as versões .md ----
const llmsSource = await readFile(path.join(publicDir, 'llms.txt'), 'utf8');
const section = (title, items) =>
  items.length ? `\n## ${title}\n${items.map((t) => `- ${t.url.replace(SITE, '')}: ${SITE}${t.pathname}.md`).join('\n')}\n` : '';

const isBlog = (t) => /^\/(?:(?:en|es)\/)?blog\/./.test(t.pathname);
const ptPages = twins.filter((t) => t.lang === 'pt-BR' && !isBlog(t));
const ptBlog = twins.filter((t) => t.lang === 'pt-BR' && isBlog(t));
const enPages = twins.filter((t) => t.lang === 'en');
const esPages = twins.filter((t) => t.lang === 'es');

const llms =
  llmsSource.trimEnd() +
  '\n\n' +
  '## Versões em Markdown\n' +
  'Cada página pública tem uma versão `.md` com o mesmo conteúdo, sem navegação nem scripts. A URL canônica continua sendo a página HTML. O conteúdo completo das páginas principais está em https://filtraai.com/llms-full.txt.\n' +
  section('Páginas (pt-BR) em Markdown', ptPages) +
  section('Blog (pt-BR) em Markdown', ptBlog) +
  section('English pages in Markdown', enPages) +
  section('Páginas en español en Markdown', esPages);
await writeFile(path.join(outputDir, 'llms.txt'), llms, 'utf8');

// ---- llms-full.txt: texto editorial (public/) + conteúdo das páginas principais ----
const fullSource = (await readFile(path.join(publicDir, 'llms-full.txt'), 'utf8')).trimEnd();
const CORE = [
  '/filtra-ai',
  '/gestao-de-reputacao-online',
  '/avaliacoes-google',
  '/reputacao-google',
  '/analise-de-avaliacoes-com-ia',
  '/feedback-de-clientes',
  '/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online',
  '/gestao-de-feedback',
  '/planos',
];
const core = CORE.map((p) => twins.find((t) => t.pathname === p)).filter(Boolean);
const full =
  fullSource +
  '\n\n# Conteúdo das páginas principais\n\n' +
  core.map((t) => `---\n\n## ${t.url}\n\n${t.md}\n`).join('\n');
await writeFile(path.join(outputDir, 'llms-full.txt'), full, 'utf8');

console.log(
  `Markdown twins: ${twins.length} written (${(twins.reduce((s, t) => s + t.bytes, 0) / 1024).toFixed(0)} KB), ` +
    `llms-full.txt with ${core.length}/${CORE.length} core pages (${(Buffer.byteLength(full) / 1024).toFixed(0)} KB).`,
);
if (skipped.length) console.log(`Skipped ${skipped.length}: ${skipped.join('; ')}`);
