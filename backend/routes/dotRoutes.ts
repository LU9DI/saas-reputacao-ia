import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { callAI } from '../groqService.js';

const dotLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas mensagens. Aguarde um momento.' },
});

const SYSTEM = `Você é o Filtra Dot, o agente inteligente de reputação e crescimento do Filtra.AI.
Você fala em português do Brasil, de forma clara, objetiva e útil.
Você conhece o contexto demonstrativo abaixo e deve deixar claro quando estiver usando dados de demonstração.
Seu papel é analisar avaliações, feedback, reputação, tendências e sugerir ações práticas.
Não invente números, clientes, avaliações ou integrações que não estejam no contexto.
Você pode planejar ações, mas nunca deve afirmar que enviou mensagens, publicou respostas, alterou CRM ou executou uma ação externa se nenhuma ferramenta realmente a executou.
Quando uma ação externa seria necessária, explique que ela precisa de autorização/execução da plataforma.
Responda como um agente, não como um chatbot genérico: seja proativo, identifique o próximo passo e, quando apropriado, termine com uma ação concreta que você pode preparar.`;

const DEMO_CONTEXT = `
EMPRESA DEMO: Hotel Aurora
PLANO: Rei
DADOS DEMONSTRATIVOS:
- Nota média: 4,8/5
- Avaliações: 1.284
- Positivas: 91%
- Alertas ativos: 37
- Tendência: +18,4% nos últimos 14 dias
- Sinais recentes: elogios ao atendimento; reclamações sobre tempo de espera; equipe frequentemente elogiada
- O Filtra.AI já possui módulos de avaliações, IA, alertas, relatórios e CRM.
IMPORTANTE: estes números são apenas para o protótipo local e não representam dados reais do cliente.
`;

function cleanMessage(value: unknown): string {
  return String(value ?? '').trim().slice(0, 4000);
}

export function mountDotRoutes(app: Express) {
  app.post('/api/dot/chat', dotLimiter, async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production' && process.env.FILTRA_DOT_ENABLED !== '1') {
      return res.status(404).json({ error: 'Filtra Dot ainda não está habilitado.' });
    }

    const message = cleanMessage(req.body?.message);
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória.' });

    try {
      const result = await callAI(
        SYSTEM,
        `${DEMO_CONTEXT}\n\nUSUÁRIO: ${message}`,
        700,
        0.45,
        { tipo: 'filtra_dot_chat' }
      );

      return res.json({
        ok: true,
        message: result.text,
        provider: result.provider,
        latency_ms: result.latency_ms,
        demo: true,
      });
    } catch (error: any) {
      console.error('[Filtra Dot]', error?.message || error);
      return res.status(503).json({
        error: 'O Filtra Dot está sem um provedor de IA disponível no localhost.',
        detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error),
      });
    }
  });
}
