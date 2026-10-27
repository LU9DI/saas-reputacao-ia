// Agregação do cadastro aberto de CNPJ (arquivo "Estabelecimentos") por UF x município x segmento.
//
// Só contagens agregadas saem daqui. A linha CSV é dividida em campos para localizar
// as colunas necessárias; nome fantasia, endereço, telefone e e-mail não são usados
// nos cálculos nem retidos nos agregados ou publicados.
//
// LAYOUT: as posições abaixo seguem o layout publicado pela Receita Federal para
// o arquivo Estabelecimentos (CSV sem cabeçalho, ";" como separador, campos entre
// aspas, ISO-8859-1). Não foi possível verificar o PDF oficial de metadados ao
// escrever este código, por isso `validarLayout` confere amostras reais antes de
// qualquer agregação e a ingestão aborta se algo não bater.

export const COL = {
  MATRIZ_FILIAL: 3, // 1 = matriz, 2 = filial
  SITUACAO: 5, // 1 nula, 2 ativa, 3 suspensa, 4 inapta, 8 baixada
  DATA_SITUACAO: 6, // AAAAMMDD
  DATA_INICIO: 10, // AAAAMMDD
  CNAE_PRINCIPAL: 11, // 7 dígitos
  UF: 19,
  MUNICIPIO: 20, // código da Receita (não é o código do IBGE)
};
export const TOTAL_COLUNAS = 30;

const SITUACAO_ATIVA = 2;
const SITUACAO_BAIXADA = 8;

export function normalizaTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function slugify(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Linha do CSV da Receita -> campos. Retorna null se a linha não parece uma linha de dados. */
export function parseLinha(linha) {
  if (!linha || linha.length < 20 || linha.charCodeAt(0) !== 34) return null;
  const fim = linha.endsWith('"') ? linha.length - 1 : linha.length;
  return linha.slice(1, fim).split('";"');
}

function dataValidaAAAAMMDD(texto) {
  if (!/^\d{8}$/.test(texto || '')) return false;
  const ano = Number(texto.slice(0, 4));
  const mes = Number(texto.slice(4, 6));
  const dia = Number(texto.slice(6, 8));
  if (ano < 1900 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function dataNumerica(texto) {
  if (!dataValidaAAAAMMDD(texto)) return 0;
  const n = Number(texto);
  return n > 19000101 ? n : 0;
}

/** "2026-10" -> janelas de 12 meses fechados anteriores à competência. */
export function janelas(competencia) {
  const m = /^(\d{4})-(\d{2})$/.exec(competencia);
  if (!m || Number(m[1]) < 1900 || Number(m[2]) < 1 || Number(m[2]) > 12) {
    throw new Error(`Competência inválida: ${competencia} (esperado AAAA-MM com mês entre 01 e 12)`);
  }
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const inicioComp = ano * 10000 + mes * 100 + 1;
  const d = new Date(Date.UTC(ano, mes - 1 - 12, 1));
  const inicioJanela = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + 1;
  const fimJanelaMes = new Date(Date.UTC(ano, mes - 2, 1));
  return {
    inicioComp,
    inicioJanela,
    anoComp: ano,
    anoInicialSerie: ano - 10,
    rotuloJanela: {
      inicio: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      fim: `${fimJanelaMes.getUTCFullYear()}-${String(fimJanelaMes.getUTCMonth() + 1).padStart(2, '0')}`,
    },
  };
}

/** Confere se uma linha respeita o layout esperado. Retorna lista de problemas (vazia = ok). */
export function validarLayout(campos) {
  const problemas = [];
  if (!campos || campos.length !== TOTAL_COLUNAS) {
    problemas.push(`esperava ${TOTAL_COLUNAS} colunas, encontrou ${campos ? campos.length : 0}`);
    return problemas;
  }
  if (!/^[12]$/.test(campos[COL.MATRIZ_FILIAL])) problemas.push(`coluna ${COL.MATRIZ_FILIAL} (matriz/filial) = "${campos[COL.MATRIZ_FILIAL]}"`);
  if (!/^0?[1-4]$|^0?8$/.test(campos[COL.SITUACAO])) problemas.push(`coluna ${COL.SITUACAO} (situação) = "${campos[COL.SITUACAO]}"`);
  if (!/^\d{7}$/.test(campos[COL.CNAE_PRINCIPAL])) problemas.push(`coluna ${COL.CNAE_PRINCIPAL} (CNAE) = "${campos[COL.CNAE_PRINCIPAL]}"`);
  if (!/^[A-Z]{2}$/.test(campos[COL.UF])) problemas.push(`coluna ${COL.UF} (UF) = "${campos[COL.UF]}"`);
  if (!/^\d{1,5}$/.test(campos[COL.MUNICIPIO])) problemas.push(`coluna ${COL.MUNICIPIO} (município) = "${campos[COL.MUNICIPIO]}"`);
  for (const coluna of [COL.DATA_SITUACAO, COL.DATA_INICIO]) {
    const valor = campos[coluna];
    if (valor !== '0' && valor !== '00000000' && valor !== '' && !dataValidaAAAAMMDD(valor)) {
      problemas.push(`coluna ${coluna} (data AAAAMMDD) inválida = "${valor}"`);
    }
  }
  return problemas;
}

export function novoRegistro() {
  return { a: 0, m: 0, ab: 0, ba: 0, ano: {}, sub: {} };
}

/**
 * Agregador em streaming.
 * @param {{slug:string, classes:string[]}[]} segmentos
 * @param {string} competencia AAAA-MM
 */
export function criarAgregador(segmentos, competencia) {
  const j = janelas(competencia);
  const classePara = new Map();
  for (const s of segmentos) for (const c of s.classes) classePara.set(c, s.slug);
  const dados = new Map(); // "UF|codigo" -> { [slugSegmento]: registro }
  let lidas = 0;
  let usadas = 0;
  let malformadas = 0;

  function ingerir(campos) {
    lidas += 1;
    if (!campos || campos.length !== TOTAL_COLUNAS) {
      malformadas += 1; // linha truncada ou com quebra dentro de campo: descartada e contada
      return;
    }
    const cnae = campos[COL.CNAE_PRINCIPAL];
    const seg = classePara.get(cnae.slice(0, 4));
    if (!seg) return;
    const uf = campos[COL.UF];
    if (uf === 'EX') return; // exterior
    const chave = `${uf}|${campos[COL.MUNICIPIO]}`;
    let porSegmento = dados.get(chave);
    if (!porSegmento) {
      porSegmento = {};
      dados.set(chave, porSegmento);
    }
    const reg = porSegmento[seg] || (porSegmento[seg] = novoRegistro());
    usadas += 1;

    const situacao = Number(campos[COL.SITUACAO]);
    if (situacao === SITUACAO_ATIVA) {
      reg.a += 1;
      if (campos[COL.MATRIZ_FILIAL] === '1') reg.m += 1;
      reg.sub[cnae] = (reg.sub[cnae] || 0) + 1;
    }
    const inicio = dataNumerica(campos[COL.DATA_INICIO]);
    if (inicio) {
      const ano = Math.floor(inicio / 10000);
      if (ano >= j.anoInicialSerie && ano <= j.anoComp) reg.ano[ano] = (reg.ano[ano] || 0) + 1;
      if (inicio >= j.inicioJanela && inicio < j.inicioComp) reg.ab += 1;
    }
    if (situacao === SITUACAO_BAIXADA) {
      const dataSit = dataNumerica(campos[COL.DATA_SITUACAO]);
      if (dataSit >= j.inicioJanela && dataSit < j.inicioComp) reg.ba += 1;
    }
  }

  return { ingerir, dados, janela: j, contagem: () => ({ lidas, usadas, malformadas }) };
}

const MINUSCULAS = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'D']);
export function tituloCase(nome) {
  return String(nome)
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p.toUpperCase()) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

/** Resposta da API de localidades do IBGE -> [{id, nome, uf}]. Tolera as duas hierarquias conhecidas. */
export function ibgeParaLista(json) {
  const lista = [];
  for (const it of Array.isArray(json) ? json : []) {
    const uf =
      it?.microrregiao?.mesorregiao?.UF?.sigla ??
      it?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ??
      null;
    if (it?.id && it?.nome && uf) lista.push({ id: Number(it.id), nome: String(it.nome), uf: String(uf) });
  }
  return lista;
}

/**
 * Liga (UF, código da Receita) a um nome com acento e a um slug único dentro da UF.
 * @param {{uf:string, codigo:string}[]} pares
 * @param {Map<string,string>} nomesReceita codigo -> NOME EM MAIÚSCULAS SEM ACENTO
 * @param {{id:number, nome:string, uf:string}[]} ibge
 */
export function resolverMunicipios(pares, nomesReceita, ibge) {
  const indiceIbge = new Map();
  for (const m of ibge) indiceIbge.set(`${m.uf}|${normalizaTexto(m.nome)}`, m);
  const usados = new Set();
  const saida = [];
  for (const { uf, codigo } of pares) {
    const nomeReceita = nomesReceita.get(codigo);
    if (!nomeReceita) continue;
    const achado = indiceIbge.get(`${uf}|${normalizaTexto(nomeReceita)}`) || null;
    const nome = achado ? achado.nome : tituloCase(nomeReceita);
    let slug = slugify(nome);
    if (!slug) continue;
    if (usados.has(`${uf}|${slug}`)) slug = `${slug}-${codigo}`;
    usados.add(`${uf}|${slug}`);
    saida.push({ uf, codigo, nome, slug, ibge: achado ? achado.id : null, casouIbge: Boolean(achado) });
  }
  return saida;
}

/** Divide uma linha CSV simples (vírgula, aspas opcionais). */
function linhaCsv(l) {
  const out = [];
  let atual = '';
  let aspas = false;
  for (const ch of l) {
    if (ch === '"') aspas = !aspas;
    else if (ch === ',' && !aspas) { out.push(atual); atual = ''; }
    else atual += ch;
  }
  out.push(atual);
  return out;
}

/**
 * Alternativa ao IBGE: conjunto público (kelvins/municipios-brasileiros) com código IBGE, nome e UF.
 * Retorna o mesmo formato de `ibgeParaLista`: [{ id, nome, uf }].
 */
export function municipiosDeCsv(csvMunicipios, csvEstados) {
  const limpa = (t) => t.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const est = limpa(csvEstados);
  const he = linhaCsv(est[0]);
  const ufPorCodigo = new Map(est.slice(1).map((l) => {
    const c = linhaCsv(l);
    return [c[he.indexOf('codigo_uf')], c[he.indexOf('uf')]];
  }));
  const mun = limpa(csvMunicipios);
  const hm = linhaCsv(mun[0]);
  const iId = hm.indexOf('codigo_ibge');
  const iNome = hm.indexOf('nome');
  const iUf = hm.indexOf('codigo_uf');
  if (iId < 0 || iNome < 0 || iUf < 0) throw new Error('CSV de municípios sem as colunas esperadas');
  return mun.slice(1).map((l) => {
    const c = linhaCsv(l);
    return { id: Number(c[iId]), nome: c[iNome], uf: ufPorCodigo.get(c[iUf]) };
  }).filter((m) => m.id && m.nome && m.uf);
}
