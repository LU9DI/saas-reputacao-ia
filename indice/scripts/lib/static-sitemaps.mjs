// Sitemaps do Índice como ARTEFATOS ESTÁTICOS.
//
// Por que existe: o sitemap do Índice era servido por um processo Node no Render
// (renderizado a cada requisição, com ISR). Quando esse processo fica
// indisponível — suspensão por billing, cold start, 429/502 — o sitemap inteiro
// deixa de ser servido, mesmo sendo um arquivo imutável até a próxima ingestão.
// Um XML de sitemap não precisa de runtime: ele precisa existir.
//
// Este módulo calcula o mesmo conjunto de URLs que o app
// (`src/lib/data.ts: iterarCaminhos`) e o serializa em XML, para que o artefato
// possa ser servido por um host estático (Pages/R2/KV) sem depender do Render.
//
// Escopo: só geração e validação. Nada aqui publica, apaga ou altera dados.

export const BASE = 'https://filtraai.com/indice';
export const POR_ARQUIVO = 10_000;

// Mesma regra de src/lib/data.ts (MIN_MUNICIPIOS_RANKING_UF): um ranking por UF
// só é publicado quando há municípios suficientes para comparação.
export const MIN_MUNICIPIOS_RANKING_UF = 10;

const esc = (valor) =>
  String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const compararPtBr = (a, b) => a.localeCompare(b, 'pt-BR');
const caminho = (p) => (p === '/' ? BASE : `${BASE}${p}`);

/**
 * Lista determinística dos caminhos indexáveis, na mesma regra de publicação do app:
 * base, UFs com dados, municípios com ao menos uma célula publicada, células com
 * `ativos >= minimoParaIndexar`, rankings de aberturas de anos fechados e
 * rankings de ativos (nacional e por UF com pelo menos 10 municípios).
 */
export function caminhosIndexaveis({ meta, municipios, stats, rankings }) {
  const minimo = meta.minimoParaIndexar;
  const nomeDoMunicipio = new Map(municipios.map((m) => [`${m.uf}/${m.slug}`, m.nome]));
  const caminhos = ['/', '/metodologia', '/rankings/aberturas', '/rankings/ativos'];

  const temCelula = (sigla, mun) =>
    meta.segmentos.some((seg) => (stats[sigla][mun][seg.slug]?.a ?? 0) >= minimo);

  const ufsComDados = Object.keys(stats)
    .sort()
    .filter((sigla) => Object.keys(stats[sigla]).some((mun) => temCelula(sigla, mun)));

  for (const sigla of ufsComDados) {
    const uf = sigla.toLowerCase();
    const municipiosPublicados = Object.keys(stats[sigla])
      .filter((mun) => nomeDoMunicipio.has(`${sigla}/${mun}`))
      .filter((mun) => temCelula(sigla, mun))
      .sort((a, b) => compararPtBr(nomeDoMunicipio.get(`${sigla}/${a}`), nomeDoMunicipio.get(`${sigla}/${b}`)));

    caminhos.push(`/${uf}`);
    for (const mun of municipiosPublicados) {
      caminhos.push(`/${uf}/${mun}`);
      const celulas = meta.segmentos
        .map((seg) => ({ slug: seg.slug, a: stats[sigla][mun][seg.slug]?.a ?? 0 }))
        .filter((c) => c.a >= minimo)
        .sort((a, b) => b.a - a.a || a.slug.localeCompare(b.slug));
      for (const celula of celulas) caminhos.push(`/${uf}/${mun}/${celula.slug}`);
    }
  }

  // Rankings de aberturas: apenas anos fechados com base suficiente.
  for (const seg of meta.segmentos) {
    const anos = rankings
      .anosPublicados(meta, stats, seg.slug)
      .filter((ano) => rankings.podePublicar(rankings.calcularRanking(stats, seg.slug, ano)));
    for (const ano of anos) caminhos.push(`/rankings/aberturas/${seg.slug}/${ano}`);
  }

  // Rankings de ativos: nacional por segmento + UF com pelo menos 10 municípios.
  for (const seg of meta.segmentos) {
    const porUF = new Map();
    let municipiosNoSegmento = 0;
    for (const sigla of Object.keys(stats).sort()) {
      for (const mun of Object.keys(stats[sigla])) {
        if ((stats[sigla][mun][seg.slug]?.a ?? 0) < minimo) continue;
        municipiosNoSegmento += 1;
        porUF.set(sigla, (porUF.get(sigla) ?? 0) + 1);
      }
    }
    if (!municipiosNoSegmento) continue;
    caminhos.push(`/rankings/ativos/${seg.slug}`);
    for (const sigla of [...porUF.keys()].sort()) {
      if (porUF.get(sigla) >= MIN_MUNICIPIOS_RANKING_UF) {
        caminhos.push(`/rankings/ativos/${seg.slug}/${sigla.toLowerCase()}`);
      }
    }
  }
  return caminhos;
}

/** Divide os caminhos em shards de até `porArquivo` URLs, preservando a ordem. */
export function dividirShards(caminhos, porArquivo = POR_ARQUIVO) {
  if (!Number.isInteger(porArquivo) || porArquivo < 1) throw new Error('porArquivo inválido');
  const shards = [];
  for (let i = 0; i < caminhos.length; i += porArquivo) shards.push(caminhos.slice(i, i + porArquivo));
  return shards.length ? shards : [[]];
}

/** XML de um shard (`<urlset>`) com `lastmod` por URL. */
export function xmlUrlset(caminhos, lastmodDe) {
  const urls = caminhos
    .map((p) => `  <url><loc>${esc(caminho(p))}</loc><lastmod>${esc(lastmodDe(p))}</lastmod></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** XML do índice (`<sitemapindex>`) com os shards deste artefato. */
export function xmlSitemapIndex(quantidade, lastmod) {
  const itens = Array.from(
    { length: quantidade },
    (_, id) => `  <sitemap><loc>${esc(`${BASE}/sitemap/${id}.xml`)}</loc><lastmod>${esc(lastmod)}</lastmod></sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</sitemapindex>\n`;
}

/** `lastmod` de uma página: valor real de lastmod.json ou a data de geração da base. */
export function criarLastmodDe(mapaLastmod, geradoEm) {
  return (p) => {
    const entrada = mapaLastmod?.[p];
    const data = entrada ? entrada.split('|')[1] : undefined;
    return data || geradoEm;
  };
}
/**
 * Checagens de integridade de um artefato já serializado.
 * Devolve a lista de erros; vazia significa íntegro.
 */
export function validarArtefato({ caminhos, shards, xmlIndex, porArquivo = POR_ARQUIVO, lastmodDe }) {
  const erros = [];
  const totalShards = Number((xmlIndex.match(/<sitemap>/g) ?? []).length);
  if (totalShards !== shards.length) erros.push(`índice declara ${totalShards} shards, artefato tem ${shards.length}`);

  const urls = shards.flat();
  if (urls.length !== caminhos.length) erros.push(`artefato tem ${urls.length} URLs, esperado ${caminhos.length}`);

  const vistos = new Set();
  for (const url of urls) {
    if (vistos.has(url)) erros.push(`URL duplicada: ${url}`);
    vistos.add(url);
    if (!url.startsWith('/')) erros.push(`caminho relativo inválido: ${url}`);
    if (/[?#]/.test(url)) erros.push(`URL com parâmetro ou fragmento: ${url}`);
    if (url !== '/' && url.endsWith('/')) erros.push(`URL com barra final: ${url}`);
  }

  for (const [i, shard] of shards.entries()) {
    if (shard.length > porArquivo) erros.push(`shard ${i} tem ${shard.length} URLs (limite ${porArquivo})`);
    if (shard.length === 0) erros.push(`shard ${i} está vazio`);
    const xml = xmlUrlset(shard, lastmodDe);
    if (Buffer.byteLength(xml) > 50 * 1024 * 1024) erros.push(`shard ${i} excede 50 MB`);
    const ocorrencias = (xml.match(/<loc>/g) ?? []).length;
    if (ocorrencias !== shard.length) erros.push(`shard ${i}: ${ocorrencias} <loc> para ${shard.length} URLs`);
    if (!xmlIndex.includes(`${BASE}/sitemap/${i}.xml`)) erros.push(`índice não declara o shard ${i}`);
  }
  return erros;
}
