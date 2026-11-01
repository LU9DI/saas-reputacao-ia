#!/usr/bin/env node
/**
 * Publica os shards do Índice na raiz estática do frontend.
 * Só roda no build Cloudflare Pages; runtime builds não precisam desta cópia.
 * A fonte de verdade continua sendo indice/data + build-static-sitemaps.mjs.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

if (process.env.CLOUDFLARE_PAGES !== '1') {
  console.log('[seo-sitemaps] skipped: not a Cloudflare Pages build.');
  process.exit(0);
}

const frontend = process.cwd();
const repoRoot = resolve(frontend, '..');
const generator = resolve(repoRoot, 'indice/scripts/build-static-sitemaps.mjs');
const data = resolve(repoRoot, 'indice/data/meta.json');
const publicDir = resolve(frontend, 'public');
const temp = resolve(tmpdir(), `filtra-indice-sitemaps-${process.pid}`);

if (!existsSync(generator) || !existsSync(data)) {
  throw new Error('Cloudflare Pages build requires indice/scripts/build-static-sitemaps.mjs and indice/data/meta.json.');
}

try {
  execFileSync(process.execPath, [generator, `--out=${temp}`], { cwd: resolve(repoRoot, 'indice'), stdio: 'inherit' });
  const files = readdirSync(temp).filter((name) => /^sitemap-\\d+\\.xml$/.test(name));
  if (!files.length) throw new Error('Índice sitemap generator produced no shards.');
  for (const name of readdirSync(publicDir)) {
    if (/^sitemap-indice-\\d+\\.xml$/.test(name)) rmSync(join(publicDir, name), { force: true });
  }
  for (const name of files) {
    const id = name.match(/^sitemap-(\\d+)\\.xml$/)[1];
    copyFileSync(join(temp, name), join(publicDir, `sitemap-indice-${id}.xml`));
  }
  console.log(`[seo-sitemaps] published ${files.length} root-level static shards.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
