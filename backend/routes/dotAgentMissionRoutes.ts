import type { Express } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { requireDotAccess } from '../services/dotAccessControl.js';
import { createMissionForGoal, listDotAgentMissions, listDotAgentMissionSteps, advanceMission } from '../services/dotAgentMissions.js';
import { runCurrentDotMissionStep } from '../services/dotAgentMissionRunner.js';
import { wakeDotAgentWorker } from '../services/dotAgentWorker.js';

async function access(req: any) {
  const token = extrairToken(req);
  if (!token && process.env.DOT_DEMO_MODE === '1' && process.env.NODE_ENV !== 'production') {
    return { ok: true, empresaId: 'demo', userId: null, demo: true };
  }
  if (!token) return { ok: false, reason: 'Autenticação necessária.' };
  try {
    const p = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: p.empresa_id, role: p.role })) return { ok: false, reason: 'Conta admin não possui agente de empresa.' };
    const empresa = await findEmpresa(p.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) return { ok: false, reason: 'Assinatura/trial inativo.' };
    const plan = String(empresa.plan || '').toLowerCase();
    if (!['rei','corporativo','corp'].includes(plan)) return { ok: false, reason: 'Agente DOT disponível nos planos Rei e Corporativo.' };
    return { ok: true, empresaId: empresa.id, userId: String(p.id || '') || null, demo: false };
  } catch { return { ok: false, reason: 'Token inválido ou expirado.' }; }
}

function deny(res: any, a: any) { return res.status(403).json({ ok:false, error:a.reason||'Acesso negado.' }); }

async function requireMissionPermission(a: any, action: 'create' | 'execute') {
  if (!a.userId || a.demo) {
    const error = new Error('Permissão explícita do usuário é necessária para alterar uma missão DOT.');
    (error as any).code = 'DOT_PERMISSION_REQUIRED';
    throw error;
  }
  await requireDotAccess(a.empresaId, 'operations', action, a.userId, { route: 'dot_agent_missions' });
}

export function mountDotAgentMissionRoutes(app: Express) {
  app.get('/api/dot/agent/missions', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    try { res.json({ok:true, missions:await listDotAgentMissions(a.empresaId)}); }
    catch(e){res.status(500).json({ok:false,error:e instanceof Error?e.message:'Falha ao carregar missões.'});}
  });

  app.post('/api/dot/agent/missions', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    const goalId=Number(req.body?.goal_id); const title=String(req.body?.title||'').trim();
    if(!Number.isInteger(goalId)||goalId<=0||title.length<3) return res.status(400).json({ok:false,error:'goal_id e título são obrigatórios.'});
    try {
      await requireMissionPermission(a, 'create');
      const m=await createMissionForGoal(a.empresaId,goalId,title);
      if(!m)return res.status(404).json({ok:false,error:'Objetivo não encontrado.'});
      void wakeDotAgentWorker();
      res.status(201).json({ok:true,mission:m});
    } catch(e){res.status(403).json({ok:false,error:e instanceof Error?e.message:'Falha ao criar missão.'});}
  });

  app.get('/api/dot/agent/missions/:id/steps', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0)return res.status(400).json({ok:false,error:'ID inválido.'});
    try { res.json({ok:true,steps:await listDotAgentMissionSteps(a.empresaId,id)}); }
    catch(e){res.status(500).json({ok:false,error:e instanceof Error?e.message:'Falha ao carregar etapas.'});}
  });

  app.post('/api/dot/agent/missions/:id/run-step', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0)return res.status(400).json({ok:false,error:'ID inválido.'});
    try {
      await requireMissionPermission(a, 'execute');
      const result=await runCurrentDotMissionStep(a.empresaId,id);
      if(!result)return res.status(404).json({ok:false,error:'Missão não encontrada.'});
      res.json({ok:true,...result});
    } catch(e){res.status(403).json({ok:false,error:e instanceof Error?e.message:'Falha ao executar etapa da missão.'});}
  });

  app.post('/api/dot/agent/missions/:id/advance', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0)return res.status(400).json({ok:false,error:'ID inválido.'});
    try {
      await requireMissionPermission(a, 'execute');
      const m=await advanceMission(a.empresaId,id,String(req.body?.output||''));
      if(!m)return res.status(404).json({ok:false,error:'Missão não encontrada.'});
      res.json({ok:true,mission:m});
    } catch(e){res.status(403).json({ok:false,error:e instanceof Error?e.message:'Falha ao avançar missão.'});}
  });
}
