// Dados do County Business Patterns (EUA). Opcional: sem data-us/ as rotas /us devolvem 404 e saem do sitemap.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ESTADOS_US, slugEstado } from './us-states';

export type UsSegmento = { slug: string; nome: string; curto: string; naics: string[] };
export type UsMeta = {
  ano: string;
  geradoEm: string;
  fonte: { nome: string; url: string };
  minimoParaIndexar: number;
  segmentos: UsSegmento[];
  sintetico?: boolean;
  linhasLidas?: number;
  linhasNoEscopo?: number;
};
export type UsCondado = { state: string; slug: string; nome: string };
export type UsRegistro = { e: number; emp?: number; sz: number[] };
type Posicao = { state: string; county: string; e: number };
type Loja = {
  meta: UsMeta;
  condados: Map<string, UsCondado>;
  stats: Map<string, Record<string, Record<string, UsRegistro>>>;
  segmentos: Map<string, UsSegmento>;
  ranking: Map<string, { ordenado: Posicao[]; rankUS: Map<string, number>; rankUF: Map<string, number>; totalUF: Map<string, number>; totalUS: number }>;
};

let cache: Loja | null = null;
const dir = () => path.resolve(/*turbopackIgnore: true*/ process.env.INDICE_US_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data-us'));
const ler = <T,>(...p: string[]): T => JSON.parse(readFileSync(path.join(dir(), ...p), 'utf8')) as T;

export const temDadosUS = () => existsSync(path.join(dir(), 'meta.json'));

function carregar(): Loja {
  if (cache) return cache;
  const meta = ler<UsMeta>('meta.json');
  const condados = new Map(ler<UsCondado[]>('counties.json').map((c) => [`${c.state}/${c.slug}`, c]));
  const stats = new Map<string, Record<string, Record<string, UsRegistro>>>();
  for (const st of Object.keys(ESTADOS_US)) {
    const arq = path.join(dir(), 'stats', `${st}.json`);
    if (existsSync(arq)) stats.set(st, JSON.parse(readFileSync(arq, 'utf8')));
  }
  const segmentos = new Map(meta.segmentos.map((s) => [s.slug, s]));
  const ranking: Loja['ranking'] = new Map();
  for (const seg of meta.segmentos) {
    const lista: Posicao[] = [];
    for (const [state, porCondado] of stats) for (const [county, porSeg] of Object.entries(porCondado)) if (porSeg[seg.slug]) lista.push({ state, county, e: porSeg[seg.slug].e });
    lista.sort((a, b) => b.e - a.e || `${a.state}/${a.county}`.localeCompare(`${b.state}/${b.county}`));
    const rankUS = new Map<string, number>();
    const rankUF = new Map<string, number>();
    const totalUF = new Map<string, number>();
    const cont = new Map<string, { ultimo: number; pos: number; n: number }>();
    let ultimo = -1;
    let posUS = 0;
    lista.forEach((p, i) => {
      if (p.e !== ultimo) { posUS = i + 1; ultimo = p.e; }
      rankUS.set(`${p.state}/${p.county}`, posUS);
      const c = cont.get(p.state) || { ultimo: -1, pos: 0, n: 0 };
      c.n += 1;
      if (p.e !== c.ultimo) { c.pos = c.n; c.ultimo = p.e; }
      cont.set(p.state, c);
      rankUF.set(`${p.state}/${p.county}`, c.pos);
      totalUF.set(p.state, (totalUF.get(p.state) || 0) + p.e);
    });
    ranking.set(seg.slug, { ordenado: lista, rankUS, rankUF, totalUF, totalUS: lista.reduce((t, p) => t + p.e, 0) });
  }
  cache = { meta, condados, stats, segmentos, ranking };
  return cache;
}

export const usMeta = () => carregar().meta;
export const usSegmentos = () => carregar().meta.segmentos;
export const usSegmento = (slug: string) => carregar().segmentos.get(slug) ?? null;
export const usCondado = (st: string, slug: string) => carregar().condados.get(`${st}/${slug}`) ?? null;
export const usMinimo = () => carregar().meta.minimoParaIndexar;

export function usRegistro(st: string, county: string, seg: string): UsRegistro | null {
  return carregar().stats.get(st)?.[county]?.[seg] ?? null;
}
/** Segmentos publicáveis do condado, do maior para o menor. */
export function usSegsDoCondado(st: string, county: string): { seg: UsSegmento; reg: UsRegistro }[] {
  const L = carregar();
  const porSeg = L.stats.get(st)?.[county];
  if (!porSeg) return [];
  return L.meta.segmentos
    .map((seg) => ({ seg, reg: porSeg[seg.slug] }))
    .filter((x): x is { seg: UsSegmento; reg: UsRegistro } => !!x.reg && x.reg.e >= L.meta.minimoParaIndexar)
    .sort((a, b) => b.reg.e - a.reg.e);
}
export function usCondadosDoEstado(st: string): { county: UsCondado; total: number; segmentos: number }[] {
  const L = carregar();
  const out: { county: UsCondado; total: number; segmentos: number }[] = [];
  for (const slug of Object.keys(L.stats.get(st) || {})) {
    const county = L.condados.get(`${st}/${slug}`);
    const segs = usSegsDoCondado(st, slug);
    if (county && segs.length) out.push({ county, total: segs.reduce((t, x) => t + x.reg.e, 0), segmentos: segs.length });
  }
  return out.sort((a, b) => b.total - a.total || a.county.nome.localeCompare(b.county.nome));
}
export function usTotalSeg(seg: string, st?: string): number {
  const r = carregar().ranking.get(seg);
  if (!r) return 0;
  return st ? r.totalUF.get(st) || 0 : r.totalUS;
}
export function usTopCondados(seg: string, limite: number, st?: string): { county: UsCondado; e: number }[] {
  const L = carregar();
  const r = L.ranking.get(seg);
  if (!r) return [];
  const out: { county: UsCondado; e: number }[] = [];
  for (const p of r.ordenado) {
    if (st && p.state !== st) continue;
    if (p.e < L.meta.minimoParaIndexar) break;
    const county = L.condados.get(`${p.state}/${p.county}`);
    if (county) out.push({ county, e: p.e });
    if (out.length >= limite) break;
  }
  return out;
}
export function usEstadosComDados(): { sigla: string; nome: string; slug: string; condados: number }[] {
  return Object.keys(ESTADOS_US)
    .map((sigla) => ({ sigla, nome: ESTADOS_US[sigla], slug: slugEstado(sigla), condados: usCondadosDoEstado(sigla).length }))
    .filter((x) => x.condados > 0);
}

export type UsPagina = {
  county: UsCondado;
  seg: UsSegmento;
  reg: UsRegistro;
  rankUS: number;
  condadosUS: number;
  rankUF: number;
  condadosUF: number;
  totalUF: number;
  totalUS: number;
  outros: { seg: UsSegmento; reg: UsRegistro }[];
};
export function usPagina(st: string, countySlug: string, segSlug: string): UsPagina | null {
  const L = carregar();
  const county = usCondado(st, countySlug);
  const seg = usSegmento(segSlug);
  const reg = usRegistro(st, countySlug, segSlug);
  if (!county || !seg || !reg || reg.e < L.meta.minimoParaIndexar) return null;
  const r = L.ranking.get(segSlug)!;
  const chave = `${st}/${countySlug}`;
  return {
    county, seg, reg,
    rankUS: r.rankUS.get(chave)!,
    condadosUS: r.ordenado.length,
    rankUF: r.rankUF.get(chave)!,
    condadosUF: r.ordenado.filter((p) => p.state === st).length,
    totalUF: r.totalUF.get(st) || 0,
    totalUS: r.totalUS,
    outros: usSegsDoCondado(st, countySlug).filter((x) => x.seg.slug !== segSlug),
  };
}

/** Todos os caminhos publicáveis (sem o prefixo /indice). */
export function usCaminhos(): string[] {
  if (!temDadosUS()) return [];
  const caminhos = ['/us', '/us/methodology'];
  for (const e of usEstadosComDados()) {
    caminhos.push(`/us/${e.slug}`);
    for (const { county } of usCondadosDoEstado(e.sigla)) {
      caminhos.push(`/us/${e.slug}/${county.slug}`);
      for (const { seg } of usSegsDoCondado(e.sigla, county.slug)) caminhos.push(`/us/${e.slug}/${county.slug}/${seg.slug}`);
    }
  }
  return caminhos;
}
