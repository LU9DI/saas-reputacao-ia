#!/usr/bin/env node

/**
 * Corrects the initial HTML language attribute of the generated HTML.
 *
 * The root layout uses pt-BR for the shared React tree and a client-side
 * script for localized routes. Crawlers and assistive technology must receive
 * the correct language before JavaScript runs, so this pass rewrites the
 * `<html lang>` attribute in the HTML that will actually be served:
 *
 *   - `CLOUDFLARE_PAGES=1` → the static export in `out/`.
 *   - otherwise (Render / `next start`) → the prerendered HTML in
 *     `.next/server/app/`, which is what the Node server sends on the first
 *     response for statically generated routes such as `/en`, `/es` and `/zh`.
 *
 * Routes whose first path segment is a supported locale get that locale;
 * every other route (pt-BR) keeps the root layout default.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const STATIC_EXPORT = process.env.CLOUDFLARE_PAGES === '1';
const ON_VERCEL = process.env.VERCEL === '1';
const OUT = resolve(process.cwd(), STATIC_EXPORT ? 'out' : join('.next', 'server', 'app'));
const TARGET_LABEL = STATIC_EXPORT ? 'out/' : '.next/server/app/';

// A Vercel embrulha o build em `.vercel/output` e não publica o HTML a partir de
// `.next/server/app`. O passe não se aplica lá (a produção do domínio é o Render,
// que roda `next start` sobre esse diretório).
if (ON_VERCEL && !STATIC_EXPORT) {
  console.log('HTML language pass skipped: Vercel deployment, layout not served from .next/server/app.');
  process.exit(0);
}

if (!statSyncSafe(OUT)) {
  if (STATIC_EXPORT) {
    throw new Error('CLOUDFLARE_PAGES=1 but the static export directory out/ is missing.');
  }
  // Não falhar o build por um layout diferente: o guardrail de produção
  // (verify-production-seo.mjs) é quem reprova idioma errado no domínio público.
  console.log(`${TARGET_LABEL} not found; HTML language pass skipped for this build.`);
  process.exit(0);
}

function statSyncSafe(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function languageForFile(file) {
  const relativePath = relative(OUT, file).split(sep).join('/');
  const firstSegment = relativePath.split('/')[0].replace(/\.html$/i, '');
  return ['en', 'es', 'zh'].includes(firstSegment) ? firstSegment : 'pt-BR';
}

let changed = 0;
let checked = 0;
for (const file of walk(OUT)) {
  const html = readFileSync(file, 'utf8');
  const match = html.match(/<html\b([^>]*)>/i);
  if (!match) throw new Error(`No <html> element found in generated file: ${TARGET_LABEL}${relative(OUT, file).split(sep).join('/')}`);
  const expected = languageForFile(file);
  const attrs = match[1];
  const current = attrs.match(/\blang\s*=\s*(["'])(.*?)\1/i);
  if (current?.[2] === expected) {
    checked += 1;
    continue;
  }
  const nextAttrs = current
    ? attrs.replace(current[0], `lang="${expected}"`)
    : ` lang="${expected}"${attrs}`;
  const patched = html.replace(match[0], `<html${nextAttrs}>`);
  writeFileSync(file, patched);
  changed += 1;
  checked += 1;
}

console.log(`${TARGET_LABEL} HTML language pass: checked ${checked} HTML files; corrected ${changed}.`);
