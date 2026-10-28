import { createHash } from 'node:crypto';
import { anosPublicados, calcularRanking, podePublicar, serieDoSegmento } from './rankings.mjs';

const h8 = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

/** JSON com chaves ordenadas: o hash não pode depender da ordem de inserção. */
function estavel(v) {
  if (Array.isArray(v)) return `[${v.map(estavel).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/**
 * Calcula o lastmod por página. Uma página só ganha data nova quando o conteúdo
 * (as estatísticas que ela exibe) mudou; senão herda a data anterior.
 *
 * @param stats  { UF: { municipio: { segmento: registro } } }
 * @param previo { caminho: "hash|AAAA-MM-DD" } (lastmod.json anterior, ou {})
 * @param hoje   "AAAA-MM-DD"
 * @param meta   meta.json ({ competencia, segmentos }); sem meta, só as páginas
 *               de UF/município/célula são marcadas — os rankings não são calculados.
 * @returns      { caminho: "hash|AAAA-MM-DD" }
 */
export function calcularLastmod(stats, previo, hoje, meta) {
  const saida = {};
  const marcar = (caminho, hash) => {
    const ant = previo[caminho];
    const [hAnt, dAnt] = ant ? ant.split('|') : [];
    saida[caminho] = `${hash}|${hAnt === hash ? dAnt : hoje}`;
  };
  for (const uf of Object.keys(stats).sort()) {
    const ufSlug = uf.toLowerCase();
    const hashesMun = [];
    for (const mun of Object.keys(stats[uf]).sort()) {
      const hashesSeg = [];
      for (const seg of Object.keys(stats[uf][mun]).sort()) {
        const hash = h8(estavel(stats[uf][mun][seg]));
        marcar(`/${ufSlug}/${mun}/${seg}`, hash);
        hashesSeg.push(`${seg}:${hash}`);
      }
      const hMun = h8(hashesSeg.join('|'));
      marcar(`/${ufSlug}/${mun}`, hMun);
      hashesMun.push(`${mun}:${hMun}`);
    }
    marcar(`/${ufSlug}`, h8(hashesMun.join('|')));
  }
  if (meta) marcarRankings(stats, meta, marcar);
  return saida;
}

/**
 * Hub e páginas de ranking. O conteúdo de /rankings/aberturas/{seg}/{ano} é o
 * ranking do ano fechado, a série nacional inteira (o gráfico inclui o ano
 * parcial da competência), os nomes do segmento, a estrutura de anos
 * publicados de todos os segmentos (as páginas ligam entre si) e a competência
 * com a data de geração (exibidas no lead, na resposta direta e em
 * "Fonte e período dos dados"). O hub lista os anos publicados e o total do
 * último ano de cada segmento e também exibe competência e data de geração no
 * lead, no FAQ e na fonte — por isso esses campos entram no hash do hub.
 */
function marcarRankings(stats, meta, marcar) {
  const porSegmento = meta.segmentos.map((seg) => ({
    slug: seg.slug,
    nome: seg.nome,
    curto: seg.curto,
    classes: seg.classes,
    publicados: anosPublicados(meta, stats, seg.slug).filter((ano) =>
      podePublicar(calcularRanking(stats, seg.slug, ano)),
    ),
    serie: serieDoSegmento(stats, seg.slug),
  }));
  const publicadosCompacto = porSegmento.map(({ slug, publicados }) => ({ slug, publicados }));
  const assinaturaMeta = { competencia: meta.competencia, geradoEm: meta.geradoEm };
  for (const seg of porSegmento) {
    for (const ano of seg.publicados) {
      const pagina = {
        ranking: calcularRanking(stats, seg.slug, ano),
        serie: seg.serie,
        nome: seg.nome,
        curto: seg.curto,
        publicadosPorSegmento: publicadosCompacto,
        ...assinaturaMeta,
      };
      marcar(`/rankings/aberturas/${seg.slug}/${ano}`, h8(estavel(pagina)));
    }
  }
  const hub = {
    ...assinaturaMeta,
    porSegmento: porSegmento.map((seg) => ({
      slug: seg.slug,
      nome: seg.nome,
      classes: seg.classes,
      publicados: seg.publicados,
      totalUltimo: seg.publicados.length ? calcularRanking(stats, seg.slug, seg.publicados[0]).total : 0,
    })),
  };
  marcar('/rankings/aberturas', h8(estavel(hub)));
}

/** Extrai só a data de uma entrada "hash|AAAA-MM-DD". */
export const dataDeEntrada = (e) => (e ? e.split('|')[1] : undefined);
