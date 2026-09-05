/**
 * Camada de IA com balanceamento + failover.
 *
 * Estratégias (AI_LOAD_BALANCE):
 *   round_robin  — alterna entre providers (padrão com 2+ keys)
 *   weighted     — sorteio por peso (AI_WEIGHT_GROQ / AI_WEIGHT_GEMINI)
 *   failover     — sempre o primeiro da lista; só troca se falhar
 *
 * Circuit breaker: após falhas seguidas, o provider “esfria” por N segundos
 * e o tráfego vai para o outro automaticamente.
 *
 * Env:
 *   GROQ_API_KEY, GROQ_MODEL
 *   GEMINI_API_KEY, GEMINI_MODEL
 *   AI_PROVIDER_ORDER=groq,gemini
 *   AI_LOAD_BALANCE=round_robin|weighted|failover
 *   AI_WEIGHT_GROQ=70
 *   AI_WEIGHT_GEMINI=30
 *   AI_CB_FAILURES=3          # falhas seguidas para abrir o circuito
 *   AI_CB_COOLDOWN_MS=60000   # tempo de cooldown
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_BASE =
  process.env.GEMINI_API_BASE ||
  'https://generativelanguage.googleapis.com/v1beta';

export type AiProvider = 'groq' | 'gemini';
export type LoadBalanceMode = 'round_robin' | 'weighted' | 'failover';

export type AiCallResult = {
  text: string;
  provider: AiProvider;
};

// ── Estado em memória (processo) ─────────────────────────────
let rrIndex = 0;

type ProviderStats = {
  success: number;
  fail: number;
  consecutiveFails: number;
  cooldownUntil: number;
  lastError?: string;
  lastUsedAt?: number;
};

const stats: Record<AiProvider, ProviderStats> = {
  groq: { success: 0, fail: 0, consecutiveFails: 0, cooldownUntil: 0 },
  gemini: { success: 0, fail: 0, consecutiveFails: 0, cooldownUntil: 0 },
};

function cbFailures(): number {
  return Math.max(1, Number(process.env.AI_CB_FAILURES || 3));
}
function cbCooldownMs(): number {
  return Math.max(1000, Number(process.env.AI_CB_COOLDOWN_MS || 60_000));
}

function markSuccess(p: AiProvider) {
  const s = stats[p];
  s.success += 1;
  s.consecutiveFails = 0;
  s.cooldownUntil = 0;
  s.lastUsedAt = Date.now();
}

function markFail(p: AiProvider, err: any) {
  const s = stats[p];
  s.fail += 1;
  s.consecutiveFails += 1;
  s.lastError = String(err?.message || err).slice(0, 200);
  s.lastUsedAt = Date.now();
  if (s.consecutiveFails >= cbFailures()) {
    s.cooldownUntil = Date.now() + cbCooldownMs();
    console.warn(
      `[IA] Circuit aberto em ${p} por ${cbCooldownMs()}ms após ${s.consecutiveFails} falhas`
    );
  }
}

function isCoolingDown(p: AiProvider): boolean {
  return Date.now() < stats[p].cooldownUntil;
}

export function getAiLoadStats() {
  const now = Date.now();
  return {
    mode: getLoadBalanceMode(),
    providers: listAiProviders(),
    stats: {
      groq: {
        ...stats.groq,
        cooling: isCoolingDown('groq'),
        cooldown_remaining_ms: Math.max(0, stats.groq.cooldownUntil - now),
      },
      gemini: {
        ...stats.gemini,
        cooling: isCoolingDown('gemini'),
        cooldown_remaining_ms: Math.max(0, stats.gemini.cooldownUntil - now),
      },
    },
  };
}

function groqKey(): string {
  return (process.env.GROQ_API_KEY || '').trim();
}
function geminiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

export function listAiProviders(): AiProvider[] {
  const order = (process.env.AI_PROVIDER_ORDER || 'groq,gemini')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AiProvider => s === 'groq' || s === 'gemini');

  const available: AiProvider[] = [];
  for (const p of order.length ? order : (['groq', 'gemini'] as AiProvider[])) {
    if (p === 'groq' && groqKey() && !available.includes('groq')) available.push('groq');
    if (p === 'gemini' && geminiKey() && !available.includes('gemini')) available.push('gemini');
  }
  return available;
}

export function aiConfigured(): boolean {
  return listAiProviders().length > 0;
}

function getLoadBalanceMode(): LoadBalanceMode {
  const m = (process.env.AI_LOAD_BALANCE || '').toLowerCase();
  if (m === 'weighted' || m === 'failover' || m === 'round_robin') return m;
  // padrão: round_robin se 2 providers, senão failover
  return listAiProviders().length > 1 ? 'round_robin' : 'failover';
}

function weightOf(p: AiProvider): number {
  if (p === 'groq') return Math.max(0, Number(process.env.AI_WEIGHT_GROQ || 50));
  return Math.max(0, Number(process.env.AI_WEIGHT_GEMINI || 50));
}

/**
 * Monta a fila de tentativa: primário (balanceado) + demais como fallback.
 */
function buildAttemptOrder(): AiProvider[] {
  const all = listAiProviders().filter((p) => !isCoolingDown(p));
  // Se todos em cooldown, tenta mesmo assim (melhor que falhar seco)
  const pool = all.length ? all : listAiProviders();
  if (!pool.length) return [];

  const mode = getLoadBalanceMode();
  let primary: AiProvider;

  if (mode === 'failover' || pool.length === 1) {
    primary = pool[0];
  } else if (mode === 'weighted') {
    const total = pool.reduce((s, p) => s + weightOf(p), 0) || 1;
    let r = Math.random() * total;
    primary = pool[pool.length - 1];
    for (const p of pool) {
      r -= weightOf(p);
      if (r <= 0) {
        primary = p;
        break;
      }
    }
  } else {
    // round_robin
    primary = pool[rrIndex % pool.length];
    rrIndex = (rrIndex + 1) % 1_000_000;
  }

  const rest = pool.filter((p) => p !== primary);
  // Também coloca providers em cooldown no fim (último recurso)
  const cooling = listAiProviders().filter((p) => !pool.includes(p));
  return [primary, ...rest, ...cooling];
}

function shouldFailover(status: number, body: string): boolean {
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
    err.failover = shouldFailover(response.status, errorText);
    throw err;
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  if (!text.trim()) throw new Error('Gemini retornou resposta vazia');
  return text.trim();
}

async function invokeProvider(
  provider: AiProvider,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  return provider === 'groq'
    ? callGroq(system, user, maxTokens, temperature)
    : callGemini(system, user, maxTokens, temperature);
}

/**
 * Escolhe provider via balanceamento; em falha tenta os demais.
 */
export async function callAI(
  system: string,
  user: string,
  maxTokens = 180,
  temperature = 0.6
): Promise<AiCallResult> {
  const order = buildAttemptOrder();
  if (!order.length) {
    throw new Error(
      'Nenhuma IA configurada. Defina GROQ_API_KEY e/ou GEMINI_API_KEY no .env'
    );
  }

  let lastError: Error | null = null;

  for (let i = 0; i < order.length; i++) {
    const provider = order[i];
    try {
      const text = await invokeProvider(provider, system, user, maxTokens, temperature);
      markSuccess(provider);
      if (i > 0) {
        console.warn(`[IA] Fallback: ${provider} (após falha do primário)`);
      }
      return { text, provider };
    } catch (e: any) {
      markFail(provider, e);
      lastError = e;
      if (i < order.length - 1) {
        console.warn(
          `[IA] ${provider} falhou (${e?.status || e?.message}) → próximo...`
        );
        continue;
      }
    }
  }

  throw lastError || new Error('Falha em todos os providers de IA');
}

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
