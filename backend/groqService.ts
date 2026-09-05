/**
 * Camada de IA com failover:
 * 1) Tenta Groq (rápido / barato)
 * 2) Se falhar por cota, rate limit, auth ou erro de servidor → Gemini
 *
 * Variáveis:
 *   GROQ_API_KEY, GROQ_MODEL
 *   GEMINI_API_KEY, GEMINI_MODEL (padrão: gemini-2.0-flash)
 *   AI_PROVIDER_ORDER=groq,gemini  (opcional)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_BASE =
  process.env.GEMINI_API_BASE ||
  'https://generativelanguage.googleapis.com/v1beta';

export type AiProvider = 'groq' | 'gemini';

export type AiCallResult = {
  text: string;
  provider: AiProvider;
};

function groqKey(): string {
  return (process.env.GROQ_API_KEY || '').trim();
}
function geminiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

/** Providers configurados, na ordem de preferência. */
export function listAiProviders(): AiProvider[] {
  const order = (process.env.AI_PROVIDER_ORDER || 'groq,gemini')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AiProvider => s === 'groq' || s === 'gemini');

  const available: AiProvider[] = [];
  for (const p of order.length ? order : (['groq', 'gemini'] as AiProvider[])) {
    if (p === 'groq' && groqKey()) available.push('groq');
    if (p === 'gemini' && geminiKey()) available.push('gemini');
  }
  return available;
}

export function aiConfigured(): boolean {
  return listAiProviders().length > 0;
}

function shouldFailover(status: number, body: string): boolean {
  // cota / rate limit / pagamento / indisponível / auth inválida
  if ([401, 402, 403, 429, 500, 502, 503, 504].includes(status)) return true;
  const b = body.toLowerCase();
  return (
    b.includes('rate limit') ||
    b.includes('quota') ||
    b.includes('insufficient') ||
    b.includes('billing') ||
    b.includes('credit') ||
    b.includes('resource_exhausted') ||
    b.includes('exceeded')
  );
}

async function callGroq(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const key = groqKey();
  if (!key) throw new Error('GROQ_API_KEY não configurada');

  const body = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const errorText = response.ok ? '' : await response.text();
  if (!response.ok) {
    const err: any = new Error(`Groq API error ${response.status}: ${errorText}`);
    err.status = response.status;
    err.body = errorText;
    err.failover = shouldFailover(response.status, errorText);
    throw err;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq retornou resposta vazia');
  return String(text).trim();
}

async function callGemini(
  system: string,
  user: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const key = geminiKey();
  if (!key) throw new Error('GEMINI_API_KEY não configurada');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  // Gemini: systemInstruction + contents
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const errorText = response.ok ? '' : await response.text();
  if (!response.ok) {
    const err: any = new Error(`Gemini API error ${response.status}: ${errorText}`);
    err.status = response.status;
    err.body = errorText;
    throw err;
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  if (!text.trim()) throw new Error('Gemini retornou resposta vazia');
  return text.trim();
}

/**
 * Chama o primeiro provider disponível; em falha "recuperável" tenta o próximo.
 */
export async function callAI(
  system: string,
  user: string,
  maxTokens = 180,
  temperature = 0.6
): Promise<AiCallResult> {
  const providers = listAiProviders();
  if (!providers.length) {
    throw new Error(
      'Nenhuma IA configurada. Defina GROQ_API_KEY e/ou GEMINI_API_KEY no .env'
    );
  }

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const text =
        provider === 'groq'
          ? await callGroq(system, user, maxTokens, temperature)
          : await callGemini(system, user, maxTokens, temperature);

      if (i > 0) {
        console.warn(`[IA] Fallback ativo: usando ${provider}`);
      }
      return { text, provider };
    } catch (e: any) {
      lastError = e;
      const canTryNext =
        i < providers.length - 1 && (e?.failover !== false ? true : false);

      // Sempre tenta o próximo se ainda houver provider
      if (canTryNext) {
        console.warn(
          `[IA] ${provider} falhou (${e?.status || e?.message}) → tentando próximo...`
        );
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('Falha em todos os providers de IA');
}

/** Atalho que devolve só o texto (compatível com código antigo). */
async function callLLM(
  system: string,
  user: string,
  maxTokens = 180,
  temperature = 0.6
): Promise<string> {
  const r = await callAI(system, user, maxTokens, temperature);
  return r.text;
}

export async function gerarRespostaReview(
  nomeCliente: string,
  rating: number,
  comment: string,
  nomeEmpresa?: string,
  exemplosEstilo?: string
): Promise<string> {
  const local = nomeEmpresa ? ` do estabelecimento "${nomeEmpresa}"` : '';

  let system =
    'Você responde avaliações negativas de clientes de forma empática, profissional e breve (máximo 3 frases). Peça desculpas quando apropriado e indique que a equipe vai analisar. Não invente políticas ou promessas específicas.';

  if (exemplosEstilo && exemplosEstilo.trim().length > 20) {
    system += `\n\nImite o estilo de escrita do dono do negócio com base nestes exemplos de respostas anteriores dele:\n---\n${exemplosEstilo.slice(0, 1500)}\n---\nMantenha o mesmo tom, vocabulário e formalidade.`;
  }

  const prompt = `Cliente: ${nomeCliente || 'Anônimo'}
Nota: ${rating}/5
Comentário: ${comment}

Escreva uma resposta curta para esta avaliação negativa${local}.`;

  return callLLM(system, prompt);
}

export async function gerarTagsSemanticas(
  rating: number,
  comment: string
): Promise<string[]> {
  if (!comment || comment.trim().length < 3) {
    if (rating >= 4) return ['#ExperienciaPositiva'];
    if (rating <= 2) return ['#ExperienciaNegativa'];
    return ['#Neutro'];
  }

  const system = `Você analisa avaliações de estabelecimentos comerciais.
Retorne APENAS um JSON array de 1 a 5 tags em português no formato hashtag CamelCase, sem espaços.
Exemplos válidos: ["#AtendimentoRuim","#ComidaExcelente","#PrecoAlto","#AmbienteAgradavel"]
Não explique. Não use markdown. Apenas o array JSON.`;

  const user = `Nota: ${rating}/5
Comentário: ${comment}`;
  const raw = await callLLM(system, user, 120, 0.3);

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t: unknown) => String(t).trim())
      .filter((t: string) => t.startsWith('#') && t.length > 2 && t.length < 40)
      .slice(0, 5);
  } catch {
    const matches = raw.match(/#[\wÀ-ú]+/g);
    return matches ? matches.slice(0, 5) : [];
  }
}
