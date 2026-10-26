#!/usr/bin/env node
// Trava do build: o app não publica páginas sem dados reais e coerentes.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));
const erro = (m) => {
  console.error(`\n[check-data] ${m}\n`);
  console.error('Gere os dados com `npm run ingest` (ou pelo workflow "Índice: atualizar dados") e tente de novo.');
  process.exit(1);
};

if (!existsSync(path.join(dir, 'meta.json'))) erro(`Dados não encontrados em ${dir} (falta meta.json).`);
const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'));
if (!/^\d{4}-\d{2}$/.test(meta.competencia || '')) erro('meta.json sem competência válida.');
if (meta.sintetico && process.env.INDICE_ALLOW_SAMPLE !== '1') {
  erro('Os dados são SINTÉTICOS (amostra de desenvolvimento) e não podem ser publicados. Use INDICE_ALLOW_SAMPLE=1 apenas em ambiente local.');
}
for (const arq of ['municipios.json', 'subclasses.json']) {
  if (!existsSync(path.join(dir, arq))) erro(`Arquivo ausente: ${arq}`);
}
const statsDir = path.join(dir, 'stats');
const ufs = existsSync(statsDir) ? readdirSync(statsDir).filter((f) => f.endsWith('.json')) : [];
if (!meta.sintetico && ufs.length < 20) erro(`Só ${ufs.length} UFs em stats/ (esperado ~27). A ingestão parece incompleta.`);
if (ufs.length < 1) erro('stats/ vazio.');
// Dados dos EUA (piloto em inglês)
const dirUs = path.resolve(process.env.INDICE_US_DATA_DIR || path.join(raiz, 'data-us'));
if (!existsSync(path.join(dirUs, 'meta.json'))) erro(`Dados dos EUA não encontrados em ${dirUs} (falta meta.json). Rode scripts/ingest-us.mjs.`);
const metaUs = JSON.parse(readFileSync(path.join(dirUs, 'meta.json'), 'utf8'));
if (metaUs.synthetic && process.env.INDICE_ALLOW_SAMPLE !== '1') erro('Os dados dos EUA são SINTÉTICOS e não podem ser publicados.');
const ufsUs = existsSync(path.join(dirUs, 'stats')) ? readdirSync(path.join(dirUs, 'stats')).filter((f) => f.endsWith('.json')) : [];
if (!metaUs.synthetic && ufsUs.length < 45) erro(`Só ${ufsUs.length} estados em data-us/stats (esperado 51).`);
console.log(`[check-data] EUA ok: ano ${metaUs.year}, ${ufsUs.length} estados${metaUs.synthetic ? ' (SINTÉTICO, só local)' : ''}.`);
console.log(`[check-data] ok: competência ${meta.competencia}, ${ufs.length} UFs${meta.sintetico ? ' (SINTÉTICO, só local)' : ''}.`);
