import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { createMissionForGoal, listDotAgentMissions, advanceMission } from '../services/dotAgentMissions.js';

async function access(req: Request) {
  const token = extrairToken(req);
  if (!token && process.env.NODE_ENV !== 'production') return { ok: true, empresaId: 'demo' };
  if (!token) return { ok: false, reason: 'Autenticação necessária.' };
  try {
    const p = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: p.empresa_id, role: p.role })) return { ok: false, reason: 'Conta admin não possui agente de empresa.' };
    const empresa = await findEmpresa(p.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) return { ok: false, reason: 'Assinatura/trial inativo.' };
    const plan = String(empresa.plan || '').toLowerCase();
    if (!['rei','corporativo','corp'].includes(plan)) return { ok: false, reason: 'Agente DOT disponível nos planos Rei e Corporativo.' };
    return { ok: true, empresaId: empresa.id };
  } catch { return { ok: false, reason: 'Token inválido ou expirado.' }; }
}
function deny(res: Response, a: any) { return res.status(403).json({ ok:false, error:a.reason||'Acesso negado.' }); }

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
    try { const m=await createMissionForGoal(a.empresaId,goalId,title); if(!m)return res.status(404).json({ok:false,error:'Objetivo não encontrado.'}); res.status(201).json({ok:true,mission:m}); }
    catch(e){res.status(400).json({ok:false,error:e instanceof Error?e.message:'Falha ao criar missão.'});}
  });
  app.post('/api/dot/agent/missions/:id/advance', async (req,res) => {
    const a=await access(req); if(!a.ok) return deny(res,a);
    const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0)return res.status(400).json({ok:false,error:'ID inválido.'});
    try { const m=await advanceMission(a.empresaId,id); if(!m)return res.status(404).json({ok:false,error:'Missão não encontrada.'}); res.json({ok:true,mission:m}); }
    catch(e){res.status(400).json({ok:false,error:e instanceof Error?e.message:'Falha ao avançar missão.'});}
  });
}
