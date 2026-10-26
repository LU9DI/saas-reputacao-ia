// Regras de configuração e higiene de logs da ingestão que precisam valer antes
// de qualquer download.
//
// O espelho da Receita em public.php/webdav usa o token do link público como
// usuário (senha vazia). Sem o token, o curl seguiria sem autenticação e a falha
// remota seria opaca; por isso a ingestão remota é bloqueada de forma explícita.
//
// O token nunca deve aparecer em argv, URLs logadas, stdout/stderr ou mensagens de
// erro. As funções abaixo concentram a validação e a redaction usadas pelo ingest.

export const CAMINHO_WEBDAV = '/public.php/webdav';
export const VARIAVEL_TOKEN = 'INDICE_RFB_SHARE_TOKEN';
export const MASCARA = '***';

const CHAVES_SENSIVEIS =
  /^(token|access_token|auth|authorization|password|senha|secret|segredo|key|api_key|signature|sig|x-amz-signature|x-amz-credential)$/i;

/**
 * Retorna a mensagem de bloqueio quando o download remoto exige token e ele não
 * está configurado. Retorna null quando o acesso pode prosseguir (token presente,
 * base URL sem WebDAV ou uso de arquivos locais).
 */
export function bloqueioTokenWebdav({ baseUrl, token, local = false }) {
  if (local) return null;
  if (!String(baseUrl).includes(CAMINHO_WEBDAV)) return null;
  if (String(token ?? '').trim()) return null;
  return (
    `${VARIAVEL_TOKEN} não configurado. O endereço padrão da Receita ` +
    '(arquivos.receitafederal.gov.br/public.php/webdav) exige o token do link público. ' +
    'Configure o segredo no repositório ou use --local/--base-url. Nenhum download foi iniciado.'
  );
}

/** true quando a URL usa o WebDAV da Receita e, portanto, exige o token. */
export function precisaAuthWebdav(url) {
  try {
    return new URL(String(url)).pathname.includes(CAMINHO_WEBDAV);
  } catch {
    return false;
  }
}

/**
 * Configuração lida pelo curl via `-K -` (stdin). Mantém o token fora de argv e
 * de qualquer URL, ao contrário de `-u token:`.
 */
export function configuracaoAuthCurl(token) {
  const valor = String(token ?? '');
  if (!valor.trim()) return '';
  return `user = "${valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}:"\n`;
}

/** Remove credenciais e parâmetros sensíveis de uma URL antes de registrá-la. */
export function mascararUrl(url, token = '') {
  const original = String(url ?? '');
  let saida = original;
  try {
    const u = new URL(original);
    u.username = '';
    u.password = '';
    for (const chave of [...u.searchParams.keys()]) {
      if (CHAVES_SENSIVEIS.test(chave)) u.searchParams.set(chave, MASCARA);
    }
    saida = u.toString();
  } catch {
    // URL relativa ou inválida: a redaction textual abaixo ainda protege o token.
  }
  return redigirSegredo(saida, token);
}

/**
 * Substitui ocorrências literais de segredos por máscara em logs e erros.
 * Aceita vários segredos e também a forma percent-encoded (token em URL).
 */
export function redigirSegredo(texto, ...segredos) {
  let saida = String(texto ?? '');
  for (const bruto of segredos.flat()) {
    const segredo = String(bruto ?? '').trim();
    if (!segredo) continue;
    const formas = new Set([segredo, encodeURIComponent(segredo)]);
    for (const forma of formas) {
      if (forma) saida = saida.split(forma).join(MASCARA);
    }
  }
  return saida;
}
