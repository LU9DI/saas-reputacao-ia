import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(frontendDir, 'src/app/solucoes/[seoPage]/page.tsx');
const outputDir = path.join(frontendDir, 'public/solucoes');
const source = await import('node:fs/promises').then(({ readFile }) => readFile(sourcePath, 'utf8'));
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function property(object, name) {
  if (!ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find((item) =>
    (ts.isPropertyAssignment(item) || ts.isShorthandPropertyAssignment(item)) &&
    (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) &&
    item.name.text === name
  )?.initializer;
}

function stringValue(node) {
  if (!node) return '';
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return '';
}

function arrayObjects(node) {
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements.filter(ts.isObjectLiteralExpression);
}

let pagesNode;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'PAGES') {
    pagesNode = node.initializer;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
if (!pagesNode || !ts.isArrayLiteralExpression(pagesNode)) {
  throw new Error('Could not find the PAGES array in the programmatic SEO route.');
}

const pages = pagesNode.elements.filter(ts.isObjectLiteralExpression).map((item) => {
  const slug = stringValue(property(item, 'slug'));
  const title = stringValue(property(item, 'title'));
  const description = stringValue(property(item, 'description'));
  const h1 = stringValue(property(item, 'h1'));
  const lead = stringValue(property(item, 'lead'));
  const sections = arrayObjects(property(item, 'sections')).map((section) => ({
    heading: stringValue(property(section, 'heading')),
    body: stringValue(property(section, 'body')),
  }));
  const faq = arrayObjects(property(item, 'faq')).map((entry) => ({
    question: stringValue(property(entry, 'question')),
    answer: stringValue(property(entry, 'answer')),
  }));
  if (!slug || !title || !description || !h1 || !lead || sections.length === 0) {
    throw new Error(`SEO page data is incomplete for slug: ${slug || '(missing slug)'}`);
  }
  return { slug, title, description, h1, lead, sections, faq };
});

const uniqueSlugs = new Set(pages.map(({ slug }) => slug));
if (pages.length !== 89 || uniqueSlugs.size !== pages.length) {
  throw new Error(`Expected 89 unique SEO pages; found ${pages.length} pages and ${uniqueSlugs.size} unique slugs.`);
}

await mkdir(outputDir, { recursive: true });
for (const name of await readdir(outputDir)) {
  if (name.endsWith('.md')) await rm(path.join(outputDir, name));
}

for (const page of pages) {
  const canonical = `https://filtraai.com/solucoes/${page.slug}`;
  const sections = page.sections.map(({ heading, body }) => `## ${heading}\n\n${body}`).join('\n\n');
  const faq = page.faq.length
    ? `\n\n## Perguntas frequentes\n\n${page.faq.map(({ question, answer }) => `### ${question}\n\n${answer}`).join('\n\n')}\n`
    : '';
  const markdown = [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    `canonical: ${JSON.stringify(canonical)}`,
    '---',
    '',
    `# ${page.h1}`,
    '',
    page.lead,
    '',
    sections,
    faq,
    '',
    '## Páginas relacionadas',
    '',
    `- [Planos Filtra.AI](https://filtraai.com/planos)`,
    `- [Auditoria gratuita](https://filtraai.com/auditoria-gratuita)`,
    `- [Soluções por setor e tarefa](https://filtraai.com/solucoes)`,
    `- [Gestão de reputação online](https://filtraai.com/gestao-de-reputacao-online)`,
    '',
    '_Versão Markdown para leitura automatizada. Para a página canônica e a navegação completa, consulte a URL HTML acima._',
    '',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  await writeFile(path.join(outputDir, `${page.slug}.md`), markdown, 'utf8');
}
console.log(`Generated ${pages.length} Markdown companions in public/solucoes/ (not included in sitemap).`);
