import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { listDotPermissions, setDotPermission, type DotAccessAction, type DotAccessResource } from '../services/dotAccessControl.js';
import { listDotTools, invokeDotTool } from '../services/dotToolRegistry.js';

const resources: DotAccessResource[] = ['filtra','customers','sales','marketing','operations','finance','hr','crm','documents','calendar','email','whatsapp','erp','other'];
const actions: DotAccessAction[] = ['read','analyze','create','update','execute','external_send'];

function demoEnabled() {
  return process.env.DOT_DEMO_MODE === '1' && process.env.NODE_ENV !== 'production';
}

async function access(req: Request) {
  const token = extrairToken(req);
  if (!token) {
    if (demoEnabled()) return { ok: true, empresaId: 'demo', userId: null, canManagePermissions: false, demo: true };
    return { ok: false, reason: 'Autenticação necessária.' };
  }
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) {
      return { ok: false, reason: 'Conta admin não possui permissões do agente de empresa.' };
    }
    const empresa = await findEmpresa(payload.empresa_id);
    if (!empresa || !empresaTemAcesso(empresa)) return { ok: false, reason: 'Assinatura/trial inativo.' };
    const role = String(payload.role || '').toLowerCase();
    const canManagePermissions = ['empresa', 'owner', 'empresa_admin', 'admin_empresa'].includes(role);
    return { ok: true, empresaId: empresa.id, userId: String(payload.id || '') || null, canManagePermissions, demo: false };
  } catch {
    return { ok: false, reason: 'Token inválido ou expirado.' };
  }
}

export function mountDotAccessRoutes(app: Express) {
  app.get('/api/dot/agent/permissions', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    res.json({ ok: true, permissions: await listDotPermissions(a.empresaId, a.userId), can_manage: Boolean(a.canManagePermissions), demo: Boolean(a.demo) });
  });

  app.put('/api/dot/agent/permissions', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    if (a.demo || !a.canManagePermissions || !a.userId) {
      return res.status(403).json({ ok: false, error: 'Somente um responsável autenticado pela conta pode alterar permissões do DOT.', code: 'DOT_PERMISSION_ADMIN_REQUIRED' });
    }
    const { resource, action, granted } = req.body || {};
    if (!resources.includes(resource) || !actions.includes(action) || typeof granted !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Permissão inválida.', resources, actions });
    }
    const permission = await setDotPermission(a.empresaId, { resource, action, granted, grantedBy: a.userId });
    res.json({ ok: true, permission });
  });

  app.get('/api/dot/agent/tools', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    res.json({ ok: true, tools: listDotTools(), demo: Boolean(a.demo) });
  });

  app.post('/api/dot/agent/tools/:toolId/invoke', async (req: Request, res: Response) => {
    const a = await access(req);
    if (!a.ok || !a.empresaId) return res.status(403).json({ ok: false, error: a.reason });
    try {
      const toolId = String(req.params.toolId || '');
      const result = await invokeDotTool({
        empresaId: a.empresaId,
        toolId,
        actorType: 'user',
        actorUserId: a.userId,
        input: req.body || {},
      });
      res.json(result);
    } catch (error) {
      res.status(403).json({ ok: false, error: error instanceof Error ? error.message : 'Ferramenta DOT não autorizada.' });
    }
  });
}
