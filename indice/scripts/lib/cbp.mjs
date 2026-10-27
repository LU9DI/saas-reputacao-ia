// Agregação do County Business Patterns (Census Bureau, EUA). Funções puras, testáveis sem rede.
import { slugify } from './aggregate.mjs';

export const COLUNAS = ['fipstate', 'fipscty', 'naics', 'emp_nf', 'emp', 'est', 'n<5', 'n5_9', 'n10_19', 'n20_49', 'n50_99', 'n100_249', 'n250_499', 'n500_999', 'n1000'];
// Sinalizadores de ruído da coluna emp (G/H/J): emp é aproximado; est e as faixas de porte são contagens.
export const FLAGS_EMP_OK = new Set(['G', 'H', 'J']);
export const ESTADOS_VALIDOS = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]);

/** Divide uma linha CSV do CBP (campos entre aspas ou não, sem vírgula interna). */
export function parseLinhaCbp(linha) {
  if (!linha) return null;
  const t = linha.replace(/\r$/, '');
  if (!t) return null;
  return t.split(',').map((c) => c.replace(/^"|"$/g, ''));
}

/** Mapeia nome da coluna -> posição, ou lança erro se faltar coluna obrigatória. */
export function lerCabecalho(linha) {
  const campos = parseLinhaCbp(linha);
  if (!campos) throw new Error('cabeçalho vazio');
  const idx = {};
  campos.forEach((c, i) => { idx[c.toLowerCase()] = i; });
  const falta = COLUNAS.filter((c) => !(c in idx));
  if (falta.length) throw new Error(`cabeçalho sem as colunas: ${falta.join(', ')}`);
  return idx;
}

const num = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/**
 * @param {{slug:string, naics:string[]}[]} segmentos
 * @param {Record<string, number>} idx resultado de lerCabecalho
 */
export function criarAgregadorCbp(segmentos, idx) {
  const codigoPara = new Map();
  for (const s of segmentos) for (const c of s.naics) {
    if (codigoPara.has(c)) throw new Error(`código NAICS repetido na configuração: ${c}`);
    codigoPara.set(c, s.slug);
  }
  const dados = new Map(); // "SS CCC" -> { [segmento]: { e, emp, empOk, sz } }
  let lidas = 0;
  let usadas = 0;

  function ingerir(campos) {
    lidas += 1;
    if (!campos || campos.length <= idx.n1000) return;
    const seg = codigoPara.get(campos[idx.naics]);
    if (!seg) return;
    const cty = campos[idx.fipscty];
    const st = campos[idx.fipstate];
    if (cty === '999' || st === '00' || !/^\d{2}$/.test(st) || !/^\d{3}$/.test(cty)) return; // total estadual/nacional
    const chave = `${st}${cty}`;
    let porSeg = dados.get(chave);
    if (!porSeg) { porSeg = {}; dados.set(chave, porSeg); }
    const r = porSeg[seg] || (porSeg[seg] = { e: 0, emp: 0, empOk: true, sz: [0, 0, 0, 0, 0, 0] });
    usadas += 1;
    r.e += num(campos[idx.est]);
    r.emp += num(campos[idx.emp]);
    if (!FLAGS_EMP_OK.has(campos[idx.emp_nf])) r.empOk = false;
    r.sz[0] += num(campos[idx['n<5']]);
    r.sz[1] += num(campos[idx.n5_9]);
    r.sz[2] += num(campos[idx.n10_19]);
    r.sz[3] += num(campos[idx.n20_49]);
    r.sz[4] += num(campos[idx.n50_99]);
    r.sz[5] += num(campos[idx.n100_249]) + num(campos[idx.n250_499]) + num(campos[idx.n500_999]) + num(campos[idx.n1000]);
  }
  return { ingerir, dados, contagem: () => ({ lidas, usadas }) };
}

/** Lê national_county2020.txt (STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|...). */
export function condadosDeTxt(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const cab = linhas[0].split('|');
  const iSt = cab.indexOf('STATE');
  const iSf = cab.indexOf('STATEFP');
  const iCf = cab.indexOf('COUNTYFP');
  const iNome = cab.indexOf('COUNTYNAME');
  if ([iSt, iSf, iCf, iNome].some((i) => i < 0)) throw new Error('arquivo de condados sem as colunas esperadas');
  return linhas.slice(1).map((l) => {
    const c = l.split('|');
    return { state: c[iSt], stateFp: c[iSf], fips: c[iCf], nome: c[iNome] };
  }).filter((c) => c.state && c.fips && c.nome);
}

/** Casa os códigos FIPS dos dados com nomes e gera slugs únicos por estado. */
export function resolverCondados(chaves, condados) {
  const porFips = new Map(condados.map((c) => [`${c.stateFp}${c.fips}`, c]));
  const usados = new Set();
  const saida = [];
  for (const chave of [...chaves].sort()) {
    const c = porFips.get(chave);
    if (!c || !ESTADOS_VALIDOS.has(c.state)) continue;
    let slug = slugify(c.nome);
    if (usados.has(`${c.state}/${slug}`)) slug = `${slug}-${c.fips}`;
    usados.add(`${c.state}/${slug}`);
    saida.push({ chave, state: c.state, slug, nome: c.nome });
  }
  return saida;
}
