#!/usr/bin/env node
// Exporta as URLs dos EUA ou do Reino Unido (--base=us|uk) em blocos de 50.000 (limite do Google por sitemap), SEM repetir.
//   node scripts/export-urls-gsc.mjs [--base=us|uk] [--bloco=50000] [--out=DIR] [--baseline=REF_GIT] [--dados=DIR]
// --baseline=origin/main  => exporta só as URLs que NÃO existem nos dados desse ref (as "novas").
// Saída: urls-us-001.txt, urls-us-002.txt ... (uma URL por linha; formato "sitemap em texto" aceito pelo Google)
// e RESUMO.txt. Não faz rede e não publica nada. O Google só lê sitemaps que estejam num endereço do site:
// para usar no GSC, sirva os arquivos no domínio ou envie o sitemap-index do Índice (que já inclui as novas).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, caminhosUS, caminhosUK, lerEstadosUS } from './lib/static-sitemaps.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGIAO = args.base === 'uk' ? 'uk' : 'us';
const BLOCO = Number(args.bloco || 50000);
const OUT = path.resolve(args.out || path.join(raiz, '.gsc-export'));
if (!Number.isInteger(BLOCO) || BLOCO < 1 || BLOCO > 50000) throw new Error('--bloco deve estar entre 1 e 50000');
const estados = REGIAO === 'us' ? lerEstadosUS(readFileSync(path.join(raiz, 'src/lib/us-states.ts'), 'utf8')) : null;

function caminhosDe(dir) {
  if (REGIAO === 'uk') {
    const metaUK = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    const authorities = JSON.parse(readFileSync(path.join(dir, 'authorities.json'), 'utf8'));
    const statsUK = {};
    for (const f of readdirSync(path.join(dir, 'stats')).filter((x) => /^[a-z-]+\.json$/.test(x))) statsUK[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(path.join(dir, 'stats', f), 'utf8'));
    return caminhosUK({ meta: metaUK, authorities, stats: statsUK });
  }
  const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const counties = JSON.parse(readFileSync(path.join(dir, 'counties.json'), 'utf8'));
  const stats = {};
  for (const f of readdirSync(path.join(dir, 'stats')).filter((x) => /^[A-Z]{2}\.json$/.test(x))) stats[f.slice(0, 2)] = JSON.parse(readFileSync(path.join(dir, 'stats', f), 'utf8'));
  return caminhosUS({ meta, counties, stats, estados });
}

const dirAtual = path.resolve(args.dados || path.join(raiz, `data-${REGIAO}`));
const todas = caminhosDe(dirAtual);
let excluir = new Set();
if (args.baseline) {
  const tmp = path.join(os.tmpdir(), `gsc-base-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  try {
    const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: raiz }).toString().trim();
    try {
      const tar = execFileSync('git', ['archive', args.baseline, `indice/data-${REGIAO}`], { cwd: repo, maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] });
      execFileSync('tar', ['-x', '-C', tmp], { input: tar });
      excluir = new Set(caminhosDe(path.join(tmp, 'indice', `data-${REGIAO}`)));
    } catch {
      // O baseline não tem esta base ainda (ex.: UK antes do primeiro merge): nada a excluir.
      excluir = new Set();
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
const unicas = [...new Set(todas)].filter((p) => !excluir.has(p));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const urls = unicas.map((p) => `${BASE}${p}`);
const arquivos = [];
for (let i = 0, n = 1; i < urls.length; i += BLOCO, n += 1) {
  const nome = `urls-${REGIAO}-${String(n).padStart(3, '0')}.txt`;
  writeFileSync(path.join(OUT, nome), `${urls.slice(i, i + BLOCO).join('\n')}\n`);
  arquivos.push([nome, Math.min(BLOCO, urls.length - i)]);
}
const resumo = [`URLs (${REGIAO.toUpperCase()}) no total (dados atuais): ${new Set(todas).size}`, `Excluídas por já existirem em ${args.baseline || '(sem baseline)'}: ${new Set(todas).size - unicas.length}`, `URLs exportadas (únicas): ${unicas.length}`, `Blocos de até ${BLOCO}: ${arquivos.length}`, ...arquivos.map(([n, q]) => `  ${n}: ${q}`)].join('\n');
writeFileSync(path.join(OUT, 'RESUMO.txt'), `${resumo}\n`);
console.log(resumo);
