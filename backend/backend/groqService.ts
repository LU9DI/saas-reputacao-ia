// backend/groqService.ts

// URL do endpoint de chat completions do Groq
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Chave de API carregada de variável de ambiente
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Gera uma resposta de IA usando o Groq.
 * @param prompt Texto que será enviado como mensagem do usuário.
 * @returns O texto gerado pela IA.
 */
export async function generateResponse(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Defina no arquivo .env');
  }
  console.log('KEY:', JSON.stringify(GROQ_API_KEY)); // aqui, fora do if

  const body = {
    model: 'llama-3.3-70b-versatile', 
    messages: [
      {
        role: 'system',
        content: 'Você é um gerente atencioso de um estabelecimento.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 150,      // limite de tokens na resposta
    temperature: 0.7,     // criatividade (0 = determinístico, 1 = criativo)
  };

  // Faz a requisição POST usando fetch
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  // Se a resposta não for ok, lança erro com status e corpo
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  // Extrai o JSON da resposta
  const data = await response.json();

  // Retorna o texto da primeira escolha
  return data.choices[0].message.content.trim();
}