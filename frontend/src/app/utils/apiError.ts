/** Extrai mensagem legível de respostas de erro da API (inclui fields do validateBody). */

export type ApiErrorBody = {
  error?: string;
  fields?: Record<string, string>;
  message?: string;
};

export async function readApiError(res: Response, fallback = 'Erro na requisição.'): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorBody;
    if (data.fields && typeof data.fields === 'object') {
      const parts = Object.values(data.fields).filter(Boolean);
      if (parts.length) return parts.join(' · ');
    }
    if (data.error) return String(data.error);
    if (data.message) return String(data.message);
  } catch {
    /* body não-JSON */
  }
  return `${fallback} (${res.status})`;
}
