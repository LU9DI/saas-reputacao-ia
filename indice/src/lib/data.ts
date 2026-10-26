import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { UFS } from './ufs';

export type Registro = {
  a: number; // estabelecimentos ativos
  m: number; // dos ativos, quantos são matriz
  ab: number; // abertos na janela de 12 meses (qualquer situação atual)
  ba: number; // baixas registradas na janela de 12 meses
  ano: Record<string, number>; // aberturas por ano de início de atividade
  sub: Record<string, number>; // ativos por subclasse CNAE (7 dígitos)
};
export type Segmento = { slug: string; nome: string; curto: string; classes: string[] };
export type Meta = {
  competencia: string;
  geradoEm: string;
  fonte: { nome: string; url: string };
  janela: { inicio: string; fim: string };
  minimoParaIndexar: number;
  segmentos: Segmento[];
  sintetico?: boolean;
  linhasLidas?: number;
  linhasNoEscopo?: number;
  arquivosEstabelecimentos?: number;
  municipiosSemNomeIbge?: number;
};
export type Municipio = { uf: string; slug: string; nome: string; ibge: number | null };
type StatsUF = Record<string, Record<string, Registro>>; // município -> segmento -> registro

type Posicao = { uf: string; mun: string; a: number };
type Loja = {
  meta: Meta;
  municipios: Municipio[];
  porChave: Map<string, Municipio>;
  subclasses: Record<string, string>;
  stats: Record<string, StatsUF>;
  segmentos: Map<string, Segmento>;
  ranking: Map<string, { ordenado: Posicao[]; rankBR: Map<string, number>; rankUF: Map<string, number>; totalUF: Map<string, number>; totalBR: number }>;
};

let cache: Loja | null = null;

function dir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.INDICE_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data'));
}
const ler = <T,>(...partes: string[]): T => JSON.parse(readFileSync(path.join(dir(), ...partes), 'utf8')) as T;

function carregar(): Loja {
  if (cache) return cache;
  const meta = ler<Meta>('meta.json');
  const municipios = ler<Municipio[]>('municipios.json');
  const subclasses = ler<Record<string, string>>('subclasses.json');
  const stats: Record<string, StatsUF> = {};
  for (const uf of Object.keys(UFS)) {
    const arq = path.join(dir(), 'stats', `${uf}.json`);
    if (existsSync(arq)) stats[uf] = JSON.parse(readFileSync(arq, 'utf8')) as StatsUF;
  }
  const porChave = new Map(municipios.map((m) => [`${m.uf}/${m.slug}`, m]));
  const segmentos = new Map(meta.segmentos.map((s) => [s.slug, s]));

  const ranking: Loja['ranking'] = new Map();
  for (const seg of meta.segmentos) {
    const lista: Posicao[] = [];
    for (const [uf, porMun] of Object.entries(stats)) {
      for (const [mun, porSeg] of Object.entries(porMun)) {
        const reg = porSeg[seg.slug];
        if (reg && reg.a > 0) lista.push({ uf, mun, a: reg.a });
      }
    }
    lista.sort((x, y) => y.a - x.a || x.uf.localeCompare(y.uf) || x.mun.localeCompare(y.mun));
    // ranking de competição: empates dividem a mesma posição
    const rankBR = new Map<string, number>();
    const rankUF = new Map<string, number>();
    const totalUF = new Map<string, number>();
    const porUF = new Map<string, Posicao[]>();
    lista.forEach((p, i) => {
      const anterior = lista[i - 1];
      const posicao = anterior && anterior.a === p.a ? rankBR.get(`${anterior.uf}/${anterior.mun}`)! : i + 1;
      rankBR.set(`${p.uf}/${p.mun}`, posicao);
      const grupo = porUF.get(p.uf) || [];
      grupo.push(p);
      porUF.set(p.uf, grupo);
    });
    for (const [uf, grupo] of porUF) {
      totalUF.set(uf, grupo.length);
      grupo.forEach((p, i) => {
        const anterior = grupo[i - 1];
        rankUF.set(`${p.uf}/${p.mun}`, anterior && anterior.a === p.a ? rankUF.get(`${anterior.uf}/${anterior.mun}`)! : i + 1);
      });
    }
    ranking.set(seg.slug, { ordenado: lista, rankBR, rankUF, totalUF, totalBR: lista.length });
  }
  cache = { meta, municipios, porChave, subclasses, stats, segmentos, ranking };
  return cache;
}

export const getMeta = () => carregar().meta;
export const getSegmentos = () => carregar().meta.segmentos;
export const getSegmento = (slug: string) => carregar().segmentos.get(slug) ?? null;
export const getMunicipio = (uf: string, slug: string) => carregar().porChave.get(`${uf}/${slug}`) ?? null;
export const nomeSubclasse = (cod: string) => carregar().subclasses[cod] ?? cod;
export const minimo = () => carregar().meta.minimoParaIndexar;

export function getRegistro(uf: string, mun: string, seg: string): Registro | null {
  return carregar().stats[uf]?.[mun]?.[seg] ?? null;
}

/** Segmentos com página indexável em um município, do maior para o menor. */
export function segmentosDoMunicipio(uf: string, mun: string): { seg: Segmento; reg: Registro }[] {
  const s = carregar();
  const porSeg = s.stats[uf]?.[mun];
  if (!porSeg) return [];
  return s.meta.segmentos
    .map((seg) => ({ seg, reg: porSeg[seg.slug] }))
    .filter((x): x is { seg: Segmento; reg: Registro } => Boolean(x.reg) && x.reg.a >= s.meta.minimoParaIndexar)
    .sort((x, y) => y.reg.a - x.reg.a);
}

/** Municípios de uma UF com ao menos uma página indexável. */
export function municipiosDaUF(uf: string): { mun: Municipio; total: number; segmentos: number }[] {
  const s = carregar();
  const porMun = s.stats[uf];
  if (!porMun) return [];
  const saida: { mun: Municipio; total: number; segmentos: number }[] = [];
  for (const slug of Object.keys(porMun)) {
    const mun = s.porChave.get(`${uf}/${slug}`);
    if (!mun) continue;
    const ok = segmentosDoMunicipio(uf, slug);
    if (ok.length) saida.push({ mun, total: ok.reduce((t, x) => t + x.reg.a, 0), segmentos: ok.length });
  }
  return saida.sort((x, y) => x.mun.nome.localeCompare(y.mun.nome, 'pt-BR'));
}

export function totalDoSegmento(seg: string, uf?: string): number {
  const r = carregar().ranking.get(seg);
  if (!r) return 0;
  return r.ordenado.reduce((t, p) => (uf && p.uf !== uf ? t : t + p.a), 0);
}

/** Maiores municípios de um segmento (opcionalmente dentro de uma UF) que têm página indexável. */
export function topMunicipios(seg: string, limite: number, uf?: string): { mun: Municipio; a: number }[] {
  const s = carregar();
  const r = s.ranking.get(seg);
  if (!r) return [];
  const saida: { mun: Municipio; a: number }[] = [];
  for (const p of r.ordenado) {
    if (uf && p.uf !== uf) continue;
    if (p.a < s.meta.minimoParaIndexar) break;
    const mun = s.porChave.get(`${p.uf}/${p.mun}`);
    if (mun) saida.push({ mun, a: p.a });
    if (saida.length >= limite) break;
  }
  return saida;
}

export function ufsComDados(): { sigla: string; nome: string; municipios: number; estabelecimentos: number }[] {
  const s = carregar();
  return Object.keys(UFS)
    .filter((uf) => s.stats[uf])
    .map((uf) => {
      const lista = municipiosDaUF(uf);
      return { sigla: uf, nome: UFS[uf], municipios: lista.length, estabelecimentos: lista.reduce((t, x) => t + x.total, 0) };
    })
    .filter((u) => u.municipios > 0);
}

export type CoberturaSegmento = {
  /** Ativos no segmento em todos os municípios da base. */
  total: number;
  /** Municípios com ao menos um ativo do segmento (inclui os que não têm página). */
  municipiosNoSegmento: number;
  /** Municípios com página publicada (ativos >= mínimo). */
  municipiosComPagina: number;
  /** Ativos apenas nos municípios com página publicada. */
  totalNasPaginas: number;
};

/** Cobertura de um segmento: universo completo da base vs. células efetivamente publicadas. */
export function coberturaDoSegmento(seg: string, uf?: string): CoberturaSegmento {
  const s = carregar();
  const r = s.ranking.get(seg);
  if (!r) return { total: 0, municipiosNoSegmento: 0, municipiosComPagina: 0, totalNasPaginas: 0 };
  let total = 0;
  let municipiosNoSegmento = 0;
  let municipiosComPagina = 0;
  let totalNasPaginas = 0;
  for (const p of r.ordenado) {
    if (uf && p.uf !== uf) continue;
    total += p.a;
    municipiosNoSegmento += 1;
    if (p.a >= s.meta.minimoParaIndexar) {
      municipiosComPagina += 1;
      totalNasPaginas += p.a;
    }
  }
  return { total, municipiosNoSegmento, municipiosComPagina, totalNasPaginas };
}

export type ResumoIndice = {
  ufs: number;
  municipiosComPagina: number;
  segmentos: number;
  /** Soma dos nove segmentos em todos os municípios da base. */
  ativosNosSegmentos: number;
  /** Soma apenas das células publicadas (município x segmento com página). */
  ativosNasPaginas: number;
};

/** Números da home; distingue o universo completo do que está publicado. */
export function resumoDoIndice(): ResumoIndice {
  const s = carregar();
  const ufs = ufsComDados();
  const municipios = new Set<string>();
  let ativosNasPaginas = 0;
  for (const u of ufs) {
    for (const m of municipiosDaUF(u.sigla)) {
      municipios.add(`${u.sigla}/${m.mun.slug}`);
      ativosNasPaginas += m.total;
    }
  }
  let ativosNosSegmentos = 0;
  for (const seg of s.meta.segmentos) ativosNosSegmentos += totalDoSegmento(seg.slug);
  return {
    ufs: ufs.length,
    municipiosComPagina: municipios.size,
    segmentos: s.meta.segmentos.length,
    ativosNosSegmentos,
    ativosNasPaginas,
  };
}

export type Pagina = {
  mun: Municipio;
  seg: Segmento;
  reg: Registro;
  rankUF: number;
  totalRankUF: number;
  rankBR: number;
  totalRankBR: number;
  totalUF: number;
  totalBR: number;
  maisNaUF: { mun: Municipio; a: number }[];
  outrosSegmentos: { seg: Segmento; reg: Registro }[];
};

export function getPagina(uf: string, munSlug: string, segSlug: string): Pagina | null {
  const s = carregar();
  const mun = getMunicipio(uf, munSlug);
  const seg = getSegmento(segSlug);
  const reg = getRegistro(uf, munSlug, segSlug);
  if (!mun || !seg || !reg || reg.a < s.meta.minimoParaIndexar) return null;
  const r = s.ranking.get(segSlug)!;
  const chave = `${uf}/${munSlug}`;
  return {
    mun,
    seg,
    reg,
    rankUF: r.rankUF.get(chave) ?? 1,
    totalRankUF: r.totalUF.get(uf) ?? 1,
    rankBR: r.rankBR.get(chave) ?? 1,
    totalRankBR: r.totalBR,
    totalUF: totalDoSegmento(segSlug, uf),
    totalBR: totalDoSegmento(segSlug),
    maisNaUF: topMunicipios(segSlug, 11, uf).filter((x) => x.mun.slug !== munSlug).slice(0, 10),
    outrosSegmentos: segmentosDoMunicipio(uf, munSlug).filter((x) => x.seg.slug !== segSlug),
  };
}

/** Todos os caminhos indexáveis (relativos ao basePath), para o sitemap. */
export function todosOsCaminhos(): string[] {
  const caminhos = ['/', '/metodologia'];
  for (const u of ufsComDados()) {
    const uf = u.sigla.toLowerCase();
    caminhos.push(`/${uf}`);
    for (const { mun } of municipiosDaUF(u.sigla)) {
      caminhos.push(`/${uf}/${mun.slug}`);
      for (const { seg } of segmentosDoMunicipio(u.sigla, mun.slug)) caminhos.push(`/${uf}/${mun.slug}/${seg.slug}`);
    }
  }
  return caminhos;
}
