#!/usr/bin/env node
// Amostra SINTÉTICA no formato do cbp23co.txt, só para desenvolver a interface dos EUA.
// Nomes de condados são reais; TODOS os números são aleatórios; a saída é marcada `sintetico: true`.
//   node scripts/make-sample-us.mjs && INDICE_US_DATA_DIR=data-us.sample INDICE_ALLOW_SAMPLE=1 npm run dev
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(raiz, '.tmp', 'sample-us');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
let semente = 20261026;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) % 4294967296) / 4294967296);

const condados = [
  ['CO', '08', '031', 'Denver County', 1.0], ['CO', '08', '001', 'Adams County', 0.45], ['CO', '08', '005', 'Arapahoe County', 0.6], ['CO', '08', '113', 'San Miguel County', 0.02],
  ['CA', '06', '037', 'Los Angeles County', 8.0], ['CA', '06', '075', 'San Francisco County', 0.9], ['CA', '06', '003', 'Alpine County', 0.003],
  ['NY', '36', '061', 'New York County', 2.5], ['NY', '36', '047', 'Kings County', 1.8],
  ['TX', '48', '201', 'Harris County', 3.2], ['TX', '48', '113', 'Dallas County', 2.6], ['TX', '48', '301', 'Loving County', 0.001],
  ['MO', '29', '510', 'St. Louis city', 0.5], ['MO', '29', '189', 'St. Louis County', 0.9],
  ['FL', '12', '086', 'Miami-Dade County', 2.4],
];
const seg = [['7225//', 700], ['7224//', 60], ['7211//', 40], ['6211//', 300], ['6212//', 180], ['6213//', 200], ['81211/', 250], ['713940', 60], ['446110', 70], ['8111//', 140], ['445110', 60]];
const linhas = ['"fipstate","fipscty","naics","emp_nf","emp","qp1_nf","qp1","ap_nf","ap","est","n<5","n5_9","n10_19","n20_49","n50_99","n100_249","n250_499","n500_999","n1000","n1000_1","n1000_2","n1000_3","n1000_4"'];
for (const [, st, cty, , f] of condados) {
  for (const [code, peso] of seg) {
    const est = Math.round(peso * f * (0.7 + rnd() * 0.6));
    if (est < 1) continue;
    const p = [0.55, 0.2, 0.12, 0.08, 0.03, 0.02].map((x) => Math.round(est * x));
    const emp = Math.round(est * (6 + rnd() * 10));
    linhas.push(`"${st}","${cty}","${code}","${rnd() < 0.9 ? 'G' : 'H'}",${emp},"G",1,"G",1,${est},${p[0]},${p[1]},${p[2]},${p[3]},${p[4]},${p[5]},0,0,0,"N","N","N","N"`);
  }
  linhas.push(`"${st}","${cty}","------","G",1000,"G",1,"G",1,100,50,20,10,10,5,5,0,0,0,"N","N","N","N"`);
}
linhas.push('"08","999","7225//","G",1,"G",1,"G",1,1,1,0,0,0,0,0,0,0,0,"N","N","N","N"');
await writeFile(path.join(dir, 'cbp23co.txt'), linhas.join('\n') + '\n');
await writeFile(
  path.join(dir, 'national_county2020.txt'),
  'STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT\n' + condados.map(([s, st, c, n]) => `${s}|${st}|${c}|0|${n}|H1|A`).join('\n') + '\n',
);
const z = spawnSync('zip', ['-j', '-q', path.join(dir, 'cbp23co.zip'), path.join(dir, 'cbp23co.txt')]);
if (z.status !== 0) throw new Error('zip falhou');
const r = spawnSync(process.execPath, [path.join(raiz, 'scripts', 'ingest-us.mjs'), `--local=${path.join(dir, 'cbp23co.zip')}`, `--condados=${path.join(dir, 'national_county2020.txt')}`, '--ano=2023', `--out=${path.join(raiz, 'data-us.sample')}`, '--sintetico', '--min=10'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
