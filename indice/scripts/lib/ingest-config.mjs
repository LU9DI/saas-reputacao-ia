// Regras de configuração da ingestão que precisam falhar antes de qualquer download.
// O espelho da Receita em public.php/webdav usa o token do link público como usuário
// (senha vazia). Sem o token, o curl seguiria sem autenticação e a falha remota seria
// opaca; por isso a ingestão remota é bloqueada de forma explícita.

export const CAMINHO_WEBDAV = '/public.php/webdav';

/**
 * Retorna a mensagem de bloqueio quando o download remoto exige token e ele não está
 * configurado. Retorna null quando o acesso pode prosseguir (token presente, base URL
 * sem WebDAV ou uso de arquivos locais).
 */
export function bloqueioTokenWebdav({ baseUrl, token, local = false }) {
  if (local) return null;
  if (!String(baseUrl).includes(CAMINHO_WEBDAV)) return null;
  if (String(token ?? '').trim()) return null;
  return (
    'INDICE_RFB_SHARE_TOKEN não configurado. O endereço padrão da Receita ' +
    '(arquivos.receitafederal.gov.br/public.php/webdav) exige o token do link público. ' +
    'Configure o segredo no repositório ou use --local/--base-url. Nenhum download foi iniciado.'
  );
}
