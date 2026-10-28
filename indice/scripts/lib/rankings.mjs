// Ranking de aberturas por ano, calculado a partir de data/stats/*.json.
// Nenhum número é digitado manualmente: tudo sai da agregação da base aberta do CNPJ.
//
// "Abertura" = estabelecimento com data de início de atividade no ano, qualquer que
// seja a situação atual. Não é saldo líquido nem estoque ativo (ver metodologia).

/** Quantos anos completos mais recentes recebem página de ranking por segmento. */
export const ANOS_PUBLICADOS = 3;

/** Mínimos para publicar um ranking: municípios com ao menos uma abertura e total no ano. */
export const MIN_MUNICIPIOS = 10;
export const MIN_TOTAL = 100;

/** Anos com ao menos uma abertura registrada em qualquer município do segmento, em ordem. */
export function anosDaSerie(stats, seg) {
  const anos = new Set();
  for (const porMun of Object.values(stats)) {
    for (const porSeg of Object.values(porMun)) {
      const reg = porSeg[seg];
      if (reg && reg.ano) for (const a of Object.keys(reg.ano)) anos.add(Number(a));
    }
  }
  return [...anos].sort((a, b) => a - b);
}

/** Anos completos (anteriores ao ano da competência) com aberturas na série, do mais recente para o mais antigo. */
export function anosCompletos(meta, stats, seg) {
  const anoComp = Number(meta.competencia.slice(0, 4));
  return anosDaSerie(stats, seg)
    .filter((a) => a < anoComp)
    .sort((a, b) => b - a);
}

/** Anos que recebem página de ranking para o segmento (os ANOS_PUBLICADOS completos mais recentes). */
export function anosPublicados(meta, stats, seg) {
  return anosCompletos(meta, stats, seg).slice(0, ANOS_PUBLICADOS);
}

/**
 * Ranking de aberturas de um segmento em um ano.
 *
 * Empates dividem a mesma posição (ranking de competição). Município sem abertura no
 * ano conta zero e fica fora do ranking; ausência de dado não é tratada como estimativa.
 *
 * @param {{ [uf: string]: { [municipio: string]: { [segmento: string]: { ano?: { [ano: string]: number } } } } }} stats
 * @param {string} seg slug do segmento
 * @param {number} ano ano de início de atividade (fechado)
 * @returns {{
 *   ordenado: { uf: string; municipio: string; v: number; posicao: number }[];
 *   total: number;
 *   municipiosComAbertura: number;
 *   porUF: { uf: string; total: number; lider: { municipio: string; v: number } | null }[];
 * }}
 */
export function calcularRanking(stats, seg, ano) {
  const lista = [];
  const porUF = [];
  for (const [uf, porMun] of Object.entries(stats)) {
    let totalUF = 0;
    let lider = null;
    for (const [municipio, porSeg] of Object.entries(porMun)) {
      const reg = porSeg[seg];
      if (!reg || !reg.ano) continue;
      const v = Number.isInteger(reg.ano[ano]) ? reg.ano[ano] : 0;
      totalUF += v;
      if (v > 0) {
        lista.push({ uf, municipio, v });
        if (!lider || v > lider.v) lider = { municipio, v };
      }
    }
    if (totalUF > 0) porUF.push({ uf, total: totalUF, lider });
  }
  lista.sort((a, b) => b.v - a.v || a.uf.localeCompare(b.uf, 'pt') || a.municipio.localeCompare(b.municipio, 'pt'));
  const ordenado = [];
  for (const [i, item] of lista.entries()) {
    const posicao = i > 0 && lista[i - 1].v === item.v ? ordenado[i - 1].posicao : i + 1;
    ordenado.push({ ...item, posicao });
  }
  porUF.sort((a, b) => b.total - a.total || a.uf.localeCompare(b.uf));
  return {
    ordenado,
    total: ordenado.reduce((t, item) => t + item.v, 0),
    municipiosComAbertura: ordenado.length,
    porUF,
  };
}

/** A série nacional de aberturas do segmento (ano -> total), para o gráfico de evolução. */
export function serieDoSegmento(stats, seg) {
  const serie = {};
  for (const porMun of Object.values(stats)) {
    for (const porSeg of Object.values(porMun)) {
      const reg = porSeg[seg];
      if (!reg || !reg.ano) continue;
      for (const [a, v] of Object.entries(reg.ano)) serie[a] = (serie[a] || 0) + v;
    }
  }
  return serie;
}

/** O ranking só vira página quando há conteúdo suficiente para sustentar a lista. */
export function podePublicar(ranking, minMunicipios = MIN_MUNICIPIOS, minTotal = MIN_TOTAL) {
  return ranking.total >= minTotal && ranking.municipiosComAbertura >= minMunicipios;
}

/**
 * Resposta direta do ranking: uma ou duas frases com o resultado principal, o período
 * e a data de referência. Recebe formatadores para não duplicar a formatação do app.
 *
 * @param {{
 *   nomeSeg: string; curtoSeg: string; ano: number;
 *   ranking: ReturnType<typeof calcularRanking>;
 *   meta: { competencia: string; geradoEm: string };
 *   nomeDoMunicipio: (uf: string, municipio: string) => string;
 *   nomeDaUF: (uf: string) => string;
 * }} dados
 * @param {{ n: (x: number) => string; pct: (parte: number, total: number) => string; dataCurta: (iso: string) => string }} fmt
 */
export function montarResposta(dados, fmt) {
  const { ranking, ano, meta, nomeDoMunicipio, nomeDaUF } = dados;
  const primeiro = ranking.ordenado[0];
  const empatados = ranking.ordenado.filter((item) => item.v === primeiro.v);
  const cabeca =
    empatados.length === 1
      ? `${nomeDoMunicipio(primeiro.uf, primeiro.municipio)} (${primeiro.uf}) foi o município com mais aberturas de ${dados.curtoSeg} em ${ano} no Brasil`
      : `Os municípios com mais aberturas de ${dados.curtoSeg} em ${ano} no Brasil foram ${empatados
          .map((item) => `${nomeDoMunicipio(item.uf, item.municipio)} (${item.uf})`)
          .join(' e ')} (empatados)`;
  const numero = `${fmt.n(primeiro.v)} estabelecimentos iniciaram atividade no ano, ${fmt.pct(primeiro.v, ranking.total)} das ${fmt.n(ranking.total)} aberturas do segmento em ${fmt.n(ranking.municipiosComAbertura)} municípios.`;
  const referencia = `Competência ${meta.competencia}, dados gerados em ${fmt.dataCurta(meta.geradoEm)}.`;
  return `${cabeca}: ${numero} ${referencia}`;
}
