#!/usr/bin/env node
// Gera uma amostra SINTÉTICA em data.sample/ para desenvolver e testar a interface localmente.
// Os nomes de municípios são reais; TODOS os números são aleatórios e a saída é marcada com
// `sintetico: true`. O app exibe um aviso, usa noindex e o build de produção recusa esses dados.
//
//   node scripts/make-sample.mjs && INDICE_DATA_DIR=data.sample INDICE_ALLOW_SAMPLE=1 npm run dev

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTAL_COLUNAS, COL } from './lib/aggregate.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(raiz, '.tmp', 'sample');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });

let semente = 20261025;
const rnd = () => {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
};

const municipios = [
  { cod: '0001', uf: 'GO', receita: 'GOIANIA', ibge: 'Goiânia', id: 5208707, f: 1.0 },
  { cod: '0002', uf: 'GO', receita: 'ANAPOLIS', ibge: 'Anápolis', id: 5201108, f: 0.35 },
  { cod: '0003', uf: 'GO', receita: 'APARECIDA DE GOIANIA', ibge: 'Aparecida de Goiânia', id: 5201405, f: 0.4 },
  { cod: '0004', uf: 'GO', receita: 'RIO VERDE', ibge: 'Rio Verde', id: 5218805, f: 0.2 },
  { cod: '0005', uf: 'GO', receita: 'JATAI', ibge: 'Jataí', id: 5211909, f: 0.08 },
  { cod: '0006', uf: 'SP', receita: 'SAO PAULO', ibge: 'São Paulo', id: 3550308, f: 4.0 },
  { cod: '0007', uf: 'SP', receita: 'CAMPINAS', ibge: 'Campinas', id: 3509502, f: 0.7 },
  { cod: '0008', uf: 'MG', receita: 'BELO HORIZONTE', ibge: 'Belo Horizonte', id: 3106200, f: 1.4 },
  { cod: '0009', uf: 'MG', receita: 'UBERLANDIA', ibge: 'Uberlândia', id: 3170206, f: 0.45 },
  { cod: '0010', uf: 'RJ', receita: 'RIO DE JANEIRO', ibge: 'Rio de Janeiro', id: 3304557, f: 2.6 },
  { cod: '0011', uf: 'PR', receita: 'CURITIBA', ibge: 'Curitiba', id: 4106902, f: 1.2 },
  { cod: '0012', uf: 'GO', receita: 'MUNICIPIO MINUSCULO', ibge: 'Município Minúsculo', id: 5299999, f: 0.012 },
];
const segmentos = [
  { classe: '5611', peso: 300, subs: ['5611201', '5611203', '5611204', '5611205'] },
  { classe: '5510', peso: 30, subs: ['5510801', '5510802', '5510803'] },
  { classe: '8630', peso: 120, subs: ['8630501', '8630503', '8630504'] },
  { classe: '8650', peso: 90, subs: ['8650001', '8650002', '8650003'] },
  { classe: '9602', peso: 160, subs: ['9602501', '9602502'] },
  { classe: '9313', peso: 40, subs: ['9313100'] },
  { classe: '4771', peso: 90, subs: ['4771701', '4771702', '4771703', '4771704'] },
  { classe: '4520', peso: 110, subs: ['4520001', '4520002', '4520003'] },
  { classe: '4711', peso: 140, subs: ['4711301', '4711302'] },
];

const pad = (n) => String(n).padStart(2, '0');
const data = (a, m, d) => `${a}${pad(m)}${pad(d)}`;
function dataAleatoria(anoMin, anoMax) {
  const a = anoMin + Math.floor(rnd() * (anoMax - anoMin + 1));
  const mesMax = a === 2026 ? 9 : 12;
  return data(a, 1 + Math.floor(rnd() * mesMax), 1 + Math.floor(rnd() * 28));
}

const linhas = [];
for (const m of municipios) {
  for (const s of segmentos) {
    const n = Math.round(s.peso * m.f * (0.7 + rnd() * 0.6));
    for (let i = 0; i < n; i += 1) {
      const c = new Array(TOTAL_COLUNAS).fill('');
      const r = rnd();
      const situacao = r < 0.78 ? '02' : r < 0.95 ? '08' : r < 0.98 ? '04' : '03';
      const inicio = dataAleatoria(2012, 2026);
      c[0] = String(10000000 + linhas.length);
      c[1] = '0001';
      c[2] = '00';
      c[COL.MATRIZ_FILIAL] = rnd() < 0.85 ? '1' : '2';
      c[COL.SITUACAO] = situacao;
      c[COL.DATA_SITUACAO] = situacao === '02' ? inicio : dataAleatoria(Math.max(2012, Number(inicio.slice(0, 4))), 2026);
      c[COL.DATA_INICIO] = inicio;
      c[COL.CNAE_PRINCIPAL] = s.subs[Math.floor(rnd() * s.subs.length)];
      c[COL.UF] = m.uf;
      c[COL.MUNICIPIO] = m.cod;
      linhas.push(`"${c.join('";"')}"`);
    }
  }
}
await writeFile(path.join(dir, 'Estabelecimentos0.csv'), linhas.join('\n') + '\n', 'latin1');
await writeFile(
  path.join(dir, 'Municipios.csv'),
  municipios.map((m) => `"${m.cod}";"${m.receita}"`).join('\n') + '\n',
  'latin1',
);
await writeFile(
  path.join(dir, 'Cnaes.csv'),
  segmentos.flatMap((s) => s.subs.map((c) => `"${c}";"[SINTETICO] subclasse ${c}"`)).join('\n') + '\n',
  'latin1',
);
await writeFile(
  path.join(dir, 'ibge.json'),
  JSON.stringify(municipios.map((m) => ({ id: m.id, nome: m.ibge, microrregiao: { mesorregiao: { UF: { sigla: m.uf } } } }))),
);

for (const [csv, zip] of [
  ['Estabelecimentos0.csv', 'Estabelecimentos0.zip'],
  ['Municipios.csv', 'Municipios.zip'],
  ['Cnaes.csv', 'Cnaes.zip'],
]) {
  const r = spawnSync('zip', ['-j', '-q', path.join(dir, zip), path.join(dir, csv)]);
  if (r.status !== 0) throw new Error(`zip falhou para ${csv}: ${r.stderr}`);
}

const ing = spawnSync(
  process.execPath,
  [
    path.join(raiz, 'scripts', 'ingest.mjs'),
    `--local=${dir}`,
    '--competencia=2026-10',
    `--ibge-arquivo=${path.join(dir, 'ibge.json')}`,
    `--out=${path.join(raiz, 'data.sample')}`,
    '--sintetico',
    '--min=10',
  ],
  { stdio: 'inherit' },
);
process.exit(ing.status ?? 1);
