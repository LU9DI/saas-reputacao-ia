#!/usr/bin/env node

/**
 * Audita title e meta description do export estático.
 *
 * Motivo (Search Console): descriptions duplicadas em massa e títulos repetidos
 * fazem o Google reescrever snippets e diluem a página. Este guardrail impede
 * regressão depois do build.
 *
 * Regras:
 * - cada URL do sitemap precisa de HTML, <title> e meta description;
 * - description entre 50 e 170 caracteres;
 * - nenhuma description ou title repetido entre URLs diferentes.
 *
 * Sem dependências: roda no CI antes do deploy.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const OUT = resolve(process.cwd(), 'out');
const SITEMAP = join(OUT, 'sitemap.xml');
const MIN_DESCRIPTION = 50;
const MAX_DESCRIPTION = 170;

const failures = [];
const fail = (message) => failures.push(message);

function htmlCandidates(pathname) {
  if (pathname === '/') return [join(OUT, 'index.html')];
  const safe = pathname.replace(/^\/+/, '');
  return [join(OUT, `${safe}.html`), join(OUT, safe, 'index.html'), join(OUT, safe)].filter((candidate) => {
    const absolute = resolve(candidate);
    return absolute === OUT || absolute.startsWith(OUT + sep);
  });
}

function findHtml(pathname) {
  return htmlCandidates(pathname).find((candidate) => existsSync(candidate));
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function metaContent(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([\\s\\S]*?)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]).trim();
  }
  return '';
}

if (!existsSync(SITEMAP)) {
  console.error('Meta audit FAILED: out/sitemap.xml is missing. Run the build first.');
  process.exit(1);
}

const sitemap = readFileSync(SITEMAP, 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].replaceAll('&amp;', '&'));
if (!urls.length) {
  console.error('Meta audit FAILED: sitemap contains no URLs.');
  process.exit(1);
}

const descriptions = new Map();
const titles = new Map();
let checked = 0;

for (const raw of urls) {
  let pathname;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    fail(`URL inválida no sitemap: ${raw}`);
    continue;
  }

  const file = findHtml(pathname);
  if (!file) {
    fail(`sem HTML exportado: ${pathname}`);
    continue;
  }
  checked += 1;

  const html = readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : '';
  const description = metaContent(html, 'description');

  if (!title) fail(`sem <title>: ${pathname}`);
  if (!description) fail(`sem meta description: ${pathname}`);
  if (description && description.length < MIN_DESCRIPTION) {
    fail(`description curta (${description.length}): ${pathname}`);
  }
  if (description && description.length > MAX_DESCRIPTION) {
    fail(`description longa (${description.length}): ${pathname}`);
  }

  if (title) {
    const key = title.toLowerCase();
    if (titles.has(key)) fail(`title repetido: ${titles.get(key)} e ${pathname} — "${title}"`);
    else titles.set(key, pathname);
  }
  if (description) {
    const key = description.toLowerCase();
    if (descriptions.has(key)) {
      fail(`description repetida: ${descriptions.get(key)} e ${pathname}`);
    } else {
      descriptions.set(key, pathname);
    }
  }
}

if (failures.length) {
  console.error(`Meta audit FAILED (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `Meta audit PASSED: ${checked} URLs, descriptions únicas entre ${MIN_DESCRIPTION} e ${MAX_DESCRIPTION} caracteres, títulos únicos.`,
);
