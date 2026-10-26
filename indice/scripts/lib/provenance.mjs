const SHA256 = /^[a-f0-9]{64}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function isSafeSourceUrl(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username && !url.password &&
      !url.search && !url.hash;
  } catch {
    return false;
  }
}

/**
 * Historical metadata may explicitly disclose that hashes were not captured.
 * Newly ingested datasets must carry a complete, structurally valid SHA-256 manifest.
 */
export function validarProveniencia(meta) {
  const problemas = [];
  const exigir = (condicao, mensagem) => { if (!condicao) problemas.push(mensagem); };
  const proveniencia = meta?.proveniencia;

  exigir(proveniencia && typeof proveniencia === 'object' && !Array.isArray(proveniencia),
    'meta.proveniencia deve declarar o estado da proveniência.');

  if (!proveniencia || typeof proveniencia !== 'object' || Array.isArray(proveniencia)) {
    return problemas;
  }

  if (proveniencia.status === 'nao_capturada_na_geracao') {
    exigir(typeof proveniencia.motivo === 'string' && proveniencia.motivo.trim().length > 0,
      'proveniencia histórica precisa explicar por que os hashes não foram capturados.');
    exigir(proveniencia.arquivosFonte === undefined ||
      (Array.isArray(proveniencia.arquivosFonte) && proveniencia.arquivosFonte.length === 0),
      'proveniência histórica não pode declarar arquivosFonte como se fossem hashes verificados.');
    return problemas;
  }

  exigir(proveniencia.status === 'verificada', 'proveniencia.status deve ser verificada ou nao_capturada_na_geracao.');
  exigir(proveniencia.algoritmo === 'SHA-256', 'proveniencia.algoritmo deve ser SHA-256.');
  const arquivos = proveniencia.arquivosFonte;
  exigir(Array.isArray(arquivos) && arquivos.length >= 3,
    'proveniencia.arquivosFonte deve conter Cnaes.zip, Municipios.zip e ao menos um EstabelecimentosN.zip.');

  if (!Array.isArray(arquivos)) return problemas;

  const nomes = new Set();
  let temCnaes = false;
  let temMunicipios = false;
  let estabelecimentos = 0;
  for (const [i, item] of arquivos.entries()) {
    const prefixo = `proveniencia.arquivosFonte[${i}]`;
    exigir(item && typeof item === 'object' && !Array.isArray(item), `${prefixo} deve ser um objeto.`);
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    exigir(typeof item.arquivo === 'string' && item.arquivo.trim().length > 0, `${prefixo}.arquivo é obrigatório.`);
    exigir(!nomes.has(item.arquivo), `${prefixo}.arquivo duplicado: ${item.arquivo}.`);
    if (item.arquivo) nomes.add(item.arquivo);
    exigir(['estabelecimentos', 'cnaes', 'municipios'].includes(item.tipo), `${prefixo}.tipo inválido.`);
    exigir(Number.isSafeInteger(item.bytes) && item.bytes > 0, `${prefixo}.bytes deve ser inteiro positivo.`);
    exigir(typeof item.sha256 === 'string' && SHA256.test(item.sha256), `${prefixo}.sha256 deve conter 64 caracteres hexadecimais minúsculos.`);
    exigir(Object.hasOwn(item, 'url') && isSafeSourceUrl(item.url), `${prefixo}.url deve ser HTTPS sem credenciais, query ou fragmento, ou null explícito para arquivo local.`);

    if (item.arquivo === 'Cnaes.zip' && item.tipo === 'cnaes') temCnaes = true;
    if (item.arquivo === 'Municipios.zip' && item.tipo === 'municipios') temMunicipios = true;
    if (/^Estabelecimentos\d+\.zip$/.test(item.arquivo) && item.tipo === 'estabelecimentos') estabelecimentos += 1;
  }

  exigir(temCnaes, 'manifesto sem Cnaes.zip do tipo cnaes.');
  exigir(temMunicipios, 'manifesto sem Municipios.zip do tipo municipios.');
  exigir(estabelecimentos >= 1, 'manifesto precisa conter ao menos um EstabelecimentosN.zip do tipo estabelecimentos.');
  exigir(estabelecimentos === meta.arquivosEstabelecimentos,
    'quantidade de ZIPs Estabelecimentos no manifesto deve corresponder a meta.arquivosEstabelecimentos.');
  exigir(MONTH.test(meta.competencia || ''), 'competencia inválida para proveniência.');
  return problemas;
}
