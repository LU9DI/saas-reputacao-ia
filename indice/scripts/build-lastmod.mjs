// Gera data/lastmod.json a partir de data/stats/*.json já existentes.
// Uso: node scripts/build-lastmod.mjs [--data data] [--hoje AAAA-MM-DD]
// Preserva as datas do lastmod.json anterior para páginas cujo conteúdo não mudou.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { calcularLastmod } from './lib/lastmod.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const DATA = path.resolve(arg('data', 'data'));
const meta = JSON.parse(readFileSync(path.join(DATA, 'meta.json'), 'utf8'));
const hoje = arg('hoje', meta.geradoEm.slice(0, 10));
const stats = {};
for (const f of readdirSync(path.join(DATA, 'stats'))) {
  if (f.endsWith('.json')) stats[f.replace('.json', '')] = JSON.parse(readFileSync(path.join(DATA, 'stats', f), 'utf8'));
}
const arq = path.join(DATA, 'lastmod.json');
const previo = existsSync(arq) ? JSON.parse(readFileSync(arq, 'utf8')) : {};
const saida = calcularLastmod(stats, previo, hoje);
writeFileSync(arq, JSON.stringify(saida));
console.log(`lastmod.json: ${Object.keys(saida).length} páginas`);
