import { getMeta, getMunicipio, getSegmento, getSegmentos, getStats } from './data';
import type { Segmento } from './data';
import { UFS } from './ufs';
import { n, pct, dataCurta } from './format';
import * as rankingsCore from '../../scripts/lib/rankings.mjs';

// O cálculo fica em scripts/lib/rankings.mjs (testável com node --test); este arquivo
// só adiciona tipos e acesso aos dados carregados pelo app.

export type ItemRanking = { uf: string; municipio: string; v: number; posicao: number };
export type RankingAberturas = {
  ordenado: ItemRanking[];
  total: number;
  municipiosComAbertura: number;
  porUF: { uf: string; total: number; lider: { municipio: string; v: number } | null }[];
};

type Core = {
  ANOS_PUBLICADOS: number;
  anosDaSerie: (stats: unknown, seg: string) => number[];
  anosCompletos: (meta: unknown, stats: unknown, seg: string) => number[];
  anosPublicados: (meta: unknown, stats: unknown, seg: string) => number[];
  calcularRanking: (stats: unknown, seg: string, ano: number) => RankingAberturas;
  serieDoSegmento: (stats: unknown, seg: string) => Record<string, number>;
  podePublicar: (r: RankingAberturas, minMunicipios?: number, minTotal?: number) => boolean;
  montarResposta: (
    dados: {
      nomeSeg: string;
      curtoSeg: string;
      ano: number;
      ranking: RankingAberturas;
      meta: { competencia: string; geradoEm: string };
      nomeDoMunicipio: (uf: string, municipio: string) => string;
      nomeDaUF: (uf: string) => string;
    },
    fmt: { n: (x: number) => string; pct: (parte: number, total: number) => string; dataCurta: (iso: string) => string },
  ) => string;
};

const core = rankingsCore as unknown as Core;

export const nomeDoMunicipio = (uf: string, slug: string) => getMunicipio(uf, slug)?.nome ?? slug;
export const nomeDaUF = (uf: string) => UFS[uf] ?? uf;

/** Anos completos que recebem página de ranking para o segmento, do mais recente para o mais antigo. */
export function anosPublicadosDoSegmento(segSlug: string): number[] {
  const s = getSegmento(segSlug);
  if (!s) return [];
  const stats = getStats();
  return core.anosPublicados(getMeta(), stats, segSlug).filter((ano) => {
    const ranking = core.calcularRanking(stats, segSlug, ano);
    return core.podePublicar(ranking);
  });
}

export type PaginaRanking = {
  seg: Segmento;
  ano: number;
  ranking: RankingAberturas;
  serie: Record<string, number>;
  anosPublicados: number[];
  anoComp: number;
  resposta: string;
};

export function getPaginaRanking(segSlug: string, anoStr: string): PaginaRanking | null {
  const meta = getMeta();
  const seg = getSegmento(segSlug);
  if (!seg) return null;
  const ano = Number(anoStr);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return null;
  const publicados = anosPublicadosDoSegmento(segSlug);
  if (!publicados.includes(ano)) return null;
  const ranking = core.calcularRanking(getStats(), segSlug, ano);
  if (!core.podePublicar(ranking)) return null;
  const resposta = core.montarResposta(
    {
      nomeSeg: seg.nome,
      curtoSeg: seg.curto,
      ano,
      ranking,
      meta,
      nomeDoMunicipio,
      nomeDaUF,
    },
    { n, pct, dataCurta },
  );
  return {
    seg,
    ano,
    ranking,
    serie: core.serieDoSegmento(getStats(), segSlug),
    anosPublicados: publicados,
    anoComp: Number(meta.competencia.slice(0, 4)),
    resposta,
  };
}

/** Caminhos de ranking indexáveis (relativos ao basePath), para o sitemap. */
export function caminhosDeRankings(): string[] {
  const caminhos: string[] = [];
  for (const seg of getSegmentos()) {
    for (const ano of anosPublicadosDoSegmento(seg.slug)) {
      caminhos.push(`/rankings/aberturas/${seg.slug}/${ano}`);
    }
  }
  return caminhos;
}
