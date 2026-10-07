import type { Express, Request, Response } from 'express';
import { extrairToken, verifyAccessToken, isAdminUser } from '../lib/auth.js';
import { findEmpresa, getDb } from '../lib/db.js';
import { empresaTemAcesso } from '../services/billingService.js';
import { clientIp, writeAuditFromReq } from '../lib/auditLog.js';
import {
  completeGoogleSearchConsoleAuthorization,
  createGoogleSearchConsoleAuthorization,
  disconnectGoogleSearchConsole,
  getGoogleSearchConsoleStatus,
  listGoogleSearchConsoleSites,
  queryGoogleSearchConsole,
  selectGoogleSearchConsoleSite,
  ensureGoogleSearchConsoleSchema,
} from '../services/googleSearchConsole.js';

async function actor(req: Request) {
  const token = extrairToken(req);
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    if (isAdminUser({ empresa_id: payload.empresa_id, role: payload.role })) return null;
    const empresa = await findEmpresa(String(payload.empresa_id || ''));
    if (!empresa || !empresaTemAcesso(empresa)) return null;
    return { userId: String(payload.id || ''), empresaId: String(empresa.id), role: String(payload.role || 'user') };
  } catch {
    return null;
  }
}

function frontendUrl(path: string) {
  const base = String(process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}${path}`;
}

export function mountGoogleSearchConsoleRoutes(app: Express) {
  app.get('/api/integrations/google-search-console/status', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    try {
      await ensureGoogleSearchConsoleSchema(getDb());
      res.json({ ok: true, ...(await getGoogleSearchConsoleStatus(a.empresaId)) });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao consultar a integração.' });
    }
  });

  app.get('/api/integrations/google-search-console/connect', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId || !a.userId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    try {
      const url = await createGoogleSearchConsoleAuthorization(a.empresaId, a.userId);
      res.redirect(302, url);
    } catch (error) {
      res.status(503).json({ ok: false, error: error instanceof Error ? error.message : 'Google Search Console não configurado.' });
    }
  });

  app.get('/api/integrations/google-search-console/callback', async (req: Request, res: Response) => {
    const state = String(req.query.state || '');
    const code = String(req.query.code || '');
    if (!state || !code) return res.redirect(frontendUrl('/integracoes/google-search-console?error=google_oauth_cancelled'));
    try {
      const result = await completeGoogleSearchConsoleAuthorization(state, code);
      const db = getDb();
      const parsed = JSON.parse(Buffer.from(state.split('.')[0], 'base64url').toString('utf8'));
      await writeAuditFromReq(db, req, {
        action: 'google.search_console.connect',
        actor_user_id: String(parsed.userId),
        empresa_id: String(parsed.empresaId),
        target: 'google-search-console',
        detail: { email: result.email },
      });
      res.redirect(frontendUrl('/integracoes/google-search-console?connected=1'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na autorização Google.';
      res.redirect(frontendUrl(`/integracoes/google-search-console?error=${encodeURIComponent(message.slice(0, 180))}`));
    }
  });

  app.get('/api/integrations/google-search-console/sites', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    try {
      res.json({ ok: true, sites: await listGoogleSearchConsoleSites(a.empresaId) });
    } catch (error) {
      res.status(502).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao consultar propriedades Google.' });
    }
  });

  app.post('/api/integrations/google-search-console/site', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId || !a.userId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    const siteUrl = String(req.body?.siteUrl || '').trim();
    if (!siteUrl || siteUrl.length > 500) return res.status(400).json({ ok: false, error: 'siteUrl inválido.' });
    try {
      const selected = await selectGoogleSearchConsoleSite(a.empresaId, siteUrl);
      await writeAuditFromReq(getDb(), req, {
        action: 'google.search_console.site_select',
        actor_user_id: a.userId,
        actor_role: a.role,
        empresa_id: a.empresaId,
        target: siteUrl,
      });
      res.json({ ok: true, ...selected });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível selecionar a propriedade.' });
    }
  });

  app.post('/api/integrations/google-search-console/query', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    try {
      const result = await queryGoogleSearchConsole(a.empresaId, req.body || {});
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(502).json({ ok: false, error: error instanceof Error ? error.message : 'Falha na consulta ao Search Console.' });
    }
  });

  app.delete('/api/integrations/google-search-console', async (req: Request, res: Response) => {
    const a = await actor(req);
    if (!a?.empresaId || !a.userId) return res.status(401).json({ ok: false, error: 'Autenticação necessária.' });
    try {
      await disconnectGoogleSearchConsole(a.empresaId);
      await writeAuditFromReq(getDb(), req, {
        action: 'google.search_console.disconnect',
        actor_user_id: a.userId,
        actor_role: a.role,
        empresa_id: a.empresaId,
        target: 'google-search-console',
        ip: clientIp(req),
      });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Falha ao desconectar Google Search Console.' });
    }
  });
}
