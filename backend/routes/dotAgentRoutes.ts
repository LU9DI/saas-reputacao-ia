import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { planLabel } from '../lib/plans.js';
import { createDotAgentGoal, getDotAgentWorkspace, listDotAgentGoals, updateDotAgentGoal } from '../services/dotAgent.js';
import { createMissionForGoal } from '../services/dotAgentMissions.js';
import { wakeDotAgentWorker } from '../services/dotAgentWorker.js';
import { requireDotAccess, type DotAccessAction, type DotAccessResource } from '../services/dotAccessControl.js';
import { listDotPlanSteps, listDotPlans } from '../services/dotAgentPlan.js';
import { runDotAgent } from '../services/dotAgentRuntime.js';

type DotAgentAccess = { allowed: boolean; empresaId?: string; plan?: string; reason?: string; userId?: string | null; demo?: boolean };

async function resolveDotAgentAccess(req: Request): Promise<DotAgentAccess> {
  const token = extrairToken(req);
  if (!token) {
    if (process.env.DOT_DEMO_MODE === '1' && process.env.NODE_ENV !== 'production') return { allowed: true, empresaId: 'demo', plan: 'rei', userId: null, demo: true };
    return { allowed: false, reason: 'Autenticação necessária.' };
  }
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) {
      return { allowed: false, reason: 'Conta admin não possui acesso ao agente de empresa.' };
    }
    const empresa = await findEmpresa(payload.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) return { allowed: false, reason: 'Assinatura/trial inativo.' };
    const plan = String(empresa.plan || '').toLowerCase();
    const enabled = plan === 'rei' || plan === 'corporativo' || plan === 'corp';
    if (!enabled) return { allowed: false, empresaId: empresa.id, plan, reason: 'O agente DOT está em acesso antecipado para os planos Rei e Corporativo.' };
    return { allowed: true, empresaId: empresa.id, plan, userId: String(payload.id || '') || null, demo: false };
  } catch {
    return { allowed: false, reason: 'Token inválido ou expirado.' };
  }
}

async function requireAgentMutation(res: Response, access: DotAgentAccess, resource: DotAccessResource, action: DotAccessAction): Promise<boolean> {
  if (access.demo || !access.empresaId || !access.userId) {
    res.status(403).json({
      ok: false,
      error: 'Permissão autenticada é necessária para alterar objetivos do agente DOT.',
      code: 'DOT_PERMISSION_REQUIRED',
      resource,
      action,
    });
    return false;
  }
  try {
    await requireDotAccess(access.empresaId, resource, action, access.userId, { route: 'dot/agent', action });
    return true;
  } catch (error) {
    res.status(403).json({ ok: false, error: error instanceof Error ? error.message : 'Permissão DOT insuficiente.', code: 'DOT_PERMISSION_REQUIRED', resource, action });
    return false;
  }
}

function deny(res: Response, access: DotAgentAccess) {
  return res.status(403).json({ ok: false, error: access.reason || 'Acesso ao agente DOT não liberado.', code: 'DOT_AGENT_PLAN_REQUIRED', allowedPlans: ['rei', 'corporativo'] });
}

export function mountDotAgentRoutes(app: Express) {
  app.get('/api/dot/agent/workspace', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    try {
      res.json({ ok: true, ...await getDotAgentWorkspace(access.empresaId), plan: access.plan, plan_label: planLabel(access.plan || '') });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao carregar o espaço do agente DOT.' });
    }
  });

  app.get('/api/dot/agent/plans', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId || !access.userId) return deny(res, access);
    try {
      const plans = await listDotPlans(access.empresaId, access.userId, Number(req.query.limit) || 10);
      res.json({ ok: true, plans });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao carregar planos do agente DOT.' });
    }
  });

  app.get('/api/dot/agent/plans/:id/steps', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId || !access.userId) return deny(res, access);
    try {
      const plans = await listDotPlans(access.empresaId, access.userId, 50);
      const plan = plans.find((item) => item.id === req.params.id);
      if (!plan) return res.status(404).json({ ok: false, error: 'Plano não encontrado.' });
      const steps = await listDotPlanSteps(plan.id);
      // Evidence may contain raw review/search data. The UI receives only the
      // execution metadata; sensitive evidence remains server-side and in audit storage.
      const safeSteps = steps.map(({ evidence: _evidence, ...step }) => step);
      res.json({ ok: true, plan, steps: safeSteps });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao carregar etapas do plano.' });
    }
  });

  app.post('/api/dot/agent/plans/:id/continue', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId || !access.userId) return deny(res, access);
    if (!(await requireAgentMutation(res, access, 'operations', 'update'))) return;
    try {
      const plans = await listDotPlans(access.empresaId, access.userId, 50);
      const plan = plans.find((item) => item.id === req.params.id);
      if (!plan) return res.status(404).json({ ok: false, error: 'Plano não encontrado.' });
      if (!['paused', 'waiting_approval'].includes(plan.status)) {
        return res.status(409).json({ ok: false, error: 'Este plano não está disponível para retomada.', status: plan.status });
      }
      const approvalGranted = req.body?.approved === true;
      if (plan.status === 'waiting_approval' && !approvalGranted) {
        return res.status(409).json({ ok: false, error: 'Aprovação explícita é necessária para continuar este plano.', code: 'DOT_APPROVAL_REQUIRED' });
      }

      void runDotAgent({
        empresaId: access.empresaId,
        actorUserId: access.userId,
        sessionId: plan.sessionId,
        objective: plan.objective,
        context: JSON.stringify(await getDotAgentWorkspace(access.empresaId)),
        history: '',
        maxTokens: Math.max(600, Number(process.env.DOT_DELEGATION_MAX_TOKENS || 900)),
        allowTools: true,
        planId: plan.id,
        approvalGranted,
      }).catch((error) => {
        console.warn('DOT agente: falha ao retomar plano', error instanceof Error ? error.message : error);
      });

      res.status(202).json({ ok: true, plan_id: plan.id, resumed: true, approval_granted: approvalGranted });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível retomar o plano.' });
    }
  });

  app.get('/api/dot/agent/goals', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    try {
      res.json({ ok: true, goals: await listDotAgentGoals(access.empresaId) });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao carregar objetivos.' });
    }
  });

  app.post('/api/dot/agent/goals', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireAgentMutation(res, access, 'operations', 'create'))) return;
    try {
      const goal = await createDotAgentGoal(access.empresaId, req.body || {});
      const mission = await createMissionForGoal(access.empresaId, goal.id, goal.title);

      // A delegação já acorda o runtime agentivo. A missão legada permanece
      // para compatibilidade visual, mas o trabalho principal passa pelo
      // loop dinâmico com ferramentas, evidências, plano persistente e replanejamento.
      void runDotAgent({
        empresaId: access.empresaId,
        actorUserId: access.userId,
        sessionId: `goal:${goal.id}`,
        objective: goal.title,
        context: JSON.stringify(await getDotAgentWorkspace(access.empresaId)),
        history: '',
        maxTokens: Math.max(600, Number(process.env.DOT_DELEGATION_MAX_TOKENS || 900)),
        allowTools: true,
      }).then(async (runtime) => {
        const nextProgress = runtime.stopped_reason === 'final' ? 100 : runtime.stopped_reason === 'approval_required' ? 70 : Number(goal.progress || 0);
        await updateDotAgentGoal(access.empresaId as string, goal.id, { progress: nextProgress });
      }).catch((error) => {
        console.warn('DOT agente: falha na delegação inicial', error instanceof Error ? error.message : error);
      });

      void wakeDotAgentWorker();
      res.status(201).json({ ok: true, goal, mission, agent_started: true });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível criar o objetivo.' });
    }
  });

  app.patch('/api/dot/agent/goals/:id', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    if (!(await requireAgentMutation(res, access, 'operations', 'update'))) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'ID de objetivo inválido.' });
    try {
      const goal = await updateDotAgentGoal(access.empresaId, id, req.body || {});
      if (!goal) return res.status(404).json({ ok: false, error: 'Objetivo não encontrado.' });
      res.json({ ok: true, goal });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível atualizar o objetivo.' });
    }
  });
}
