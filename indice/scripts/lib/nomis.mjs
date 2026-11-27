// Funções puras para agregar o UK Business Counts (ONS, via Nomis, dataset NM_141_1).
// NM_141_1 = local units (workplaces), NÃO NM_142_1 = enterprises. Ver teste de regressão.
// Sem rede e sem disco: o ingestor chama estas funções e os testes as exercitam.

/** Série oficial usada em todo o ingestor e nos metadados. */
export const DATASET = 'NM_141_1';
export const UNIDADE = 'local units';
export const API = `https://www.nomisweb.co.uk/api/v01/dataset/${DATASET}.data.csv`;
export const COMUM = 'date=latest&legal_status=0&measures=20100';
/** Códigos de faixa detalhados 0..9. 10/20/30/40 são agregados derivados e não entram (evitam dupla contagem). */
export const FAIXAS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Faixas detalhadas do Nomis -> índice das 6 faixas publicadas. 7/8/9 compõem "100+". */
export const FAIXA_PARA_INDICE = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5, 8: 5, 9: 5 };

/** URL da lista de autoridades (total geral, faixa 0). */
export function urlAutoridades() {
  return `${API}?geography=TYPE424&${COMUM}&industry=37748736&employment_sizeband=0&select=geography_code,geography_name,date_name,obs_value&recordlimit=3000`;
}

/** URL de uma autoridade, com todas as classes SIC e faixas detalhadas. */
export function urlAutoridade(codigo) {
  return `${API}?geography=${encodeURIComponent(codigo)}&${COMUM}&employment_sizeband=${FAIXAS.join(',')}&select=industry_code,employment_sizeband,obs_value&recordlimit=30000`;
}

/**
 * Lê uma contagem do Nomis sem transformar ausência/supressão em zero.
 * O Nomis pode devolver vazio, N, S, X ou "-" em vez de uma contagem.
 * @returns {{valor:number|null,status:'suppressed'|'unavailable'|'not_applicable'|'invalid'|null}}
 */
export function lerContagemNomis(valor) {
  const texto = String(valor ?? '').trim();
  if (/^\d+$/.test(texto)) return { valor: Number(texto), status: null };
  const status = texto === 'S' ? 'suppressed'
    : texto === 'N' ? 'unavailable'
      : texto === 'X' ? 'not_applicable'
        : 'invalid';
  return { valor: null, status };
}

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
 * Retorna { slug: { e, eStatus?, sz[6], szStatus? } }. `e` vem da faixa 0 (total);
 * sz das faixas 1..9. Valores ausentes/suprimidos ficam null, nunca zero.
 */
export function agregarAutoridade(linhas, segmentos, codigosVistos) {
  const porCodigo = new Map();
  for (const l of linhas) {
    const cod = String(l.industry_code || '').trim();
    if (!/^\d{5}$/.test(cod)) continue;
    codigosVistos?.add(cod);
    const faixa = Number(l.employment_sizeband);
    let reg = porCodigo.get(cod);
    if (!reg) porCodigo.set(cod, (reg = { e: 0, eStatus: null, sz: [0, 0, 0, 0, 0, 0], szStatus: null }));
    const leitura = lerContagemNomis(l.obs_value);
    if (faixa === 0) {
      if (leitura.valor === null) {
        if (reg.e !== null) reg.eStatus = reg.e === 0 ? leitura.status : 'partial';
        reg.e = null;
      } else if (reg.e !== null) {
        reg.e += leitura.valor;
      }
    } else if (faixa in FAIXA_PARA_INDICE) {
      const i = FAIXA_PARA_INDICE[faixa];
      if (leitura.valor === null) {
        if (reg.sz[i] !== null) reg.szStatus = reg.sz[i] === 0 ? leitura.status : 'partial';
        reg.sz[i] = null;
      } else if (reg.sz[i] !== null) {
        reg.sz[i] += leitura.valor;
      }
    }
  }
  const out = {};
  for (const seg of segmentos) {
    const reg = { e: 0, eStatus: null, sz: [0, 0, 0, 0, 0, 0], szStatus: null };
    for (const cod of seg.sic) {
      const r = porCodigo.get(cod);
      if (!r) continue;
      if (r.e === null) {
        if (reg.e !== null) reg.eStatus = 'partial';
        reg.e = null;
      } else if (reg.e !== null) {
        reg.e += r.e;
      }
      r.sz.forEach((x, i) => {
        if (x === null) {
          if (reg.sz[i] !== null) reg.szStatus = 'partial';
          reg.sz[i] = null;
        } else if (reg.sz[i] !== null) {
          reg.sz[i] += x;
        }
      });
    }
    const preenchidos = reg.sz.filter((x) => x !== null).length;
    if (preenchidos === 6) {
      const soma = reg.sz.reduce((t, x) => t + (x ?? 0), 0);
      reg.szStatus = soma === reg.e ? 'complete' : 'rounded';
    } else {
      reg.szStatus = preenchidos === 0 ? (reg.szStatus || 'unavailable') : 'partial';
    }
    if (typeof reg.e === 'number' && reg.e > 0) out[seg.slug] = reg;
  }
  return out;
}
