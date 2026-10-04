import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { listDotIntegrationStatus } from '../services/dotIntegrationRegistry.js';

export function mountDotIntegrationRoutes(app: Express) {
  app.get('/api/dot/agent/integrations', async (req: Request, res: Response) => {
    const token = extrairToken(req);
    if (!token && process.env.NODE_ENV !== 'production') return res.json({ ok: true, integrations: await listDotIntegrationStatus('demo') });
    if (!token) return res.status(401).json({ ok:false, error:'Autenticação necessária.' });
    try {
      const payload = verifyAccessToken(token);
      if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) return res.status(403).json({ok:false,error:'Conta admin sem integrações de empresa.'});
      const empresa = await findEmpresa(payload.empresa_id);
      if (!empresa || !empresaTemAcesso(empresa)) return res.status(403).json({ok:false,error:'Assinatura/trial inativo.'});
      res.json({ ok:true, integrations: await listDotIntegrationStatus(empresa.id) });
    } catch {
      res.status(401).json({ok:false,error:'Token inválido ou expirado.'});
    }
  });
}
