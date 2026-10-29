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
 * @param nomes  { "UF/slug": nome } (municipios.json); usado nos rankings de ativos,
 *               que exibem e ordenam pelo nome do município. Sem o mapa, usa o slug.
 * @returns      { caminho: "hash|AAAA-MM-DD" }
 */
export function calcularLastmod(stats, previo, hoje, meta, nomes) {
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
  if (meta) {
    marcarRankings(stats, meta, marcar);
    marcarAtivos(stats, meta, marcar, nomes);
  }
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

/**
 * Rankings de ativos por segmento (Brasil e UF). O hash cobre exatamente o que a
 * página exibe: a tabela (top 50, ordenada por ativos e desempatada pelo nome do
 * município), os totais do escopo (que incluem municípios abaixo do mínimo), a
 * contagem de municípios, o mínimo exibido nos textos, o slug/curto/classes do
 * segmento e a lista "Outros rankings" (nomes dos demais segmentos e, na página
 * de UF, se cada um tem ranking na UF — é o que decide o link; o nome do próprio
 * segmento não aparece na página e fica fora). m/ab/ba não são exibidos
 * nessas páginas e ficam fora do hash. O hub cobre o total de ativos e a
 * contagem de municípios por segmento, na ordem da tabela. Os limites espelham
 * LIMITE_RANKING (src/lib/ranking-textos.ts) e MIN_MUNICIPIOS_RANKING_UF
 * (src/lib/data.ts).
 */
const LIMITE_RANKING = 50;
const MIN_MUNICIPIOS_RANKING_UF = 10;

function linhasDeAtivos(stats, seg, nomes) {
  const linhas = [];
  for (const uf of Object.keys(stats).sort()) {
    for (const mun of Object.keys(stats[uf]).sort()) {
      const reg = stats[uf][mun][seg.slug];
      if (!reg || reg.a <= 0) continue;
      const nome = nomes?.[`${uf}/${mun}`];
      if (nomes && !nome) continue; // o app ignora município sem nome cadastrado
      linhas.push({ uf, mun, nome: nome ?? mun, a: reg.a });
    }
  }
  // Mesma ordenação do app (src/lib/ranking-core.ts): ativos desc, nome/UF pt-BR.
  linhas.sort((x, y) => y.a - x.a || `${x.nome}/${x.uf}`.localeCompare(`${y.nome}/${y.uf}`, 'pt-BR'));
  return linhas;
}

function marcarAtivos(stats, meta, marcar, nomes) {
  const porSegmento = new Map();
  for (const seg of meta.segmentos) {
    const linhas = linhasDeAtivos(stats, seg, nomes);
    if (linhas.length) porSegmento.set(seg.slug, linhas);
  }
  const publicaveisNaUF = (slug, uf) =>
    (porSegmento.get(slug) || []).filter((l) => l.uf === uf && l.a >= meta.minimoParaIndexar).length;
  const outros = (slug) => meta.segmentos.filter((s) => s.slug !== slug).map((s) => ({ slug: s.slug, nome: s.nome }));

  const hub = [];
  for (const seg of meta.segmentos) {
    const linhas = porSegmento.get(seg.slug) || [];
    const publicaveis = linhas.filter((l) => l.a >= meta.minimoParaIndexar);
    const totalEscopo = linhas.reduce((t, l) => t + l.a, 0);
    // O hub lista todos os segmentos, mesmo sem municípios publicáveis.
    hub.push({ slug: seg.slug, nome: seg.nome, ativos: totalEscopo, municipios: publicaveis.length });
    if (!publicaveis.length) continue;

    const assinaturaSeg = { slug: seg.slug, curto: seg.curto, classes: seg.classes };
    const assinaturaPagina = { competencia: meta.competencia, geradoEm: meta.geradoEm, minimoParaIndexar: meta.minimoParaIndexar };
    const topo = publicaveis.slice(0, LIMITE_RANKING).map(({ uf, mun, nome, a }) => ({ uf, mun, nome, a }));
    const nacional = {
      topo,
      totalEscopo,
      totalMunicipios: publicaveis.length,
      outros: outros(seg.slug),
      ...assinaturaSeg,
      ...assinaturaPagina,
    };
    marcar(`/rankings/ativos/${seg.slug}`, h8(estavel(nacional)));

    const porUF = new Map();
    for (const linha of linhas) {
      if (!porUF.has(linha.uf)) porUF.set(linha.uf, { totalEscopo: 0, publicaveis: [] });
      const grupo = porUF.get(linha.uf);
      grupo.totalEscopo += linha.a;
      if (linha.a >= meta.minimoParaIndexar) grupo.publicaveis.push(linha);
    }
    for (const [uf, grupo] of porUF) {
      if (grupo.publicaveis.length < MIN_MUNICIPIOS_RANKING_UF) continue;
      const pagina = {
        topo: grupo.publicaveis.slice(0, LIMITE_RANKING).map(({ uf: u, mun, nome, a }) => ({ uf: u, mun, nome, a })),
        totalEscopo: grupo.totalEscopo,
        totalMunicipios: grupo.publicaveis.length,
        outros: outros(seg.slug).map((s) => ({ ...s, temRankingNaUF: publicaveisNaUF(s.slug, uf) >= MIN_MUNICIPIOS_RANKING_UF })),
        ...assinaturaSeg,
        ...assinaturaPagina,
      };
      marcar(`/rankings/ativos/${seg.slug}/${uf.toLowerCase()}`, h8(estavel(pagina)));
    }
  }
  const assinaturaHub = { competencia: meta.competencia, geradoEm: meta.geradoEm };
  marcar('/rankings/ativos', h8(estavel({ hub, ...assinaturaHub })));
}
