#!/usr/bin/env node
// Amostra SINTÉTICA para desenvolver a interface do UK. Nomes reais, números aleatórios, `sintetico: true`.
//   node scripts/make-sample-uk.mjs && INDICE_UK_DATA_DIR=data-uk.sample INDICE_ALLOW_SAMPLE=1 npm run dev
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(raiz, 'data-uk.sample');
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'stats'), { recursive: true });
let semente = 20261119;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) % 4294967296) / 4294967296);
const segs = JSON.parse(await readFile(path.join(raiz, 'config', 'segments-uk.json'), 'utf8')).slice(0, 12);
const auth = [
  ['england', 'leeds', 'Leeds', 'E08000035', 3], ['england', 'bristol-city-of', 'Bristol, City of', 'E06000023', 2.4], ['england', 'hartlepool', 'Hartlepool', 'E06000001', 0.5],
  ['scotland', 'glasgow-city', 'Glasgow City', 'S12000049', 2.2], ['scotland', 'orkney-islands', 'Orkney Islands', 'S12000023', 0.1],
  ['wales', 'cardiff', 'Cardiff', 'W06000015', 1.5], ['wales', 'gwynedd', 'Gwynedd', 'W06000002', 0.4],
  ['northern-ireland', 'belfast', 'Belfast', 'N09000003', 1.6], ['northern-ireland', 'derry-city-and-strabane', 'Derry City and Strabane', 'N09000005', 0.7],
];
const stats = {};
for (const [n, slug, , , f] of auth) {
  const cel = {};
  for (const s of segs) {
    const e = Math.round((20 + rnd() * 200) * f / 5) * 5;
    if (e < 10) continue;
    const sz = [0.62, 0.18, 0.1, 0.06, 0.03, 0.01].map((x) => Math.round((e * x) / 5) * 5);
    cel[s.slug] = { e, sz };
  }
  (stats[n] ||= {})[slug] = cel;
}
for (const [n, v] of Object.entries(stats)) await writeFile(path.join(out, 'stats', `${n}.json`), JSON.stringify(v));
await writeFile(path.join(out, 'authorities.json'), JSON.stringify(auth.map(([nation, slug, nome, codigo]) => ({ nation, slug, nome, codigo }))));
await writeFile(path.join(out, 'meta.json'), JSON.stringify({
  ano: '2026', geradoEm: new Date().toISOString(), sintetico: true,
  fonte: { nome: 'UK Business Counts, ONS (SYNTHETIC SAMPLE)', url: 'https://www.ons.gov.uk/businessindustryandtrade/business/activitysizeandlocation' },
  minimoParaIndexar: 10, segmentos: segs.map(({ slug, nome, curto, sic }) => ({ slug, nome, curto, sic })),
}, null, 1));
console.log('[make-sample-uk] ok ->', out);
