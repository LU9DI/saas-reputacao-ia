import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { canManageDotPermissions } from '../services/dotAccessControl.js';
import { completeDotOAuth, disconnectDotOAuth, startDotOAuth } from '../services/dotOAuthBroker.js';
import { putDotCredential } from '../services/dotCredentialVault.js';
import type { DotIntegrationProvider } from '../services/dotIntegrationRegistry.js';
import { setDotPermission } from '../services/dotAccessControl.js';
import rateLimit from 'express-rate-limit';

const providers = new Set(['crm','email','calendar','erp','whatsapp','marketing']);

const integrationMutationLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de integração. Aguarde alguns minutos.' },
});

async function validateHubSpotReadScopes(key: string) {
  const endpoints = [
    '/crm/v3/objects/contacts?limit=1',
    '/crm/v3/objects/companies?limit=1',
    '/crm/v3/objects/deals?limit=1',
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const results = await Promise.all(endpoints.map((endpoint) =>
      fetch('https://api.hubapi.com' + endpoint, {
        headers: { Accept: 'application/json', Authorization: 'Bearer ' + key },
        signal: controller.signal,
      })
    ));
    return results.every((response) => response.ok);
  } finally {
    clearTimeout(timeout);
  }
}

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
  app.post('/api/dot/agent/integrations/:provider/connect', integrationMutationLimiter, async (req: Request, res: Response) => {
    const payload = await authCompany(req,res); if (!payload) return;
    const p = provider(req.params.provider); if (!p) return res.status(404).json({ok:false,error:'Provedor não suportado.'});
    if (!canManageDotPermissions({empresa_id: payload.empresa_id, role: payload.role})) return res.status(403).json({ok:false,error:'Somente owner/admin/gestor/manager pode conectar integrações.'});
    try {
      const result = await startDotOAuth(payload.empresa_id, payload.id, p);
      res.json({ok:true,...result});
    } catch (e:any) { res.status(400).json({ok:false,error:String(e?.message || e)}); }
  });

  app.post('/api/dot/agent/integrations/crm/service-key', integrationMutationLimiter, async (req: Request, res: Response) => {
    const payload = await authCompany(req,res); if (!payload) return;
    if (!canManageDotPermissions({empresa_id: payload.empresa_id, role: payload.role})) {
      return res.status(403).json({ok:false,error:'Somente owner/admin/gestor/manager pode conectar integrações.'});
    }
    const key = String(req.body?.serviceKey || '').trim();
    if (!key || key.length < 20 || key.length > 256 || /\s/.test(key)) return res.status(400).json({ok:false,error:'Service Key do HubSpot inválida.'});
    try {
      const valid = await validateHubSpotReadScopes(key);
      if (!valid) return res.status(400).json({ok:false,error:'A Service Key foi recusada pelo HubSpot ou não possui os três escopos de leitura necessários.'});
      const db = (await import('../lib/db.js')).getDb();
      const nowIso = new Date().toISOString();
      await putDotCredential({ empresaId: payload.empresa_id, provider: 'crm', kind: 'access_token', value: key, expiresAt: null });
      const existing = await db.get('SELECT id FROM dot_integrations WHERE empresa_id=? AND provider=? LIMIT 1', [payload.empresa_id, 'crm']);
      const scopes = 'crm.objects.contacts.read,crm.objects.companies.read,crm.objects.deals.read';
      if (existing) {
        await db.run('UPDATE dot_integrations SET status=?, scopes=?, token_ref=?, updated_at=? WHERE id=? AND empresa_id=?', ['connected', scopes, 'vault', nowIso, existing.id, payload.empresa_id]);
      } else {
        await db.run('INSERT INTO dot_integrations (empresa_id,provider,provider_account_id,status,scopes,token_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [payload.empresa_id, 'crm', null, 'connected', scopes, 'vault', nowIso, nowIso]);
      }
      // O usuário que conectou a conta recebe apenas a permissão CRM.read.
      // Não abrimos acesso automaticamente para todos os usuários da empresa.
      await setDotPermission(payload.empresa_id, {
        resource: 'crm', action: 'read', granted: true,
        userId: payload.id, grantedBy: payload.id,
      });
      // O agente é um principal separado do usuário: a integração concede
      // somente a leitura explicitamente necessária para o trabalhador autônomo.
      await setDotPermission(payload.empresa_id, {
        resource: 'crm', action: 'read', granted: true,
        userId: 'agent', grantedBy: payload.id,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ok:true,status:'connected',provider:'crm',scopes:scopes.split(',')});
    } catch (e:any) {
      res.status(400).json({ok:false,error:String(e?.message || e)});
    }
  });

  app.get('/api/dot/agent/oauth/callback', integrationMutationLimiter, async (req: Request, res: Response) => {
    try {
      const code = String(req.query.code || '').slice(0, 4096);
      const state = String(req.query.state || '').slice(0, 512);
      if (req.query.error) return res.status(400).send('Autorização OAuth cancelada.');
      const result = await completeDotOAuth({code,state});
      const redirect = process.env.DOT_OAUTH_SUCCESS_REDIRECT?.trim() || '/dot';
      res.redirect(redirect);
      void result;
    } catch { res.status(400).send('Não foi possível concluir a conexão OAuth. Tente novamente.'); }
  });

  app.delete('/api/dot/agent/integrations/:provider/connect', integrationMutationLimiter, async (req: Request, res: Response) => {
    const payload = await authCompany(req,res); if (!payload) return;
    const p = provider(req.params.provider); if (!p) return res.status(404).json({ok:false,error:'Provedor não suportado.'});
    if (!canManageDotPermissions({empresa_id: payload.empresa_id, role: payload.role})) return res.status(403).json({ok:false,error:'Somente owner/admin/gestor/manager pode desconectar integrações.'});
    try { await disconnectDotOAuth(payload.empresa_id, p); res.json({ok:true,status:'disconnected'}); }
    catch (e:any) { res.status(400).json({ok:false,error:String(e?.message || e)}); }
  });
}
