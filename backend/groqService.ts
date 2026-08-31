// Serviço de geração de respostas com Groq

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Gera uma resposta de IA usando o Groq.
 * @param prompt Texto enviado como mensagem do usuário.
 * @returns O texto gerado pela IA.
 */
export async function generateResponse(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Defina no arquivo .env');
  }

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Você é o gerente de um estabelecimento comercial. Responda de forma empática, profissional e breve (máximo 3 frases) a avaliações negativas de clientes. Peça desculpas quando apropriado e indique que a equipe vai analisar o caso. Não invente políticas ou promessas específicas.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 180,
    temperature: 0.6,
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

/**
 * Monta o prompt e gera resposta automática para uma review negativa.
 */
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
