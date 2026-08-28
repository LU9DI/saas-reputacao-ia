import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

async function generateResponse(comment: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || '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';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'Você é um gerente atencioso. Responda de forma curta, cordial e profissional em português.'
          },
          {
            role: 'user',
            content: `Responda a esta crítica: "${comment}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Groq Error] Status: ${response.status} - ${errorBody}`);
      return 'Obrigado pelo feedback. Vamos analisar o ocorrido.';
    }

    const data = (await response.json()) as any;
    // Sintaxe limpa acessando o índice do array de forma nativa e correta
    return data.choices?.[0]?.message?.content?.trim() ?? 'Obrigado pelo feedback. Vamos analisar o ocorrido.';
  } catch (error) {
    console.error('[Fetch Error] Erro ao conectar na Groq:', error);
    return 'Agradecemos o seu feedback. Entraremos em contato.';
  }
}

app.post('/api/reviews', async (req, res) => {
  try {
    // 1. Recebe o businessId vindo do QR Code / Formulário
    const { name, rating, comment, businessId } = req.body; 

    const aiReply = await generateResponse(comment);

    const newReview = await prisma.review.create({
      data: {
        name,
        rating,
        comment,
        aiReply,
        businessId, // 2. Vincula a crítica à empresa correta no banco
      },
    });

    return res.status(201).json(newReview);
  } catch (error) {
    console.error('[Prisma Error] Erro ao salvar no banco:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});


app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reviews);
  } catch (error) {
    console.error('[Prisma Error] Erro ao buscar críticas:', error);
    return res.status(500).json({ error: 'Erro ao buscar críticas' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando de forma fixa na porta ${PORT} com Nuvem Groq Ativa`);
});










