import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { callAI } from '../groqService.js';
import { prepareDotAction } from '../services/dotTools.js';
import { loadDotRealContext, loadDotContextForMessage, buildCachedDotAnswer, getDotResponseCache, putDotResponseCache } from '../services/dotContext.js';
import { getDotPreferences, saveDotPreferences } from '../services/dotPreferences.js';
import { listDotEvents, runDotMonitor } from '../services/dotMonitor.js';
import { resolveDotComplaint } from '../services/dotResolve.js';
import { createDecisionsForEvents, listDotDecisions, updateDotDecision } from '../services/dotDecision.js';
import { prepareDotActionFromDecision, approveDotAction, executeDotAction, listDotActions } from '../services/dotActionQueue.js';
import { listDotFollowUps, completeDotFollowUp } from '../services/dotFollowUp.js';
import { advanceMission } from '../services/dotAgentMissions.js';
import { runCurrentDotMissionStep } from '../services/dotAgentMissionRunner.js';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { planLabel } from '../lib/plans.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { getDotSchedulerStatus } from '../services/dotScheduler.js';
import { getTokenLimit, getFeatureTokenLimit, tokensUsadosFeatureMes } from '../lib/quota.js';
import { selectDotModel } from '../services/dotModelRouting.js';
import { requireDotAccess, type DotAccessResource, type DotAccessAction } from '../services/dotAccessControl.js';

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
type DotAccess = {
  allowed: boolean;
  demo: boolean;
  empresaId?: string;
  plan?: string;
  planLabel?: string;
  reason?: string;
  userId: string | null;
};

const sessions = new Map<string, ChatItem[]>();
const MAX_HISTORY = 12;

const DOT_RESPONSE_TOKEN_LIMITS: Record<string, number> = {
  // REI é o plano de maior profundidade de inteligência.
  // Corporativo privilegia escala/governança, sem superar o REI em profundidade por resposta.
  rei: Math.max(300, Number(process.env.DOT_REI_RESPONSE_TOKENS || 1800)),
  corporativo: Math.max(300, Number(process.env.DOT_CORPORATIVO_RESPONSE_TOKENS || 1200)),
};


const DOT_TOKEN_RESERVATION_TTL_MS = Math.max(
  5_000,
  Number(process.env.DOT_TOKEN_RESERVATION_TTL_MS || 30_000),
);
const dotTokenReservations = new Map<string, { tokens: number; expiresAt: number }>();

function cleanupDotTokenReservations(now = Date.now()) {
  for (const [key, reservation] of dotTokenReservations) {
    if (reservation.expiresAt <= now) dotTokenReservations.delete(key);
  }
}

function dotPlanKey(plan?: string | null): string {
  const normalized = String(plan || 'rei').toLowerCase();
  return normalized === 'corp' ? 'corporativo' : normalized;
}

function dotResponseTokenLimit(plan?: string | null): number {
  return DOT_RESPONSE_TOKEN_LIMITS[dotPlanKey(plan)] || 900;
}

async function checkDotTokenBudget(
  empresaId: string | null | undefined,
  plan: string | null | undefined,
): Promise<{ ok: boolean; used: number; feature_used: number; limit: number; feature_limit: number; response_limit: number; remaining: number; feature_remaining: number; feedback_limit: number }> {
  const responseLimit = dotResponseTokenLimit(plan);
  if (!empresaId) {
    return { ok: true, used: 0, feature_used: 0, limit: 0, feature_limit: 0, response_limit: responseLimit, remaining: responseLimit, feature_remaining: responseLimit, feedback_limit: 0 };
  }

  cleanupDotTokenReservations();
  const normalizedPlan = dotPlanKey(plan);
  const featureLimit = getFeatureTokenLimit(normalizedPlan, 'dot');
  const feedbackLimit = getTokenLimit(normalizedPlan);
  const featureUsed = await tokensUsadosFeatureMes(empresaId, 'dot');
  const key = empresaId;
  const reserved = dotTokenReservations.get(key)?.tokens || 0;

  // ISOLAMENTO CRÍTICO: DOT verifica somente sua própria cota.
  // O orçamento de feedback é reservado em outro namespace e nunca é
  // subtraído aqui. Assim, uma conversa pesada no DOT não bloqueia
  // análise de reviews, sentimento, tags ou respostas de avaliações.
  const featureRemaining = Math.max(0, featureLimit - featureUsed - reserved);

  if (featureLimit <= 0 || featureRemaining < responseLimit) {
    return {
      ok: false,
      used: featureUsed,
      feature_used: featureUsed,
      limit: featureLimit,
      feature_limit: featureLimit,
      response_limit: responseLimit,
      remaining: featureRemaining,
      feature_remaining: featureRemaining,
      feedback_limit: feedbackLimit,
    };
  }

  dotTokenReservations.set(key, {
    tokens: reserved + responseLimit,
    expiresAt: Date.now() + DOT_TOKEN_RESERVATION_TTL_MS,
  });

  return {
    ok: true,
    used: featureUsed,
    feature_used: featureUsed,
    limit: featureLimit,
    feature_limit: featureLimit,
    response_limit: responseLimit,
    remaining: featureRemaining - responseLimit,
    feature_remaining: featureRemaining - responseLimit,
    feedback_limit: feedbackLimit,
  };
}

const DOT_TOKEN_WARNING_THRESHOLD = 0.8;

async function getDotTokenUsage(empresaId: string | null | undefined, plan: string | null | undefined) {
  const limit = getFeatureTokenLimit(dotPlanKey(plan), 'dot');
  if (!empresaId || limit <= 0) {
    return { used: 0, limit, percent: 0, warning: false, exhausted: false, remaining: Math.max(0, limit) };
  }
  const used = await tokensUsadosFeatureMes(empresaId, 'dot');
  const percent = limit > 0 ? used / limit : 0;
  return {
    used,
    limit,
    percent,
    warning: percent >= DOT_TOKEN_WARNING_THRESHOLD && percent < 1,
    exhausted: used >= limit,
    remaining: Math.max(0, limit - used),
  };
}

function releaseDotTokenReservation(empresaId: string | null | undefined, reserved: number) {
  if (!empresaId) return;
  const current = dotTokenReservations.get(empresaId);
  if (!current) return;
  const next = Math.max(0, current.tokens - Math.max(0, reserved));
  if (next === 0) dotTokenReservations.delete(empresaId);
  else dotTokenReservations.set(empresaId, { ...current, tokens: next });
}

function cleanMessage(value: unknown): string {
  return String(value ?? '').trim().slice(0, 4000);
}

function scopedSessionId(access: DotAccess, id: string): string {
  const safeId = id || 'local-demo';
  if (access.demo) return `demo:${safeId}`;
  const userScope = access.userId || 'authenticated-unknown';
  return access.empresaId ? `${access.empresaId}:${userScope}:${safeId}` : `anonymous:${safeId}`;
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

function buildConversation(context: string, history: ChatItem[], message: string): string {
  const transcript = history
    .slice(-MAX_HISTORY)
    .map((item) => `${item.role === 'user' ? 'USUÁRIO' : 'FILTRA DOT'}: ${item.text}`)
    .join('\n');
  return [context, transcript, `USUÁRIO: ${message}`].filter(Boolean).join('\n\n');
}

async function resolveDotAccess(req: Request): Promise<DotAccess> {
  const token = extrairToken(req);

  // Localhost continua permitindo o protótipo demonstrativo sem login.
  if (!token) {
    if (process.env.DOT_DEMO_MODE === '1' && process.env.NODE_ENV !== 'production') {
      return { allowed: true, demo: true, plan: 'rei', planLabel: 'Rei', userId: null };
    }
    return { allowed: false, demo: false, reason: 'Autenticação necessária.' };
  }

  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) {
      return { allowed: false, demo: false, reason: 'Conta admin não possui acesso ao Dot de empresa.' };
    }

    const empresa = await findEmpresa(payload.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) {
      return { allowed: false, demo: false, reason: 'Assinatura/trial inativo.' };
    }

    const plan = String(empresa.plan || '').toLowerCase();
    const liberado = plan === 'rei' || plan === 'corporativo' || plan === 'corp';
    if (!liberado) {
      return {
        allowed: false,
        demo: false,
        empresaId: empresa.id,
        plan,
        planLabel: planLabel(plan),
        reason: 'O Filtra Dot está em acesso antecipado para os planos Rei e Corporativo.',
      };
    }

    return {
      allowed: true,
      demo: false,
      empresaId: empresa.id,
      plan,
      planLabel: planLabel(plan),
      userId: String(payload.id || '') || null,
    };
  } catch {
    return { allowed: false, demo: false, reason: 'Token inválido ou expirado.' };
  }
}

async function requireMutationPermission(
  res: Response,
  access: DotAccess,
  resource: DotAccessResource,
  action: DotAccessAction,
  context?: unknown,
): Promise<boolean> {
  if (!access.empresaId || !access.userId) {
    res.status(403).json({ ok: false, error: 'Permissão autenticada é necessária para esta operação.', code: 'DOT_PERMISSION_REQUIRED', resource, action });
    return false;
  }
  try {
    await requireDotAccess(access.empresaId, resource, action, access.userId, context);
    return true;
  } catch (error) {
    res.status(403).json({ ok: false, error: error instanceof Error ? error.message : 'Permissão DOT insuficiente.', code: 'DOT_PERMISSION_REQUIRED', resource, action });
    return false;
  }
}

function deny(res: Response, access: DotAccess) {
  return res.status(403).json({
    ok: false,
    error: access.reason || 'Acesso ao Filtra Dot não liberado.',
    code: 'DOT_PLAN_REQUIRED',
    allowedPlans: ['rei', 'corporativo'],
  });
}

export function mountDotRoutes(app: Express) {
  app.get('/api/dot/status', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    res.json({
      ok: true,
      enabled:
        access.allowed &&
        (process.env.NODE_ENV !== 'production' || process.env.FILTRA_DOT_ENABLED === '1'),
      access: access.allowed,
      demo: access.demo,
      plan: access.plan || 'rei',
      plan_label: access.planLabel || 'Rei',
      priority_access: ['rei', 'corporativo'],
      scheduler: getDotSchedulerStatus(),
      token_budget: await getDotTokenUsage(access.empresaId, access.plan),
      token_warning_threshold: 0.8,
      capabilities: [
        'analisar_reputacao',
        'detectar_padroes',
        'explicar_tendencias',
        'preparar_acoes',
        'memoria_de_conversa',
      ],
    });
  });

  app.get('/api/dot/preferences', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    const preferences = await getDotPreferences(access.empresaId);
    res.json({ ok: true, plan: access.plan, preferences });
  });

  app.put('/api/dot/preferences', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'update', { route: '/api/dot/preferences' }))) return;
    const preferences = await saveDotPreferences(access.empresaId, req.body || {});
    res.json({ ok: true, plan: access.plan, preferences });
  });

  app.post('/api/dot/monitor/run', dotLimiter, async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'analyze', { route: '/api/dot/monitor/run' }))) return;
    const result = await runDotMonitor(access.empresaId);
    res.json({ ok: true, demo: access.demo, result });
  });

  app.get('/api/dot/decisions', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    const decisions = await listDotDecisions(access.empresaId);
    res.json({ ok: true, decisions });
  });

  app.post('/api/dot/decisions/:id/:action', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'update', { route: '/api/dot/decisions/:id/:action' }))) return;
    const action = String(req.params.action);
    // Aprovação de uma ação só pode ocorrer pela fila de ações, que exige
    // uma ação preparada e aplica a transação atômica decisão + ação.
    if (!['prepare', 'reject'].includes(action)) {
      return res.status(409).json({
        error: 'Aprovação deve ocorrer pela fila de ações.',
        code: 'DOT_APPROVAL_REQUIRES_ACTION',
      });
    }
    const status = action === 'prepare' ? 'prepared' : 'rejected';
    const result = await updateDotDecision(access.empresaId, Number(req.params.id), status as any);
    if (!result) return res.status(404).json({ error: 'Decisão não encontrada.' });
    res.json({ ok: true, decision: result, executed: false });
  });

  app.get('/api/dot/actions', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    res.json({ ok: true, actions: await listDotActions(access.empresaId) });
  });

  app.post('/api/dot/decisions/:id/prepare-action', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'create', { route: '/api/dot/decisions/:id/prepare-action' }))) return;
    const optionId = String(req.body?.optionId || '');
    if (!['opcao_1', 'opcao_2'].includes(optionId)) return res.status(400).json({ error: 'Opção inválida.' });
    const action = await prepareDotActionFromDecision(access.empresaId, Number(req.params.id), optionId);
    if (!action) return res.status(404).json({ error: 'Decisão ou opção não encontrada.' });
    res.json({ ok: true, action, executed: false });
  });

  app.post('/api/dot/actions/:id/approve', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'update', { route: '/api/dot/actions/:id/approve' }))) return;
    const actionId = Number(req.params.id);
    const action = await approveDotAction(access.empresaId, actionId);
    if (!action) return res.status(409).json({ error: 'Ação não encontrada ou já processada.' });

    // Aprovar não executa. A aprovação apenas libera a ação para a etapa
    // seguinte, que continua sujeita à permissão explícita de execução.
    res.json({ ok: true, action, execution: null, resumed_mission: null });
  });

  app.post('/api/dot/actions/:id/run', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'execute', { route: '/api/dot/actions/:id/run' }))) return;
    const actionId = Number(req.params.id);
    const result = await executeDotAction(access.empresaId, actionId, access.userId || null);
    if (!result.ok) return res.status(409).json(result);

    const db = (await import('../lib/db.js')).getDb();
    const mission = await db.get(
      "SELECT id FROM dot_agent_missions WHERE empresa_id=? AND status='waiting_approval' AND approval_action_id=? ORDER BY id DESC LIMIT 1",
      [access.empresaId, actionId],
    );
    let resumedMission = null;
    if (mission) {
      resumedMission = await advanceMission(
        access.empresaId,
        Number(mission.id),
        `Ação executada pelo gateway: ${result.reason || 'execução concluída'}`,
      );
      if (resumedMission?.status === 'working') {
        const continued = await runCurrentDotMissionStep(access.empresaId, Number(mission.id));
        resumedMission = continued?.mission || resumedMission;
      }
    }

    res.json({ ok: true, action: result, external_side_effect: false, resumed_mission: resumedMission });
  });

  app.get('/api/dot/cases', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    const db = (await import('../lib/db.js')).getDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS dot_internal_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      decision_id INTEGER NOT NULL,
      action_id INTEGER NOT NULL,
      event_id INTEGER,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      summary TEXT NOT NULL,
      next_step TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    const cases = await db.all(
      'SELECT * FROM dot_internal_cases WHERE empresa_id = ? ORDER BY CASE WHEN status IN (\'prioritized\',\'escalated\') THEN 0 ELSE 1 END, id DESC LIMIT 100',
      [access.empresaId],
    );
    res.json({ ok: true, cases: cases || [] });
  });

  app.get('/api/dot/followups', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    res.json({ ok: true, followups: await listDotFollowUps(access.empresaId) });
  });

  app.post('/api/dot/followups/:id/complete', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'operations', 'update', { route: '/api/dot/followups/:id/complete' }))) return;
    const outcome = cleanMessage(req.body?.outcome);
    const followUp = await completeDotFollowUp(access.empresaId, Number(req.params.id), outcome);
    if (!followUp) return res.status(409).json({ error: 'Acompanhamento não encontrado ou já concluído.' });
    res.json({ ok: true, followup: followUp });
  });

  app.post('/api/dot/resolve', dotLimiter, async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed) return deny(res, access);
    if (access.empresaId && !(await requireMutationPermission(res, access, 'filtra', 'create', { route: '/api/dot/resolve' }))) return;
    const complaint = cleanMessage(req.body?.complaint || req.body?.message);
    if (!complaint) return res.status(400).json({ error: 'Relato do cliente é obrigatório.' });
    if (!access.empresaId) {
      return res.json({
        ok: true,
        demo: true,
        result: {
          problem_summary: complaint,
          verification_status: 'unverified',
          confidence: 'baixa',
          facts: [{ source: 'modo demonstração', fact: 'O Dot Resolve precisa de uma empresa autenticada para verificar dados reais.' }],
          evidence: [],
          options: [
            { id: 'opcao_1', title: 'Investigar e acompanhar', description: 'Validar o caso com os dados da empresa antes de agir.', action: 'corrigir_e_acompanhar', risk: 'medio' },
            { id: 'opcao_2', title: 'Escalar para responsável', description: 'Deixar a validação final com o responsável da empresa.', action: 'escalar_responsavel', risk: 'baixo' },
          ],
          requires_owner_decision: true,
        },
      });
    }
    const result = await resolveDotComplaint(access.empresaId, complaint);
    const db = (await import('../lib/db.js')).getDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS dot_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      acknowledged_at TEXT
    )`);
    const severity = result.verification_status === 'confirmed' ? 'critical' : 'warning';
    const eventTitle = result.verification_status === 'confirmed'
      ? 'Reclamação confirmada pelo Dot Resolve'
      : 'Reclamação recebida para verificação';
    const eventDetails = [
      result.problem_summary,
      ...result.facts.map((fact) => fact.fact),
      result.evidence.length ? `Evidências relacionadas: ${result.evidence.length}.` : 'Nenhuma evidência relacionada encontrada.',
    ].join(' ');
    const inserted = await db.run(
      'INSERT INTO dot_events (empresa_id,type,severity,title,details,created_at) VALUES (?,?,?,?,?,?) RETURNING id',
      [access.empresaId, 'complaint_resolution', severity, eventTitle, eventDetails, new Date().toISOString()]
    );
    const decisions = await createDecisionsForEvents(access.empresaId, [{ id: inserted.lastID, type: 'complaint_resolution', severity, title: eventTitle, details: eventDetails }]);
    const decision = decisions[0];
    let preparedAction = null;
    if (decision?.id) {
      const preferences = await getDotPreferences(access.empresaId);
      if (preferences.prepareActionsAutomatically && preferences.autonomy !== 'observador') {
        preparedAction = await prepareDotActionFromDecision(
          access.empresaId,
          Number(decision.id),
          String(result.options[0]?.id || 'opcao_1'),
        );
      }
    }
    res.json({
      ok: true,
      demo: access.demo,
      result: {
        ...result,
        decision_id: decision?.id,
        prepared_action: preparedAction,
      },
    });
  });

  app.get('/api/dot/events', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    const events = await listDotEvents(access.empresaId);
    res.json({ ok: true, events });
  });

  app.post('/api/dot/events/:id/ack', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireMutationPermission(res, access, 'filtra', 'update', { route: '/api/dot/events/:id/ack' }))) return;
    const db = (await import('../lib/db.js')).getDb();
    await db.run('UPDATE dot_events SET acknowledged_at = ? WHERE id = ? AND empresa_id = ?', [new Date().toISOString(), String(req.params.id), access.empresaId]);
    res.json({ ok: true });
  });

  app.get('/api/dot/briefing', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed) return deny(res, access);

    const context = access.demo
      ? DEMO_CONTEXT
      : await loadDotRealContext(access.empresaId as string);

    res.json({
      ok: true,
      demo: access.demo,
      plan: access.plan || 'rei',
      plan_label: access.planLabel || 'Rei',
      context,
      briefing: access.demo
        ? {
            headline: 'A reputação está saudável, mas existe um sinal recorrente para investigar.',
            trend: '+18,4%',
            rating: '4,8/5',
            reviews: 1284,
            priority: 'Tempo de espera',
            reason: 'As reclamações recentes apontam repetição do mesmo tema.',
            suggestedAction: 'Analisar as avaliações afetadas e preparar um plano para a equipe.',
          }
        : {
            headline: 'Briefing calculado a partir das avaliações reais da empresa.',
            suggestedAction: 'Peça ao Dot para analisar os principais temas e preparar o próximo passo.',
          },
    });
  });

  app.post('/api/dot/action/prepare', dotLimiter, async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed) return deny(res, access);
    if (access.empresaId && !(await requireMutationPermission(res, access, 'filtra', 'create', { route: '/api/dot/action/prepare' }))) return;

    const action = cleanMessage(req.body?.action);
    if (!action) return res.status(400).json({ error: 'Ação obrigatória.' });

    return res.json({
      ok: true,
      demo: access.demo,
      plan: access.plan || 'rei',
      proposal: prepareDotAction(action, access.demo),
    });
  });

  app.delete('/api/dot/session/:sessionId', async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed) return deny(res, access);

    resetSession(scopedSessionId(access, String(req.params.sessionId || '')));
    res.json({ ok: true });
  });

  app.post('/api/dot/chat', dotLimiter, async (req: Request, res: Response) => {
    const access = await resolveDotAccess(req);
    if (!access.allowed) return deny(res, access);

    if (process.env.NODE_ENV === 'production' && process.env.FILTRA_DOT_ENABLED !== '1') {
      return res.status(404).json({ error: 'Filtra Dot ainda não está habilitado.' });
    }

    const message = cleanMessage(req.body?.message);
    const requestedSessionId = cleanMessage(req.body?.session_id) || 'local-demo';
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória.' });

    const sessionId = scopedSessionId(access, requestedSessionId);
    const history = sessionHistory(sessionId);

    const contextResult = access.demo
      ? {
          context: DEMO_CONTEXT,
          decision: {
            mode: 'refresh',
            dataSource: 'database',
            reasoningRequired: true,
            refreshRequired: true,
            reason: 'Modo demonstração.',
          },
          fingerprint: '',
          snapshot: null,
          cacheHit: false,
        }
      : await loadDotContextForMessage(access.empresaId as string, message);

    // Perguntas puramente factuais podem sair do cache sem consumir a cota de IA.
    // Raciocínio, explicação, comparação e estado temporal continuam passando pela IA.
    if (!access.demo && contextResult.cacheHit) {
      const cachedAnswer = buildCachedDotAnswer(message, contextResult.snapshot);
      if (cachedAnswer) {
        history.push({ role: 'user', text: message, at: Date.now() });
        history.push({ role: 'dot', text: cachedAnswer, at: Date.now() });
        while (history.length > MAX_HISTORY) history.shift();
        return res.json({
          ok: true,
          message: cachedAnswer,
          provider: 'cache',
          latency_ms: 0,
          tokens_used: 0,
          demo: false,
          plan: access.plan || 'rei',
          plan_label: access.planLabel || 'Rei',
          session_id: requestedSessionId,
          memory_turns: Math.floor(history.length / 2),
          token_scope: 'dot',
          feedback_token_limit: getTokenLimit(access.plan || 'rei'),
          feedback_isolated: true,
          response_token_limit: 0,
          context_mode: 'cached',
          context_source: 'cache',
          context_refresh_required: false,
          context_reason: contextResult.decision.reason,
          dot_token_limit: getFeatureTokenLimit(access.plan || 'rei', 'dot'),
          dot_tokens_used: await tokensUsadosFeatureMes(access.empresaId as string, 'dot'),
          dot_tokens_remaining_estimate: Math.max(
            0,
            getFeatureTokenLimit(access.plan || 'rei', 'dot') -
              await tokensUsadosFeatureMes(access.empresaId as string, 'dot'),
          ),
        });
      }
    }

    // Reutiliza respostas de raciocínio quando a intenção é semanticamente equivalente
    // e o fingerprint dos dados é idêntico. Isso evita gastar tokens novamente
    // para perguntas repetidas ou parafraseadas sem sacrificar frescor.
    if (!access.demo && contextResult.fingerprint) {
      const semanticCached = await getDotResponseCache(
        access.empresaId as string,
        message,
        contextResult.fingerprint,
      );
      if (semanticCached) {
        history.push({ role: 'user', text: message, at: Date.now() });
        history.push({ role: 'dot', text: semanticCached.answer, at: Date.now() });
        while (history.length > MAX_HISTORY) history.shift();
        const dotLimit = getFeatureTokenLimit(access.plan || 'rei', 'dot');
        const dotUsed = await tokensUsadosFeatureMes(access.empresaId as string, 'dot');
        return res.json({
          ok: true,
          message: semanticCached.answer,
          provider: 'cache',
          cache_type: 'semantic_response',
          cache_key: semanticCached.cache_key,
          cache_source_provider: semanticCached.provider,
          latency_ms: 0,
          tokens_used: 0,
          tokens_saved_estimate: semanticCached.tokens_used,
          demo: false,
          plan: access.plan || 'rei',
          plan_label: access.planLabel || 'Rei',
          session_id: requestedSessionId,
          memory_turns: Math.floor(history.length / 2),
          token_scope: 'dot',
          feedback_token_limit: getTokenLimit(access.plan || 'rei'),
          feedback_isolated: true,
          response_token_limit: 0,
          context_mode: 'cached',
          context_source: 'semantic_response_cache',
          context_refresh_required: false,
          context_reason: 'Resposta semanticamente equivalente encontrada com os mesmos dados verificados.',
          dot_token_limit: dotLimit,
          dot_tokens_used: dotUsed,
          dot_tokens_remaining_estimate: Math.max(0, dotLimit - dotUsed),
        });
      }
    }

    // Trava final: antes de chamar qualquer modelo, reservamos o máximo de saída
    // permitido. Assim, uma resposta nunca pode iniciar se o orçamento restante
    // for menor que o teto da própria resposta.
    const tokenBudget = await checkDotTokenBudget(access.empresaId, access.plan);
    if (!tokenBudget.ok) {
      return res.status(429).json({
        ok: false,
        error: 'O orçamento de IA do plano para este período foi atingido.',
        code: 'DOT_TOKEN_LIMIT',
        tokens_used: tokenBudget.feature_used,
        token_limit: tokenBudget.feature_limit,
        token_scope: 'dot',
        feedback_token_limit: tokenBudget.feedback_limit,
        feedback_isolated: true,
        feature_tokens_used: tokenBudget.feature_used,
        feature_token_limit: tokenBudget.feature_limit,
        response_limit: tokenBudget.response_limit,
        tokens_remaining: tokenBudget.remaining,
        feature_tokens_remaining: tokenBudget.feature_remaining,
      });
    }

    const reservedTokens = tokenBudget.response_limit;

    try {
      const responseSystem = `${SYSTEM}
ORÇAMENTO DESTA RESPOSTA: até ${tokenBudget.response_limit} tokens de saída.
CONTEXTO: ${contextResult.decision.mode}. ${contextResult.decision.reason}
REGRA DE FRESCOR: use fatos persistidos do contexto quando suficientes; quando a pergunta pedir estado atual, causa, impacto, comparação, recomendação ou decisão, raciocine novamente com os dados verificados nesta solicitação.
Entregue uma resposta completa dentro desse orçamento. Priorize, nesta ordem: conclusão, evidências, impacto, recomendação e próximo passo. Evite introduções e repetições desnecessárias.`;

      const routing = selectDotModel(message);
      const result = await callAI(
        responseSystem,
        buildConversation(contextResult.context, history, message),
        tokenBudget.response_limit,
        0.45,
        {
          empresaId: access.empresaId || null,
          tipo: 'filtra_dot_chat',
          feature: 'dot',
          model: routing.model,
        }
      );

      releaseDotTokenReservation(access.empresaId, reservedTokens);

      // Guarda somente respostas geradas por IA e vinculadas ao fingerprint atual.
      // Uma nova avaliação ou mudança relevante invalida esse cache.
      if (!access.demo && contextResult.fingerprint && result.text) {
        await putDotResponseCache(
          access.empresaId as string,
          message,
          contextResult.fingerprint,
          result.text,
          { tokens_used: result.tokens, provider: result.provider, model: result.model },
        );
      }

      history.push({ role: 'user', text: message, at: Date.now() });
      history.push({ role: 'dot', text: result.text, at: Date.now() });
      while (history.length > MAX_HISTORY) history.shift();

      return res.json({
        ok: true,
        message: result.text,
        provider: result.provider,
        model: result.model,
        routing_tier: routing.tier,
        latency_ms: result.latency_ms,
        tokens_used: result.tokens,
        demo: access.demo,
        plan: access.plan || 'rei',
        plan_label: access.planLabel || 'Rei',
        session_id: requestedSessionId,
        memory_turns: Math.floor(history.length / 2),
        token_limit: tokenBudget.limit || null,
        token_scope: 'dot',
        feedback_token_limit: tokenBudget.feedback_limit || null,
        feedback_isolated: true,
        response_token_limit: tokenBudget.response_limit,
        token_warning_threshold: 0.8,
        token_warning: tokenBudget.feature_limit > 0 && ((tokenBudget.feature_used + result.tokens) / tokenBudget.feature_limit) >= 0.8,
        tokens_remaining_estimate: tokenBudget.limit
          ? Math.max(0, tokenBudget.limit - tokenBudget.used - result.tokens)
          : null,
        dot_token_limit: tokenBudget.feature_limit || null,
        dot_tokens_used: tokenBudget.feature_used + result.tokens,
        context_mode: contextResult.decision.mode,
        context_source: contextResult.decision.dataSource,
        context_refresh_required: contextResult.decision.refreshRequired,
        context_reason: contextResult.decision.reason,
        dot_tokens_remaining_estimate: tokenBudget.feature_limit
          ? Math.max(0, tokenBudget.feature_limit - tokenBudget.feature_used - result.tokens)
          : null,
      });
    } catch (error: any) {
      releaseDotTokenReservation(access.empresaId, reservedTokens);
      console.error('[Filtra Dot]', error?.message || error);
      return res.status(503).json({
        error: 'O Filtra Dot está sem um provedor de IA disponível no localhost.',
        detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error),
      });
    }
  });
}
