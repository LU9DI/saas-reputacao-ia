// Serviço de geração de respostas e tags com Groq

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function callGroq(
  system: string,
  user: string,
  maxTokens = 180,
  temperature = 0.6
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Defina no arquivo .env');
  }

  const body = {
    model: 'llama-3.3-70b-versatile',
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
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateResponse(prompt: string): Promise<string> {
  return callGroq(
    'Você é o gerente de um estabelecimento comercial. Responda de forma empática, profissional e breve (máximo 3 frases) a avaliações negativas de clientes. Peça desculpas quando apropriado e indique que a equipe vai analisar o caso. Não invente políticas ou promessas específicas.',
    prompt
  );
}

export async function gerarRespostaReview(
  nomeCliente: string,
  rating: number,
  comment: string,
  nomeEmpresa?: string
): Promise<string> {
  const local = nomeEmpresa ? ` do estabelecimento "${nomeEmpresa}"` : '';
  const prompt = `Cliente: ${nomeCliente || 'Anônimo'}
Nota: ${rating}/5
Comentário: ${comment}

Escreva uma resposta curta e profissional para esta avaliação negativa${local}.`;
  return generateResponse(prompt);
}

/**
 * Gera tags semânticas (hashtags) com base no sentimento e conteúdo do comentário.
 * Retorna array de strings no formato #CamelCase (máx. 5).
 */
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

  const raw = await callGroq(system, user, 120, 0.3);

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t: unknown) => String(t).trim())
      .filter((t: string) => t.startsWith('#') && t.length > 2 && t.length < 40)
      .slice(0, 5);
  } catch {
    // Fallback: extrai hashtags do texto
    const matches = raw.match(/#[\wÀ-ú]+/g);
    return matches ? matches.slice(0, 5) : [];
  }
}
