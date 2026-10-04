import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { listDotIntegrationStatus } from '../services/dotIntegrationRegistry.js';
import { requireDotAccess } from '../services/dotAccessControl.js';
import { runDotConnector } from '../services/dotConnector.js';

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
  app.post('/api/dot/agent/integrations/crm/read', async (req: Request, res: Response) => {
    const token = extrairToken(req);
    if (!token) return res.status(401).json({ ok:false, error:'Autenticação necessária.' });
    try {
      const payload = verifyAccessToken(token);
      if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) {
        return res.status(403).json({ok:false,error:'Conta admin sem integrações de empresa.'});
      }
      const empresa = await findEmpresa(payload.empresa_id);
      if (!empresa || !empresaTemAcesso(empresa)) {
        return res.status(403).json({ok:false,error:'Assinatura/trial inativo.'});
      }
      await requireDotAccess(empresa.id, 'crm', 'read', payload.id, { connector: 'crm.hubspot.read' });
      const operation = String(req.body?.operation || '');
      const allowed = /^(contacts|companies|deals)\.(list|get|search)$/.test(operation);
      if (!allowed) return res.status(400).json({ok:false,error:'Somente leitura de contatos, empresas e negócios.'});
      const input = req.body?.input || {};
      if (operation.endsWith('.get') && !/^\d+$/.test(String(input?.id || ''))) {
        return res.status(400).json({ok:false,error:'ID CRM inválido.'});
      }
      if (operation.endsWith('.search') && typeof input?.query !== 'string') {
        return res.status(400).json({ok:false,error:'Consulta de busca do CRM inválida.'});
      }
      const result = await runDotConnector(
        'crm.hubspot.read',
        { empresaId: empresa.id, userId: payload.id },
        operation,
        req.body?.input || {},
      );
      res.status(result.ok ? 200 : 400).json(result);
    } catch (error: any) {
      const status = error?.code === 'DOT_PERMISSION_REQUIRED' ? 403 : 400;
      res.status(status).json({ok:false,error:String(error?.message || error)});
    }
  });

}
