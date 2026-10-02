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
Responda como um agente, não como um chatbot genérico: use o histórico da conversa, identifique o próximo passo e, quando apropriado, termine com uma ação concreta que você pode preparar.`;

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

type ChatItem = { role: 'user' | 'dot'; text: string; at: number };
const sessions = new Map<string, ChatItem[]>();
const MAX_HISTORY = 12;

function cleanMessage(value: unknown): string {
  return String(value ?? '').trim().slice(0, 4000);
}

function sessionHistory(id: string): ChatItem[] {
  const current = sessions.get(id);
  if (current) return current;
  const created: ChatItem[] = [];
  sessions.set(id, created);
  return created;
}

function resetSession(id: string) {
  sessions.delete(id);
}

function buildConversation(history: ChatItem[], message: string): string {
  const transcript = history
    .slice(-MAX_HISTORY)
    .map((item) => `${item.role === 'user' ? 'USUÁRIO' : 'FILTRA DOT'}: ${item.text}`)
    .join('\n');
  return [DEMO_CONTEXT, transcript, `USUÁRIO: ${message}`].filter(Boolean).join('\n\n');
}

export function mountDotRoutes(app: Express) {
  app.get('/api/dot/status', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      enabled: process.env.NODE_ENV !== 'production' || process.env.FILTRA_DOT_ENABLED === '1',
      plan: 'rei',
      demo: true,
      capabilities: [
        'analisar_reputacao',
        'detectar_padroes',
        'explicar_tendencias',
        'preparar_acoes',
        'memoria_de_conversa',
      ],
    });
  });

  app.get('/api/dot/briefing', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      demo: true,
      briefing: {
        headline: 'A reputação está saudável, mas existe um sinal recorrente para investigar.',
        trend: '+18,4%',
        rating: '4,8/5',
        reviews: 1284,
        priority: 'Tempo de espera',
        reason: 'As reclamações recentes apontam repetição do mesmo tema.',
        suggestedAction: 'Analisar as avaliações afetadas e preparar um plano para a equipe.',
      },
    });
  });

  app.delete('/api/dot/session/:sessionId', (req: Request, res: Response) => {
    resetSession(String(req.params.sessionId || ''));
    res.json({ ok: true });
  });

  app.post('/api/dot/chat', dotLimiter, async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production' && process.env.FILTRA_DOT_ENABLED !== '1') {
      return res.status(404).json({ error: 'Filtra Dot ainda não está habilitado.' });
    }

    const message = cleanMessage(req.body?.message);
    const sessionId = cleanMessage(req.body?.session_id) || 'local-demo';
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória.' });

    const history = sessionHistory(sessionId);

    try {
      const result = await callAI(
        SYSTEM,
        buildConversation(history, message),
        700,
        0.45,
        { tipo: 'filtra_dot_chat' }
      );

      history.push({ role: 'user', text: message, at: Date.now() });
      history.push({ role: 'dot', text: result.text, at: Date.now() });
      while (history.length > MAX_HISTORY) history.shift();

      return res.json({
        ok: true,
        message: result.text,
        provider: result.provider,
        latency_ms: result.latency_ms,
        demo: true,
        session_id: sessionId,
        memory_turns: Math.floor(history.length / 2),
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
