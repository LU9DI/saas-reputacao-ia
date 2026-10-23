import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/app/solucoes/[seoPage]/page.tsx');
const source = readFileSync(sourcePath, 'utf8');
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

function property(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  const item = object.properties.find((entry) =>
    (ts.isPropertyAssignment(entry) || ts.isShorthandPropertyAssignment(entry)) &&
    (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
    entry.name.text === name
  );
  return item?.initializer;
}

function literal(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text.trim() : '';
}

function objectArray(node) {
  return node && ts.isArrayLiteralExpression(node) ? node.elements.filter(ts.isObjectLiteralExpression) : [];
}

let pagesNode;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'PAGES') {
    pagesNode = node.initializer;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
check(Boolean(pagesNode && ts.isArrayLiteralExpression(pagesNode)), 'Could not parse the PAGES array.');

const pages = pagesNode && ts.isArrayLiteralExpression(pagesNode)
  ? pagesNode.elements.filter(ts.isObjectLiteralExpression).map((node) => {
      const sections = objectArray(property(node, 'sections')).map((section) => ({
        heading: literal(property(section, 'heading')),
        body: literal(property(section, 'body')),
      }));
      const faq = objectArray(property(node, 'faq')).map((item) => ({
        question: literal(property(item, 'question')),
        answer: literal(property(item, 'answer')),
      }));
      return {
        slug: literal(property(node, 'slug')),
        title: literal(property(node, 'title')),
        description: literal(property(node, 'description')),
        h1: literal(property(node, 'h1')),
        lead: literal(property(node, 'lead')),
        sections,
        faq,
      };
    })
  : [];

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    const normalized = value.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.add(normalized);
    seen.add(normalized);
  }
  return [...duplicates];
}

check(pages.length === 108, `Expected 108 programmatic SEO pages, found ${pages.length}.`);
for (const field of ['slug', 'title', 'description', 'h1']) {
  const duplicates = duplicateValues(pages.map((page) => page[field]));
  check(duplicates.length === 0, `Duplicate programmatic page ${field}: ${duplicates.slice(0, 3).join(' | ')}`);
}

const slugs = new Set();
const fullBodies = new Map();
const repeatedSectionBodies = new Map();
for (const page of pages) {
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug), `Invalid URL slug: ${page.slug || '(empty)'}`);
  check(!slugs.has(page.slug), `Duplicate URL slug: ${page.slug}`);
  slugs.add(page.slug);

  check(page.title.length >= 25 && page.title.length <= 90, `${page.slug}: title should be 25–90 characters (found ${page.title.length}).`);
  check(page.description.length >= 70 && page.description.length <= 220, `${page.slug}: meta description should be 70–220 characters (found ${page.description.length}).`);
  check(page.h1.length >= 12, `${page.slug}: H1 is too short or missing.`);
  check(page.sections.length >= 3, `${page.slug}: expected at least 3 substantive sections.`);
  check(page.faq.length >= 2, `${page.slug}: expected at least 2 visible FAQ entries.`);

  const body = [page.lead, ...page.sections.map((section) => section.body), ...page.faq.map((item) => item.answer)]
    .join(' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const wordCount = body ? body.split(/\s+/).length : 0;
  check(wordCount >= 90, `${page.slug}: thin page content (${wordCount} words; minimum 90).`);

  const normalizedBody = body.toLocaleLowerCase('pt-BR');
  if (fullBodies.has(normalizedBody)) {
    check(false, `${page.slug}: body duplicates ${fullBodies.get(normalizedBody)}.`);
  } else {
    fullBodies.set(normalizedBody, page.slug);
  }

  for (const section of page.sections) {
    const normalized = section.body.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
    if (normalized.length < 80) {
      check(false, `${page.slug}: section "${section.heading}" is too short to provide useful guidance.`);
    }
    if (normalized) {
      const owners = repeatedSectionBodies.get(normalized) ?? [];
      owners.push(page.slug);
      repeatedSectionBodies.set(normalized, owners);
    }
  }
}

// Repeated advice can be valid, but an identical substantive section should not
// appear across four or more programmatic pages. This catches template drift.
const reusedSections = [...repeatedSectionBodies.entries()].filter(([, owners]) => owners.length > 1);
for (const [, owners] of reusedSections.filter(([, pageSlugs]) => pageSlugs.length >= 4)) {
  check(false, `Section body reused across ${owners.length} pages: ${owners.slice(0, 5).join(', ')}.`);
}
if (failures.length) {
  console.error('Programmatic SEO content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Programmatic SEO content validation passed: ${pages.length} pages, unique titles/descriptions/H1s/slugs, substantive body and FAQ checks.`);
  if (reusedSections.length) console.log(`Review note: ${reusedSections.length} section bodies are reused across pages; manual editorial review is recommended.`);
}
