import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { planLabel } from '../lib/plans.js';
import { createDotAgentGoal, getDotAgentWorkspace, listDotAgentGoals, updateDotAgentGoal } from '../services/dotAgent.js';
import { createMissionForGoal } from '../services/dotAgentMissions.js';
import { wakeDotAgentWorker } from '../services/dotAgentWorker.js';
import { verifyDotCapabilities } from '../services/dotCapabilityVerifier.js';

type DotAgentAccess = { allowed: boolean; empresaId?: string; plan?: string; reason?: string };

async function resolveDotAgentAccess(req: Request): Promise<DotAgentAccess> {
  const token = extrairToken(req);
  if (!token) {
    if (process.env.NODE_ENV !== 'production') return { allowed: true, empresaId: 'demo', plan: 'rei' };
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
    return { allowed: true, empresaId: empresa.id, plan };
  } catch {
    return { allowed: false, reason: 'Token inválido ou expirado.' };
  }
}

function deny(res: Response, access: DotAgentAccess) {
  return res.status(403).json({ ok: false, error: access.reason || 'Acesso ao agente DOT não liberado.', code: 'DOT_AGENT_PLAN_REQUIRED', allowedPlans: ['rei', 'corporativo'] });
}

export function mountDotAgentRoutes(app: Express) {
  app.get('/api/dot/agent/capabilities', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    try {
      const result = await verifyDotCapabilities(access.empresaId);
      res.setHeader('Cache-Control', 'no-store');
      res.status(result.ok ? 200 : 409).json(result);
    } catch {
      res.status(500).json({ ok: false, error: 'Falha na verificação das capacidades do DOT.' });
    }
  });

  app.get('/api/dot/agent/workspace', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
    try {
      res.json({ ok: true, ...await getDotAgentWorkspace(access.empresaId), plan: access.plan, plan_label: planLabel(access.plan || '') });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao carregar o espaço do agente DOT.' });
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
    try {
      const goal = await createDotAgentGoal(access.empresaId, req.body || {});
      const mission = await createMissionForGoal(access.empresaId, goal.id, goal.title);
      void wakeDotAgentWorker();
      res.status(201).json({ ok: true, goal, mission });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível criar o objetivo.' });
    }
  });

  app.patch('/api/dot/agent/goals/:id', async (req: Request, res: Response) => {
    const access = await resolveDotAgentAccess(req);
    if (!access.allowed || !access.empresaId) return deny(res, access);
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
