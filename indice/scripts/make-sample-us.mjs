#!/usr/bin/env node
// Amostra SINTÉTICA do CBP para testar pipeline e interface. Nomes de condados são reais; TODOS os números são aleatórios.
//   node scripts/make-sample-us.mjs && INDICE_US_DATA_DIR=data-us.sample INDICE_ALLOW_SAMPLE=1 npm run dev
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(raiz, '.tmp', 'sample-us');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
let seed = 20261026;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const condados = [
  ['13', '121', 'Fulton County', 1.0], ['13', '135', 'Gwinnett County', 0.7], ['13', '011', 'Banks County', 0.02],
  ['06', '037', 'Los Angeles County', 4.0], ['06', '075', 'San Francisco County', 0.9], ['36', '061', 'New York County', 2.2],
  ['48', '201', 'Harris County', 2.5], ['17', '031', 'Cook County', 2.8], ['12', '086', 'Miami-Dade County', 1.8],
  ['11', '001', 'District of Columbia', 0.6], ['51', '760', 'Richmond city', 0.15], ['51', '159', 'Richmond County', 0.02],
];
const codigos = [['7225//', 500], ['7211//', 40], ['6211//', 300], ['6212//', 150], ['6213//', 120], ['8121//', 280], ['713940', 50], ['4561//', 70], ['8111//', 160], ['4451//', 90], ['------', 9000], ['72////', 600], ['722511', 200]];
const cab = 'fipstate,fipscty,naics,empflag,emp_nf,emp,qp1_nf,qp1,ap_nf,ap,est,n<5,n5_9,n10_19,n20_49,n50_99,n100_249,n250_499,n500_999,n1000';
const linhas = [cab];
for (const [fe, fc, , f] of condados) for (const [n, peso] of codigos) {
  const est = Math.round(peso * f * (0.7 + rnd() * 0.6));
  if (est < 1) continue;
  const a = Math.round(est * 0.5), b = Math.round(est * 0.2), c = Math.round(est * 0.15), d = Math.round(est * 0.1);
  const resto = Math.max(0, est - a - b - c - d);
  linhas.push([fe, fc, n, '', 'G', est * 8, 'G', est * 100, 'G', est * 400, est, a, b, c, d, resto, 0, 0, 0, 0].join(','));
}
await writeFile(path.join(dir, 'cbp23co.csv'), linhas.join('\n') + '\n');
await writeFile(path.join(dir, 'counties.txt'), 'STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT\n' + condados.map(([fe, fc, nome]) => `XX|${fe}|${fc}|0|${nome}|H1|A`).join('\n') + '\n');
const z = spawnSync('zip', ['-j', '-q', path.join(dir, 'cbp23co.zip'), path.join(dir, 'cbp23co.csv')]);
if (z.status !== 0) throw new Error('zip falhou');
const r = spawnSync(process.execPath, [path.join(raiz, 'scripts', 'ingest-us.mjs'), `--local=${dir}`, `--out=${path.join(raiz, 'data-us.sample')}`, '--sintetico', '--min=10'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
