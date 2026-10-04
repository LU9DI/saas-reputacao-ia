import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { canManageDotPermissions } from '../services/dotAccessControl.js';
import { completeDotOAuth, disconnectDotOAuth, startDotOAuth } from '../services/dotOAuthBroker.js';
import type { DotIntegrationProvider } from '../services/dotIntegrationRegistry.js';

const providers = new Set(['crm','email','calendar','erp','whatsapp','marketing']);

function provider(value: string): DotIntegrationProvider | null {
  return providers.has(value) ? value as DotIntegrationProvider : null;
}

async function authCompany(req: Request, res: Response) {
  const token = extrairToken(req);
  if (!token) { res.status(401).json({ok:false,error:'Autenticação necessária.'}); return null; }
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({empresa_id: payload.empresa_id, role: payload.role})) { res.status(403).json({ok:false,error:'Conta admin sem integrações de empresa.'}); return null; }
    const empresa = await findEmpresa(payload.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) { res.status(403).json({ok:false,error:'Assinatura/trial inativo.'}); return null; }
    return payload;
  } catch { res.status(401).json({ok:false,error:'Token inválido ou expirado.'}); return null; }
}

export function mountDotOAuthRoutes(app: Express) {
  app.post('/api/dot/agent/integrations/:provider/connect', async (req: Request, res: Response) => {
    const payload = await authCompany(req,res); if (!payload) return;
    const p = provider(req.params.provider); if (!p) return res.status(404).json({ok:false,error:'Provedor não suportado.'});
    if (!canManageDotPermissions({empresa_id: payload.empresa_id, role: payload.role})) return res.status(403).json({ok:false,error:'Somente owner/admin/gestor/manager pode conectar integrações.'});
    try {
      const result = await startDotOAuth(payload.empresa_id, payload.id, p);
      res.json({ok:true,...result});
    } catch (e:any) { res.status(400).json({ok:false,error:String(e?.message || e)}); }
  });

  app.get('/api/dot/agent/oauth/callback', async (req: Request, res: Response) => {
    try {
      const code = String(req.query.code || '');
      const state = String(req.query.state || '');
      if (req.query.error) return res.status(400).send('Autorização OAuth cancelada.');
      const result = await completeDotOAuth({code,state});
      const redirect = process.env.DOT_OAUTH_SUCCESS_REDIRECT?.trim() || '/dot';
      res.redirect(redirect);
      void result;
    } catch (e:any) { res.status(400).send(`Falha na conexão OAuth: ${String(e?.message || e)}`); }
  });

  app.delete('/api/dot/agent/integrations/:provider/connect', async (req: Request, res: Response) => {
    const payload = await authCompany(req,res); if (!payload) return;
    const p = provider(req.params.provider); if (!p) return res.status(404).json({ok:false,error:'Provedor não suportado.'});
    if (!canManageDotPermissions({empresa_id: payload.empresa_id, role: payload.role})) return res.status(403).json({ok:false,error:'Somente owner/admin/gestor/manager pode desconectar integrações.'});
    try { await disconnectDotOAuth(payload.empresa_id, p); res.json({ok:true,status:'disconnected'}); }
    catch (e:any) { res.status(400).json({ok:false,error:String(e?.message || e)}); }
  });
}
