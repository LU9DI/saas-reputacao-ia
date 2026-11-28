#!/usr/bin/env node
// Ingestão do UK Business Counts (ONS, via Nomis API, dataset NM_141_1 = local units) -> data-uk/
//   node scripts/ingest-uk.mjs [--out=DIR] [--min=10] [--min-autoridades=25]
// API pública, sem chave. Uma requisição por autoridade local (todas as classes SIC de 5 dígitos x faixas de tamanho).
// Guarda só contagens agregadas por autoridade e categoria. Licença: Open Government Licence v3.0.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, montarAutoridades, agregarAutoridade, urlAutoridades, urlAutoridade, DATASET, UNIDADE } from './lib/nomis.mjs';
import { validarDestino } from './lib/output-dir.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = validarDestino(path.resolve(args.out || path.join(raiz, 'data-uk')), raiz, 'dados');
const MIN = Number(args.min || 10);
const MIN_AUTORIDADES = Number(args['min-autoridades'] || 25);
const PREFIXO = { E: 'england', S: 'scotland', W: 'wales', N: 'northern-ireland' };
const log = (...a) => console.log('[ingest-uk]', ...a);
const falha = (m) => { console.error(`[ingest-uk] ERRO: ${m}`); process.exit(1); };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixar(url, tentativas = 5) {
  let erro;
  for (let i = 1; i <= tentativas; i += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'FiltraAI-Index/1.0 (+https://filtraai.com/indice/uk)' } });
      if (r.ok) return await r.text();
      erro = `HTTP ${r.status}`;
    } catch (e) { erro = e.message; }
    await dormir(1500 * i);
  }
  throw new Error(`${erro} em ${url.slice(0, 160)}`);
}

const segmentos = JSON.parse(await readFile(path.join(raiz, 'config', 'segments-uk.json'), 'utf8'));

// 1) Lista de autoridades (distritos e unitárias) com o total geral, para obter códigos, nomes e o ano.
log('lendo lista de autoridades locais');
const listaCsv = parseCsv(await baixar(urlAutoridades()));
if (listaCsv.length < 300) falha(`só ${listaCsv.length} autoridades retornadas (esperado ~360).`);
const ano = listaCsv[0].date_name;
if (!/^\d{4}$/.test(ano)) falha(`ano inválido: ${ano}`);
const autoridades = montarAutoridades(listaCsv.map((l) => ({ codigo: l.geography_code, nome: l.geography_name })), (c) => PREFIXO[c.charAt(0)]);
log(`ano ${ano}, ${autoridades.length} autoridades`);

// 2) Uma requisição por autoridade, com 3 em paralelo.
const porNacao = {};
const vistos = new Set();
let linhasLidas = 0;
let feitas = 0;
async function processar(a) {
  const url = urlAutoridade(a.codigo);
  const linhas = parseCsv(await baixar(url));
  if (linhas.length < 500) throw new Error(`${a.codigo}: só ${linhas.length} linhas`);
  linhasLidas += linhas.length;
  const cel = agregarAutoridade(linhas, segmentos, vistos);
  (porNacao[a.nation] ||= {})[a.slug] = cel;
  feitas += 1;
  if (feitas % 40 === 0) log(`${feitas}/${autoridades.length}`);
}
const fila = [...autoridades];
await Promise.all(Array.from({ length: 3 }, async () => { for (let a = fila.shift(); a; a = fila.shift()) await processar(a); }));

// 3) Descarta categorias raras e células abaixo do mínimo; só guarda o que será publicado.
const condados = new Map();
for (const seg of segmentos) {
  let n = 0;
  for (const por of Object.values(porNacao)) for (const cel of Object.values(por)) if (typeof cel[seg.slug]?.e === 'number' && cel[seg.slug].e >= MIN) n += 1;
  condados.set(seg.slug, n);
}
const mantidos = segmentos.filter((s) => condados.get(s.slug) >= MIN_AUTORIDADES);
const descartados = segmentos.filter((s) => !mantidos.includes(s)).map((s) => `${s.slug}(${condados.get(s.slug)})`);
const naoVistos = segmentos.flatMap((s) => s.sic).filter((c) => !vistos.has(c));
if (naoVistos.length) log(`AVISO: códigos SIC ausentes no dataset: ${naoVistos.join(', ')}`);
if (descartados.length) log(`categorias descartadas (<${MIN_AUTORIDADES} autoridades com >=${MIN}): ${descartados.join(', ')}`);

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'stats'), { recursive: true });
const publicadas = [];
let celulas = 0;
for (const [nacao, por] of Object.entries(porNacao)) {
  const saida = {};
  for (const [slug, cel] of Object.entries(por)) {
    const reg = {};
    for (const seg of mantidos) if (typeof cel[seg.slug]?.e === 'number' && cel[seg.slug].e >= MIN) { reg[seg.slug] = cel[seg.slug]; celulas += 1; }
    if (Object.keys(reg).length) {
      saida[slug] = reg;
      const auth = autoridades.find((a) => a.nation === nacao && a.slug === slug);
      if (auth) publicadas.push(auth);
    }
  }
  await writeFile(path.join(OUT, 'stats', `${nacao}.json`), JSON.stringify(saida));
}
await writeFile(path.join(OUT, 'authorities.json'), JSON.stringify(publicadas));
await writeFile(path.join(OUT, 'meta.json'), JSON.stringify({
  ano,
  geradoEm: new Date().toISOString(),
  fonte: { nome: 'UK Business Counts — local units, Office for National Statistics (via Nomis). Open Government Licence v3.0', url: 'https://www.ons.gov.uk/businessindustryandtrade/business/activitysizeandlocation' },
  serie: DATASET,
  unidade: UNIDADE,
  metodologia: 'Local units (workplaces) are counted in March, not enterprises. Counts are rounded by the ONS; size bands are not used to infer missing values.',
  minimoParaIndexar: MIN,
  segmentos: mantidos.map(({ slug, nome, curto, sic }) => ({ slug, nome, curto, sic })),
  linhasLidas,
}, null, 1));
const nac = Object.keys(porNacao).length;
if (nac < 4) falha(`só ${nac} nações com dados.`);
log(`categorias mantidas: ${mantidos.length}/${segmentos.length} | autoridades publicadas: ${publicadas.length} | células autoridade×categoria publicáveis: ${celulas}`);
log(`URLs previstas ≈ ${celulas + publicadas.length + 4 + 2}`);
