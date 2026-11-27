// Dados do UK Business Counts (ONS, via Nomis). Opcional: sem data-uk/ as rotas /uk devolvem 404 e saem do sitemap.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { NACOES_UK } from './uk-nations';

export type UkSegmento = { slug: string; nome: string; curto: string; sic: string[] };
export type UkMeta = {
  ano: string;
  geradoEm: string;
  fonte: { nome: string; url: string };
  serie?: string;
  unidade?: string;
  metodologia?: string;
  minimoParaIndexar: number;
  segmentos: UkSegmento[];
  sintetico?: boolean;
  linhasLidas?: number;
  linhasNoEscopo?: number;
};
export type UkAutoridade = { nation: string; slug: string; nome: string; codigo: string };
export type UkRegistro = { e: number; emp?: number; sz: (number | null)[]; szStatus?: string };
type Posicao = { nation: string; auth: string; e: number };
type Loja = {
  meta: UkMeta;
  autoridades: Map<string, UkAutoridade>;
  stats: Map<string, Record<string, Record<string, UkRegistro>>>;
  segmentos: Map<string, UkSegmento>;
  ranking: Map<string, { ordenado: Posicao[]; rankUK: Map<string, number>; rankNacao: Map<string, number>; totalNacao: Map<string, number>; totalUK: number }>;
};

let cache: Loja | null = null;
const dir = () => path.resolve(/*turbopackIgnore: true*/ process.env.INDICE_UK_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data-uk'));
const ler = <T,>(...p: string[]): T => JSON.parse(readFileSync(path.join(dir(), ...p), 'utf8')) as T;

export const temDadosUK = () => existsSync(path.join(dir(), 'meta.json'));

function carregar(): Loja {
  if (cache) return cache;
  const meta = ler<UkMeta>('meta.json');
  const autoridades = new Map(ler<UkAutoridade[]>('authorities.json').map((c) => [`${c.nation}/${c.slug}`, c]));
  const stats = new Map<string, Record<string, Record<string, UkRegistro>>>();
  for (const st of Object.keys(NACOES_UK)) {
    const arq = path.join(dir(), 'stats', `${st}.json`);
    if (existsSync(arq)) stats.set(st, JSON.parse(readFileSync(arq, 'utf8')));
  }
  const segmentos = new Map(meta.segmentos.map((s) => [s.slug, s]));
  const ranking: Loja['ranking'] = new Map();
  for (const seg of meta.segmentos) {
    const lista: Posicao[] = [];
    for (const [nation, porAuth] of stats) for (const [auth, porSeg] of Object.entries(porAuth)) if (porSeg[seg.slug]) lista.push({ nation, auth, e: porSeg[seg.slug].e });
    lista.sort((a, b) => b.e - a.e || `${a.nation}/${a.auth}`.localeCompare(`${b.nation}/${b.auth}`));
    const rankUK = new Map<string, number>();
    const rankNacao = new Map<string, number>();
    const totalNacao = new Map<string, number>();
    const cont = new Map<string, { ultimo: number; pos: number; n: number }>();
    let ultimo = -1;
    let posUK = 0;
    lista.forEach((p, i) => {
      if (p.e !== ultimo) { posUK = i + 1; ultimo = p.e; }
      rankUK.set(`${p.nation}/${p.auth}`, posUK);
      const c = cont.get(p.nation) || { ultimo: -1, pos: 0, n: 0 };
      c.n += 1;
      if (p.e !== c.ultimo) { c.pos = c.n; c.ultimo = p.e; }
      cont.set(p.nation, c);
      rankNacao.set(`${p.nation}/${p.auth}`, c.pos);
      totalNacao.set(p.nation, (totalNacao.get(p.nation) || 0) + p.e);
    });
    ranking.set(seg.slug, { ordenado: lista, rankUK, rankNacao, totalNacao, totalUK: lista.reduce((t, p) => t + p.e, 0) });
  }
  cache = { meta, autoridades, stats, segmentos, ranking };
  return cache;
}

export const ukMeta = () => carregar().meta;
export const ukSegmentos = () => carregar().meta.segmentos;
export const ukSegmento = (slug: string) => carregar().segmentos.get(slug) ?? null;
export const ukAutoridade = (nacao: string, slug: string) => carregar().autoridades.get(`${nacao}/${slug}`) ?? null;
export const ukMinimo = () => carregar().meta.minimoParaIndexar;

export function ukRegistro(nacao: string, auth: string, seg: string): UkRegistro | null {
  return carregar().stats.get(nacao)?.[auth]?.[seg] ?? null;
}
/** Segmentos publicáveis da autoridade local, do maior para o menor. */
export function ukSegsDaAutoridade(nacao: string, auth: string): { seg: UkSegmento; reg: UkRegistro }[] {
  const L = carregar();
  const porSeg = L.stats.get(nacao)?.[auth];
  if (!porSeg) return [];
  return L.meta.segmentos
    .map((seg) => ({ seg, reg: porSeg[seg.slug] }))
    .filter((x): x is { seg: UkSegmento; reg: UkRegistro } => !!x.reg && x.reg.e >= L.meta.minimoParaIndexar)
    .sort((a, b) => b.reg.e - a.reg.e);
}
export function ukAutoridadesDaNacao(nacao: string): { auth: UkAutoridade; total: number; segmentos: number }[] {
  const L = carregar();
  const out: { auth: UkAutoridade; total: number; segmentos: number }[] = [];
  for (const slug of Object.keys(L.stats.get(nacao) || {})) {
    const auth = L.autoridades.get(`${nacao}/${slug}`);
    const segs = ukSegsDaAutoridade(nacao, slug);
    if (auth && segs.length) out.push({ auth, total: segs.reduce((t, x) => t + x.reg.e, 0), segmentos: segs.length });
  }
  return out.sort((a, b) => b.total - a.total || a.auth.nome.localeCompare(b.auth.nome));
}
export function ukTotalSeg(seg: string, nacao?: string): number {
  const r = carregar().ranking.get(seg);
  if (!r) return 0;
  return nacao ? r.totalNacao.get(nacao) || 0 : r.totalUK;
}
export function ukTopAutoridades(seg: string, limite: number, nacao?: string): { auth: UkAutoridade; e: number }[] {
  const L = carregar();
  const r = L.ranking.get(seg);
  if (!r) return [];
  const out: { auth: UkAutoridade; e: number }[] = [];
  for (const p of r.ordenado) {
    if (nacao && p.nation !== nacao) continue;
    if (p.e < L.meta.minimoParaIndexar) break;
    const auth = L.autoridades.get(`${p.nation}/${p.auth}`);
    if (auth) out.push({ auth, e: p.e });
    if (out.length >= limite) break;
  }
  return out;
}
export function ukNacoesComDados(): { slug: string; nome: string; autoridades: number }[] {
  return Object.keys(NACOES_UK)
    .map((slug) => ({ slug, nome: NACOES_UK[slug], autoridades: ukAutoridadesDaNacao(slug).length }))
    .filter((x) => x.autoridades > 0);
}

export type UkPagina = {
  auth: UkAutoridade;
  seg: UkSegmento;
  reg: UkRegistro;
  rankUK: number;
  autoridadesUK: number;
  rankNacao: number;
  autoridadesNacao: number;
  totalNacao: number;
  totalUK: number;
  outros: { seg: UkSegmento; reg: UkRegistro }[];
};
export function ukPagina(nacao: string, authSlug: string, segSlug: string): UkPagina | null {
  const L = carregar();
  const auth = ukAutoridade(nacao, authSlug);
  const seg = ukSegmento(segSlug);
  const reg = ukRegistro(nacao, authSlug, segSlug);
  if (!auth || !seg || !reg || reg.e < L.meta.minimoParaIndexar) return null;
  const r = L.ranking.get(segSlug)!;
  const chave = `${nacao}/${authSlug}`;
  return {
    auth, seg, reg,
    rankUK: r.rankUK.get(chave)!,
    autoridadesUK: r.ordenado.length,
    rankNacao: r.rankNacao.get(chave)!,
    autoridadesNacao: r.ordenado.filter((p) => p.nation === nacao).length,
    totalNacao: r.totalNacao.get(nacao) || 0,
    totalUK: r.totalUK,
    outros: ukSegsDaAutoridade(nacao, authSlug).filter((x) => x.seg.slug !== segSlug),
  };
}

/** Todos os caminhos publicáveis (sem o prefixo /indice). */
export function ukCaminhos(): string[] {
  if (!temDadosUK()) return [];
  const caminhos = ['/uk', '/uk/methodology'];
  for (const n of ukNacoesComDados()) {
    caminhos.push(`/uk/${n.slug}`);
    for (const { auth } of ukAutoridadesDaNacao(n.slug)) {
      caminhos.push(`/uk/${n.slug}/${auth.slug}`);
      for (const { seg } of ukSegsDaAutoridade(n.slug, auth.slug)) caminhos.push(`/uk/${n.slug}/${auth.slug}/${seg.slug}`);
    }
  }
  return caminhos;
}
