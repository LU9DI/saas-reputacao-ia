// Fetch com retry limitado para falhas transitórias de rede.
//
// Motivo: `scripts/test-seo.mjs` faz ~240 mil verificações em uma única
// execução. Uma única falha de socket (ECONNRESET/EPIPE/timeout) abortava a
// suíte inteira com `TypeError: fetch failed`, sem indicar URL nem causa —
// observado duas vezes (P1.6 e P1.7) e nunca em condições reproduzíveis.
//
// Regras deliberadas:
// - somente erros de rede conhecidos são repetidos; erro HTTP (4xx/5xx) é
//   resposta e nunca é repetido nem convertido em sucesso;
// - o número de tentativas é explícito e finito (default 1 retry);
// - cada tentativa repetida é registrada por quem chamou (log injetado);
// - após esgotar, o erro original é relançado com `tentativas`/`codigo`,
//   de modo que a falha definitiva continua derrubando a execução.

const CODIGOS_TRANSITORIOS = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'EPIPE',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_CLOSED',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

// Percorre a cadeia de `cause` (undici aninha o erro de socket dentro de
// `TypeError: fetch failed`) e devolve o primeiro código transitoiro.
export function codigoTransitorio(error) {
  let atual = error;
  for (let i = 0; i < 5 && atual; i += 1) {
    const codigo = atual.code ?? atual.errno;
    if (typeof codigo === 'string' && CODIGOS_TRANSITORIOS.has(codigo)) return codigo;
    atual = atual.cause;
  }
  // `fetch failed` sem código legível ainda é falha de camada de rede.
  if (error instanceof TypeError && error.message === 'fetch failed') return 'FETCH_FAILED_SEM_CODIGO';
  return null;
}

export async function fetchComRetry(url, opcoes = {}, config = {}) {
  const tentativas = config.tentativas ?? 2;
  const esperaMs = config.esperaMs ?? 500;
  const log = config.log ?? (() => {});
  const dormir = config.dormir ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  if (!Number.isInteger(tentativas) || tentativas < 1) {
    throw new Error(`tentativas deve ser inteiro >= 1 (recebido ${tentativas})`);
  }

  let ultimoErro = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      return await fetch(url, opcoes);
    } catch (error) {
      const codigo = codigoTransitorio(error);
      if (!codigo) throw error; // erro funcional: propaga na primeira tentativa
      ultimoErro = error;
      if (tentativa === tentativas) break;
      log(`fetch transitório ${codigo} em ${url} (tentativa ${tentativa}/${tentativas}), repetindo em ${esperaMs}ms`);
      await dormir(esperaMs);
    }
  }

  const erro = ultimoErro instanceof Error ? ultimoErro : new Error(String(ultimoErro));
  erro.tentativas = tentativas;
  erro.codigo = codigoTransitorio(erro);
  throw erro;
}
