/**
 * Integração direta com Google Search Console.
 * OAuth 2.0 server-side + refresh token criptografado por empresa.
 */
import crypto from 'node:crypto';
import type { Database } from 'sqlite';
import { getDb } from '../lib/db.js';
import { findEmpresa } from '../lib/db.js';

const READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const OAUTH_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN = 'https://oauth2.googleapis.com/token';
const SEARCH_CONSOLE_API = 'https://www.googleapis.com/webmasters/v3';
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';

function requiredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Integração Google não configurada: defina ${name}.`);
  return value;
}

function clientId() { return requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_ID'); }
function clientSecret() { return requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET'); }

function redirectUri() {
  return String(
    process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI ||
    `${String(process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\\/$/, '')}/api/integrations/google-search-console/callback`
  ).trim();
}

function encryptionKey(): Buffer {
  const configured = String(process.env.GSC_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || '').trim();
  if (!configured) throw new Error('Defina GSC_TOKEN_ENCRYPTION_KEY para proteger as credenciais do Google.');
  return crypto.createHash('sha256').update(configured, 'utf8').digest();
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decrypt(value: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = String(value).split('.');
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error('Credencial Google armazenada em formato inválido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
}

export async function ensureGoogleSearchConsoleSchema(db: Database = getDb()) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS gsc_search_console_connections (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      google_email TEXT,
      refresh_token_encrypted TEXT NOT NULL,
      scope TEXT NOT NULL,
      site_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gsc_connection_empresa ON gsc_search_console_connections(empresa_id);
    CREATE TABLE IF NOT EXISTS gsc_oauth_states (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gsc_oauth_state_expiry ON gsc_oauth_states(expires_at);
  `);
}

function encodeState(payload: { id: string; empresaId: string; userId: string; nonce: string; exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = String(process.env.GSC_OAUTH_STATE_SECRET || process.env.JWT_SECRET || '').trim();
  if (!secret) throw new Error('OAuth Google não configurado: defina GSC_OAUTH_STATE_SECRET ou JWT_SECRET.');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function decodeState(state: string) {
  const [body, signature] = String(state || '').split('.');
  const secret = String(process.env.GSC_OAUTH_STATE_SECRET || process.env.JWT_SECRET || '').trim();
  if (!body || !signature || !secret) throw new Error('Estado OAuth inválido.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Estado OAuth inválido.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload?.id || !payload?.empresaId || !payload?.userId || !payload?.nonce || Number(payload.exp) < Date.now()) {
    throw new Error('Estado OAuth expirado.');
  }
  return payload as { id: string; empresaId: string; userId: string; nonce: string; exp: number };
}

export async function createGoogleSearchConsoleAuthorization(empresaId: string, userId: string) {
  const db = getDb();
  await ensureGoogleSearchConsoleSchema(db);
  const empresa = await findEmpresa(empresaId);
  if (!empresa) throw new Error('Empresa não encontrada.');
  const id = crypto.randomUUID();
  const nonce = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  await db.run(
    'INSERT INTO gsc_oauth_states (id, empresa_id, user_id, nonce, expires_at) VALUES (?, ?, ?, ?, ?)',
    [id, empresaId, userId, nonce, expiresAt]
  );
  const state = encodeState({ id, empresaId, userId, nonce, exp: Date.now() + 10 * 60_000 });
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: `openid email profile ${READONLY_SCOPE}`,
    state,
  });
  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
}

async function exchangeCode(code: string) {
  const response = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body.refresh_token) {
    throw new Error(body.error_description || body.error || 'Google não retornou um refresh token.');
  }
  return body as { access_token: string; refresh_token: string; scope?: string };
}

async function fetchGoogleAccessToken(refreshToken: string) {
  const response = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || 'Não foi possível renovar o acesso ao Google.');
  }
  return String(body.access_token);
}

async function googleFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error?.message || body?.error_description || `Google API respondeu ${response.status}.`);
    (error as any).status = response.status;
    throw error;
  }
  return body;
}

export async function completeGoogleSearchConsoleAuthorization(stateRaw: string, code: string) {
  const state = decodeState(stateRaw);
  const db = getDb();
  await ensureGoogleSearchConsoleSchema(db);
  const pending = await db.get('SELECT * FROM gsc_oauth_states WHERE id = ? AND used_at IS NULL', [state.id]);
  if (!pending || pending.empresa_id !== state.empresaId || pending.user_id !== state.userId || pending.nonce !== state.nonce) {
    throw new Error('Autorização Google inválida ou já utilizada.');
  }
  if (new Date(String(pending.expires_at)).getTime() < Date.now()) throw new Error('Autorização Google expirada.');

  const token = await exchangeCode(code);
  const profile = await googleFetch(USERINFO, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const now = new Date().toISOString();
  const existing = await db.get('SELECT id FROM gsc_search_console_connections WHERE empresa_id = ?', [state.empresaId]);
  if (existing) {
    await db.run(
      'UPDATE gsc_search_console_connections SET user_id=?, google_email=?, refresh_token_encrypted=?, scope=?, revoked_at=NULL, updated_at=? WHERE empresa_id=?',
      [state.userId, profile?.email ? String(profile.email).slice(0, 320) : null, encrypt(token.refresh_token), token.scope || READONLY_SCOPE, now, state.empresaId]
    );
  } else {
    await db.run(
      'INSERT INTO gsc_search_console_connections (id, empresa_id, user_id, google_email, refresh_token_encrypted, scope, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), state.empresaId, state.userId, profile?.email ? String(profile.email).slice(0, 320) : null, encrypt(token.refresh_token), token.scope || READONLY_SCOPE, now, now]
    );
  }
  await db.run('UPDATE gsc_oauth_states SET used_at=? WHERE id=?', [now, state.id]);
  await db.run('DELETE FROM gsc_oauth_states WHERE expires_at < ?', [now]);
  return { email: profile?.email || null };
}

async function connectionForEmpresa(empresaId: string) {
  const db = getDb();
  await ensureGoogleSearchConsoleSchema(db);
  return db.get('SELECT * FROM gsc_search_console_connections WHERE empresa_id = ? AND revoked_at IS NULL', [empresaId]);
}

export async function getGoogleSearchConsoleStatus(empresaId: string) {
  const row = await connectionForEmpresa(empresaId);
  if (!row) return { connected: false, email: null, siteUrl: null };
  return { connected: true, email: row.google_email || null, siteUrl: row.site_url || null, connectedAt: row.created_at, updatedAt: row.updated_at };
}

export async function listGoogleSearchConsoleSites(empresaId: string) {
  const row = await connectionForEmpresa(empresaId);
  if (!row) throw new Error('Google Search Console não conectado.');
  const refreshToken = decrypt(String(row.refresh_token_encrypted));
  try {
    const accessToken = await fetchGoogleAccessToken(refreshToken);
    const data = await googleFetch(`${SEARCH_CONSOLE_API}/sites`, { headers: { Authorization: `Bearer ${accessToken}` } });
    return (data.siteEntry || []).map((site: any) => ({
      siteUrl: String(site.siteUrl || ''),
      permissionLevel: String(site.permissionLevel || ''),
      selected: String(site.siteUrl || '') === String(row.site_url || ''),
    }));
  } catch (error) {
    if ((error as any)?.status === 401 || String((error as Error)?.message || '').toLowerCase().includes('invalid grant')) {
      await getDb().run('UPDATE gsc_search_console_connections SET revoked_at=?, updated_at=? WHERE empresa_id=?', [new Date().toISOString(), new Date().toISOString(), empresaId]);
    }
    throw error;
  }
}

export async function selectGoogleSearchConsoleSite(empresaId: string, siteUrl: string) {
  const sites = await listGoogleSearchConsoleSites(empresaId);
  const selected = sites.find((site) => site.siteUrl === siteUrl);
  if (!selected) throw new Error('Essa propriedade não está disponível para a conta Google conectada.');
  await getDb().run('UPDATE gsc_search_console_connections SET site_url=?, updated_at=? WHERE empresa_id=?', [siteUrl, new Date().toISOString(), empresaId]);
  return { siteUrl, permissionLevel: selected.permissionLevel };
}

export type GscSearchAnalyticsQuery = {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  type?: string;
  searchType?: string;
  dimensionFilterGroups?: unknown[];
  aggregationType?: string;
  rowLimit?: number;
  startRow?: number;
};

export async function queryGoogleSearchConsole(empresaId: string, input: GscSearchAnalyticsQuery) {
  const row = await connectionForEmpresa(empresaId);
  if (!row) throw new Error('Google Search Console não conectado.');
  const siteUrl = String(row.site_url || '').trim();
  if (!siteUrl) throw new Error('Selecione uma propriedade do Search Console antes de consultar dados.');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.startDate) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(input.endDate)) throw new Error('Datas inválidas.');
  const start = new Date(`${input.startDate}T00:00:00Z`);
  const end = new Date(`${input.endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error('Intervalo de datas inválido.');
  const refreshToken = decrypt(String(row.refresh_token_encrypted));
  const accessToken = await fetchGoogleAccessToken(refreshToken);
  const dimensions = Array.isArray(input.dimensions) ? input.dimensions.filter((x) => ['date','query','page','country','device','searchAppearance'].includes(String(x))) : ['query','page'];
  const payload = {
    startDate: input.startDate,
    endDate: input.endDate,
    dimensions,
    type: String(input.type || input.searchType || 'web'),
    dimensionFilterGroups: Array.isArray(input.dimensionFilterGroups) ? input.dimensionFilterGroups : undefined,
    aggregationType: input.aggregationType,
    rowLimit: Math.min(25_000, Math.max(1, Number(input.rowLimit || 1000))),
    startRow: Math.max(0, Number(input.startRow || 0)),
  };
  return googleFetch(`${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function disconnectGoogleSearchConsole(empresaId: string) {
  const row = await connectionForEmpresa(empresaId);
  if (!row) return;
  const refreshToken = decrypt(String(row.refresh_token_encrypted));
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' });
  } catch { /* revogação local continua mesmo se o endpoint externo falhar */ }
  await getDb().run('DELETE FROM gsc_search_console_connections WHERE empresa_id=?', [empresaId]);
}
