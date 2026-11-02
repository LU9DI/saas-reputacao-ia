// Gera gêmeas Markdown para o servidor Next.js Node (Render).
// O export estático usa generate-markdown-twins.mjs e out/; este script
// complementa apenas builds runtime que produzem .next/server/app.
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

const SITE = 'https://filtraai.com';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(rootDir, '.next', 'server', 'app');
const outDir = path.join(rootDir, 'out');
const publicDir = path.join(rootDir, 'public');
const exists = (p) => access(p).then(() => true, () => false);

// O export estático já gera as gêmeas em out/. Não duplicar nem escrever em public/.
if (await exists(outDir)) {
  console.log('Skipping runtime Markdown twins: static export already generated out/.');
  process.exit(0);
}
if (!(await exists(appDir))) {
  console.log('Skipping runtime Markdown twins: .next/server/app not found.');
  process.exit(0);
}

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});
td.addRule('blockLink', {
  filter: (node) =>
    node.nodeName === 'A' &&
    Boolean(node.getAttribute('href')) &&
    [...node.querySelectorAll('h1,h2,h3,h4,p,div,ul,ol')].length > 0,
  replacement: (content, node) => {
    const href = node.getAttribute('href') ?? '';
    const absolute = href.startsWith('/') ? `${SITE}${href}` : href;
    return `\n\n${content.trim()}\n\n→ ${absolute}\n\n`;
  },
});
td.addRule('imgWithAlt', {
  filter: 'img',
  replacement: (_content, node) => {
    const alt = (node.getAttribute('alt') ?? '').trim();
    return alt ? `![${alt}](${node.getAttribute('src') ?? ''})` : '';
  },
});

const NOISE =
  'script, style, noscript, svg, button, form, input, select, textarea, iframe, canvas, video, audio, [hidden], [aria-hidden="true"]';
const pages = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['api', '_not-found'].includes(entry.name)) await walk(file);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html') || entry.name === '_not-found.html') continue;
    const html = await readFile(file, 'utf8');
    const doc = parse(html);
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
    if (!canonical || !(canonical === SITE || canonical.startsWith(`${SITE}/`))) continue;
    if (/noindex/i.test(robots)) continue;
    const url = new URL(canonical);
    if (url.search || url.hash || url.pathname === '/') continue;
    const main = doc.querySelector('main') ?? doc.querySelector('article');
    if (!main) continue;
    main.querySelectorAll(NOISE).forEach((node) => node.remove());
    main.querySelectorAll('nav').forEach((node) => node.remove());
    main.querySelectorAll('a[aria-label="Filtra.AI"]').forEach((node) => node.remove());
    const markdown = td
      .turndown(main.innerHTML)
      .replace(/\]\((\/[^)\s]*)\)/g, (_match, href) => `] (${SITE}${href})`.replace('] (', ']('))
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (markdown.length < 200) continue;
    pages.push({ pathname: url.pathname, url: canonical, markdown });
  }
}
await walk(appDir);

const unique = [...new Map(pages.map((page) => [page.pathname, page])).values()]
  .sort((a, b) => a.pathname.localeCompare(b.pathname));
let written = 0;
for (const page of unique) {
  const relative = `${page.pathname.slice(1)}.md`;
  const target = path.join(publicDir, relative);
  await mkdir(path.dirname(target), { recursive: true });
  const langSegment = page.pathname.split('/')[1];
  const lang = langSegment === 'en' || langSegment === 'es' ? langSegment : 'pt-BR';
  const body = `> Fonte canônica: ${page.url} · Idioma: ${lang}\n\n${page.markdown}\n`;
  await writeFile(target, body, 'utf8');
  written += 1;
}

const llmsPath = path.join(publicDir, 'llms.txt');
const llmsSource = (await readFile(llmsPath, 'utf8')).split('\n## Versões em Markdown')[0].trimEnd();
const isBlog = (page) => /^\/(?:(?:en|es)\/)?blog\/./.test(page.pathname);
const groups = [
  ['Páginas (pt-BR) em Markdown', unique.filter((p) => !isBlog(p) && !p.pathname.startsWith('/en/') && !p.pathname.startsWith('/es/'))],
  ['Blog (pt-BR) em Markdown', unique.filter((p) => isBlog(p) && !p.pathname.startsWith('/en/') && !p.pathname.startsWith('/es/'))],
  ['English pages in Markdown', unique.filter((p) => p.pathname.startsWith('/en/'))],
  ['Páginas en español en Markdown', unique.filter((p) => p.pathname.startsWith('/es/'))],
];
const sections = groups
  .filter(([, items]) => items.length)
  .map(([title, items]) => `\n## ${title}\n${items.map((p) => `- ${p.pathname}: ${SITE}${p.pathname}.md`).join('\n')}\n`)
  .join('');
const llms = `${llmsSource}\n\n## Versões em Markdown\nCada página pública tem uma versão `.md` com o mesmo conteúdo, sem navegação nem scripts. A URL canônica continua sendo a página HTML.\n${sections}`;
await writeFile(llmsPath, llms, 'utf8');

const fullPath = path.join(publicDir, 'llms-full.txt');
const fullSource = (await readFile(fullPath, 'utf8')).split('\n# Conteúdo das páginas principais')[0].trimEnd();
const corePaths = [
  '/filtra-ai','/gestao-de-reputacao-online','/avaliacoes-google','/reputacao-google',
  '/analise-de-avaliacoes-com-ia','/feedback-de-clientes','/como-melhorar-avaliacoes-google',
  '/monitoramento-reputacao-online','/gestao-de-feedback','/metodologia','/planos',
];
const core = corePaths.map((pathname) => unique.find((page) => page.pathname === pathname)).filter(Boolean);
const full = `${fullSource}\n\n# Conteúdo das páginas principais\n\n${core.map((page) => `---\n\n## ${page.url}\n\n${page.markdown}\n`).join('\n')}`;
await writeFile(fullPath, full, 'utf8');

console.log(`Runtime Markdown twins: ${written} pages written to public/; llms-full: ${core.length}/${corePaths.length} core pages.`);
if (written === 0) {
  console.error('No runtime Markdown twins were generated from .next/server/app.');
  process.exitCode = 1;
}
