// Funções puras para agregar o UK Business Counts (ONS, via Nomis, dataset NM_142_1).
// Sem rede e sem disco: o ingestor chama estas funções e os testes as exercitam.

/** Faixas de tamanho do Nomis -> índice das 6 faixas publicadas. 40 = "Large (250+)". */
export const FAIXA_PARA_INDICE = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 40: 5 };

/** Divide uma linha CSV com campos entre aspas. */
export function campos(linha) {
  const out = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') { atual += '"'; i += 1; } else if (c === '"') aspas = false; else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { out.push(atual); atual = ''; } else atual += c;
  }
  out.push(atual);
  return out;
}

/** CSV do Nomis -> lista de objetos pelo cabeçalho (minúsculo). */
export function parseCsv(texto) {
  const linhas = texto.replace(/\r/g, '').split('\n').filter(Boolean);
  if (!linhas.length) return [];
  const cab = campos(linhas[0]).map((h) => h.toLowerCase());
  return linhas.slice(1).map((l) => Object.fromEntries(campos(l).map((v, i) => [cab[i], v])));
}

export const slugify = (nome) =>
  nome
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Autoridades: slug por nome, com o código GSS como desempate quando o nome repete dentro da nação. */
export function montarAutoridades(lista, nacaoDoCodigo) {
  const usados = new Map();
  const base = lista
    .map((g) => ({ codigo: g.codigo, nome: g.nome.trim(), nation: nacaoDoCodigo(g.codigo) }))
    .filter((g) => g.nation);
  for (const g of base) usados.set(`${g.nation}/${slugify(g.nome)}`, (usados.get(`${g.nation}/${slugify(g.nome)}`) || 0) + 1);
  return base.map((g) => {
    const s = slugify(g.nome);
    return { nation: g.nation, slug: usados.get(`${g.nation}/${s}`) > 1 ? `${s}-${g.codigo.toLowerCase()}` : s, nome: g.nome, codigo: g.codigo };
  });
}

/**
 * Agrega as linhas de UMA autoridade (industry_code, employment_sizeband, obs_value) por categoria.
 * Retorna { slug: { e, sz[6] } }. `e` vem da faixa 0 (total); sz das faixas 1..6 e 40.
 */
export function agregarAutoridade(linhas, segmentos, codigosVistos) {
  const porCodigo = new Map();
  for (const l of linhas) {
    const cod = String(l.industry_code || '').trim();
    if (!/^\d{5}$/.test(cod)) continue;
    codigosVistos?.add(cod);
    const v = Number(l.obs_value);
    if (!Number.isFinite(v) || v < 0) continue;
    const faixa = Number(l.employment_sizeband);
    let reg = porCodigo.get(cod);
    if (!reg) porCodigo.set(cod, (reg = { e: 0, sz: [0, 0, 0, 0, 0, 0] }));
    if (faixa === 0) reg.e += v;
    else if (faixa in FAIXA_PARA_INDICE) reg.sz[FAIXA_PARA_INDICE[faixa]] += v;
  }
  const out = {};
  for (const seg of segmentos) {
    const reg = { e: 0, sz: [0, 0, 0, 0, 0, 0] };
    for (const cod of seg.sic) {
      const r = porCodigo.get(cod);
      if (!r) continue;
      reg.e += r.e;
      r.sz.forEach((x, i) => { reg.sz[i] += x; });
    }
    if (reg.e > 0) out[seg.slug] = reg;
  }
  return out;
}
