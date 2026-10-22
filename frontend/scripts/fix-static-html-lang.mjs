#!/usr/bin/env node

/**
 * Corrects the initial HTML language attribute in Next.js static exports.
 *
 * The root layout uses pt-BR for the shared React tree and a client-side
 * script for localized routes. For Cloudflare's static export, fix the
 * generated HTML itself so crawlers and assistive technology receive the
 * correct language before JavaScript runs. This is a no-op in Vercel mode.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const OUT = resolve(process.cwd(), 'out');
if (!statSyncSafe(OUT)) {
  console.log('Static HTML language pass skipped: no out/ directory (non-export build).');
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
  if (!match) throw new Error(`No <html> element found in exported file: ${relative(OUT, file)}`);
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

console.log(`Static HTML language pass: checked ${checked} HTML files; corrected ${changed}.`);
