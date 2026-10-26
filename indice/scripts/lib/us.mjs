// Agregação do County Business Patterns (Census Bureau). Funções puras, testáveis com dados sintéticos.
import { readFileSync } from 'node:fs';

const US_STATES = JSON.parse(readFileSync(new URL('../../config/us-states.json', import.meta.url), 'utf8'));

export const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Linha CSV simples (vírgula, aspas opcionais). */
export function linhaCsv(l) {
  const out = [];
  let atual = '';
  let aspas = false;
  for (const ch of l) {
    if (ch === '"') aspas = !aspas;
    else if (ch === ',' && !aspas) { out.push(atual); atual = ''; }
    else atual += ch;
  }
  out.push(atual);
  return out;
}

/** "7225//" -> "7225"; "------" -> "" (total); "722511" -> "722511". */
export const naicsLimpo = (c) => String(c).replace(/[^0-9]/g, '');

/** Descobre as colunas pelo cabeçalho (o layout exato do arquivo não foi verificado). */
export function mapearCabecalho(cabecalho) {
  const nomes = cabecalho.map((c) => c.trim().toLowerCase().replace(/^﻿/, ''));
  const idx = (n) => nomes.indexOf(n);
  const col = { estado: idx('fipstate'), condado: idx('fipscty'), naics: idx('naics'), est: idx('est') };
  const faltando = Object.entries(col).filter(([, v]) => v < 0).map(([k]) => k);
  if (faltando.length) throw new Error(`cabeçalho do CBP sem as colunas: ${faltando.join(', ')} (encontrado: ${nomes.slice(0, 20).join(',')})`);
  const faixas = nomes.map((n, i) => ({ n, i })).filter(({ n }) => /^n(<5|\d+_\d+|\d+)$/.test(n));
  return { ...col, faixas };
}

export function criarAgregadorUS(segmentos) {
  const porNaics = new Map();
  for (const s of segmentos) for (const c of s.naics) porNaics.set(c, s.slug);
  const dados = new Map(); // "SS|CCC" -> { [segmento]: { e, faixas: {nome: n} } }
  let lidas = 0;
  let usadas = 0;
  let descartadas = 0;

  function ingerir(campos, cab) {
    lidas += 1;
    if (!campos || campos.length <= cab.est) { descartadas += 1; return; }
    const seg = porNaics.get(naicsLimpo(campos[cab.naics]));
    if (!seg) return;
    const estado = campos[cab.estado].padStart(2, '0');
    const condado = campos[cab.condado].padStart(3, '0');
    if (!US_STATES[estado] || condado === '999') return; // fora dos estados ou "condado não especificado"
    const est = Number(campos[cab.est]);
    if (!Number.isFinite(est)) { descartadas += 1; return; }
    const chave = `${estado}|${condado}`;
    const porSeg = dados.get(chave) || dados.set(chave, {}).get(chave);
    const reg = porSeg[seg] || (porSeg[seg] = { e: 0, f: {} });
    reg.e += est;
    usadas += 1;
    for (const { n, i } of cab.faixas) {
      const v = Number(campos[i]);
      if (Number.isFinite(v)) reg.f[n] = (reg.f[n] || 0) + v;
    }
  }
  return { ingerir, dados, contagem: () => ({ lidas, usadas, descartadas }) };
}

/** Nomes de condado: aceita o arquivo do Census (separado por "|") ou CSV com cabeçalho (fips,county_name,state_abbr...). */
export function nomesDeCondados(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const sep = linhas[0].includes('|') ? '|' : ',';
  const dividir = (l) => (sep === '|' ? l.split('|') : linhaCsv(l));
  const cab = dividir(linhas[0]).map((c) => c.trim().toLowerCase());
  const mapa = new Map();
  const iEstado = cab.indexOf('statefp');
  const iCond = cab.indexOf('countyfp');
  const iNome = cab.indexOf('countyname');
  for (const l of linhas.slice(1)) {
    const c = dividir(l);
    if (iEstado >= 0 && iCond >= 0 && iNome >= 0) mapa.set(`${c[iEstado].padStart(2, '0')}|${c[iCond].padStart(3, '0')}`, c[iNome].trim());
  }
  if (mapa.size) return mapa;
  const iFips = cab.indexOf('fips');
  const iN = cab.indexOf('county_name');
  if (iFips < 0 || iN < 0) throw new Error('arquivo de nomes de condados em formato desconhecido');
  for (const l of linhas.slice(1)) {
    const c = dividir(l);
    const f = c[iFips].padStart(5, '0');
    mapa.set(`${f.slice(0, 2)}|${f.slice(2)}`, c[iN].trim());
  }
  return mapa;
}

/** Slug único dentro do estado. */
export function resolverCondados(chaves, nomes) {
  const usados = new Map();
  const out = [];
  for (const chave of [...chaves].sort()) {
    const [fe, fc] = chave.split('|');
    const nome = nomes.get(chave) || `County ${fe}${fc}`;
    let slug = slugify(nome) || `county-${fc}`;
    const k = `${fe}/${slug}`;
    if (usados.has(k)) slug = `${slug}-${fc}`;
    usados.set(`${fe}/${slug}`, true);
    out.push({ state: US_STATES[fe].abbr, slug, name: nome, fips: `${fe}${fc}`, nameOk: nomes.has(chave) });
  }
  return out;
}
