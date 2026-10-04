import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { listDotPermissions, setDotPermission, type DotAccessAction, type DotAccessResource } from '../services/dotAccessControl.js';

const resources: DotAccessResource[] = ['filtra','customers','sales','marketing','operations','finance','hr','crm','documents','calendar','email','whatsapp','erp','other'];
const actions: DotAccessAction[] = ['read','analyze','create','update','execute','external_send'];

async function access(req: Request) {
  const token = extrairToken(req);
  if (!token) {
    if (process.env.NODE_ENV !== 'production') return { ok: true, empresaId: 'demo', userId: null };
    return { ok: false, reason: 'Autenticação necessária.' };
  }
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) return { ok: false, reason: 'Conta admin não possui permissões do agente de empresa.' };
    const empresa = await findEmpresa(payload.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) return { ok: false, reason: 'Assinatura/trial inativo.' };
    return { ok: true, empresaId: empresa.id, userId: String(payload.user_id || payload.sub || '') || null };
  } catch {
    return { ok: false, reason: 'Token inválido ou expirado.' };
  }
}

export function mountDotAccessRoutes(app: Express) {
  app.get('/api/dot/agent/permissions', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    res.json({ ok: true, permissions: await listDotPermissions(a.empresaId, a.userId) });
  });

  app.put('/api/dot/agent/permissions', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    const { resource, action, granted } = req.body || {};
    if (!resources.includes(resource) || !actions.includes(action) || typeof granted !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Permissão inválida.', resources, actions });
    }
    const permission = await setDotPermission(a.empresaId, { resource, action, granted, grantedBy: a.userId });
    res.json({ ok: true, permission });
  });
}
