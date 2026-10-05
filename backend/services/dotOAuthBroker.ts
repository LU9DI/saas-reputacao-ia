import crypto from 'crypto';
import { getDb } from '../lib/db.js';
import { putDotCredential, revokeDotCredentials } from './dotCredentialVault.js';
import { listDotIntegrations, type DotIntegrationProvider } from './dotIntegrationRegistry.js';
import { setDotPermission } from './dotAccessControl.js';

type OAuthProviderConfig = {
  provider: DotIntegrationProvider;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
};

const providers = new Map<DotIntegrationProvider, OAuthProviderConfig>();

function envProvider(provider: DotIntegrationProvider): OAuthProviderConfig | null {
  const p = provider.toUpperCase();
  const authorizationUrl = process.env[`DOT_OAUTH_${p}_AUTHORIZATION_URL`]?.trim()
    || (provider === 'crm' ? 'https://app.hubspot.com/oauth/authorize' : '');
  const tokenUrl = process.env[`DOT_OAUTH_${p}_TOKEN_URL`]?.trim()
    || (provider === 'crm' ? 'https://api.hubapi.com/oauth/2026-03/token' : '');
  const clientId = process.env[`DOT_OAUTH_${p}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`DOT_OAUTH_${p}_CLIENT_SECRET`]?.trim();
  const scopes = (process.env[`DOT_OAUTH_${p}_SCOPES`] || (provider === 'crm'
    ? 'crm.objects.contacts.read crm.objects.companies.read crm.objects.deals.read'
    : '')).split(/[ ,]+/).map(s => s.trim()).filter(Boolean);
  if (!authorizationUrl || !tokenUrl || !clientId || !scopes.length) return null;
  return { provider, authorizationUrl, tokenUrl, clientId, clientSecret, scopes };
}

export function getDotOAuthProvider(provider: DotIntegrationProvider) {
  if (!listDotIntegrations().some(x => x.provider === provider)) return null;
  if (!providers.has(provider)) {
    const config = envProvider(provider);
    if (config) providers.set(provider, config);
  }
  return providers.get(provider) || null;
}

export async function ensureDotOAuthSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_oauth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    state_hash TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT
  )`);
  await db.exec('CREATE INDEX IF NOT EXISTS ix_dot_oauth_sessions_expiry ON dot_oauth_sessions(expires_at)');
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_oauth_sessions_state ON dot_oauth_sessions(state_hash)');
}

function b64url(value: Buffer) {
  return value.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function createPkceVerifier() {
  return b64url(crypto.randomBytes(32));
}

function createState() {
  return b64url(crypto.randomBytes(32));
}

function oauthRedirectUri() {
  const configured = process.env.DOT_OAUTH_REDIRECT_URI?.trim();
  if (!configured) throw new Error('DOT_OAUTH_REDIRECT_URI não configurada.');
  if (!configured.startsWith('https://') && process.env.NODE_ENV === 'production') {
    throw new Error('DOT_OAUTH_REDIRECT_URI deve usar HTTPS em produção.');
  }
  return configured;
}

function assertSameOriginRedirect(uri: string) {
  const configured = oauthRedirectUri();
  if (uri !== configured) throw new Error('Redirect URI divergente da configuração.');
}

export async function startDotOAuth(empresaId: string, userId: string, provider: DotIntegrationProvider) {
  const config = getDotOAuthProvider(provider);
  if (!config) throw new Error('Provedor OAuth não configurado para esta integração.');
  const redirectUri = oauthRedirectUri();
  assertSameOriginRedirect(redirectUri);
  const state = createState();
  const verifier = createPkceVerifier();
  const now = Date.now();
  const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
  const db = getDb();
  await db.run(
    'DELETE FROM dot_oauth_sessions WHERE empresa_id=? AND user_id=? AND provider=? AND (status <> ? OR expires_at < ?)',
    [empresaId, userId, provider, 'pending', new Date(now).toISOString()],
  );
  await db.run(
    'INSERT INTO dot_oauth_sessions (empresa_id,user_id,provider,state_hash,code_verifier,redirect_uri,scopes,status,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [empresaId, userId, provider, hash(state), verifier, redirectUri, config.scopes.join(','), 'pending', new Date(now).toISOString(), expiresAt],
  );
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(' '),
    state,
    code_challenge: b64url(crypto.createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
  });
  return { authorizationUrl: `${config.authorizationUrl}${config.authorizationUrl.includes('?') ? '&' : '?'}${params.toString()}`, expiresAt };
}

export async function completeDotOAuth(input: { code: string; state: string }) {
  if (!input.code || !input.state) throw new Error('Código ou state OAuth ausente.');
  const db = getDb();
  const session = await db.get(
    'SELECT * FROM dot_oauth_sessions WHERE state_hash=? LIMIT 1',
    [hash(input.state)],
  );
  if (!session) throw new Error('Sessão OAuth inválida ou já consumida.');
  if (session.status !== 'pending' || new Date(String(session.expires_at)).getTime() <= Date.now()) {
    throw new Error('Sessão OAuth expirada ou já consumida.');
  }
  const config = getDotOAuthProvider(String(session.provider) as DotIntegrationProvider);
  if (!config) throw new Error('Provedor OAuth não configurado.');
  if (session.redirect_uri !== oauthRedirectUri()) throw new Error('Redirect URI não confere.');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: String(session.redirect_uri),
    client_id: config.clientId,
    code_verifier: String(session.code_verifier),
  });
  if (config.clientSecret) body.set('client_secret', config.clientSecret);
  const response = await fetch(config.tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error('Falha na troca do código OAuth por token.');
  }
  const provider = String(session.provider) as DotIntegrationProvider;
  const empresaId = String(session.empresa_id);
  const expiresAt = payload.expires_in ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString() : null;
  await putDotCredential({ empresaId, provider, kind: 'access_token', value: String(payload.access_token), expiresAt });
  if (payload.refresh_token) {
    await putDotCredential({ empresaId, provider, kind: 'refresh_token', value: String(payload.refresh_token) });
  }
  const grantedScopes = Array.isArray(payload.scopes)
    ? payload.scopes.map((scope: unknown) => String(scope)).filter(Boolean)
    : String(payload.scope || session.scopes).split(/[ ,]+/).filter(Boolean);
  const existingIntegration = await db.get(
    'SELECT id FROM dot_integrations WHERE empresa_id=? AND provider=? LIMIT 1',
    [empresaId, provider],
  );
  const nowIso = new Date().toISOString();
  if (existingIntegration) {
    await db.run(
      'UPDATE dot_integrations SET provider_account_id=?, status=?, scopes=?, token_ref=?, updated_at=? WHERE id=? AND empresa_id=?',
      [payload.hub_id ? String(payload.hub_id) : null, 'connected', grantedScopes.join(','), 'vault', nowIso, existingIntegration.id, empresaId],
    );
  } else {
    await db.run(
      'INSERT INTO dot_integrations (empresa_id,provider,provider_account_id,status,scopes,token_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
      [empresaId, provider, payload.hub_id ? String(payload.hub_id) : null, 'connected', grantedScopes.join(','), 'vault', nowIso, nowIso],
    );
  }
  await db.run('UPDATE dot_oauth_sessions SET status=?, consumed_at=? WHERE id=?', ['consumed', new Date().toISOString(), session.id]);
  // A autorização OAuth concede CRM.read somente ao usuário que iniciou a conexão.
  // Novos usuários precisam de uma concessão explícita, evitando expansão lateral.
  if (provider === 'crm') {
    await setDotPermission(empresaId, {
      resource: 'crm', action: 'read', granted: true,
      userId: String(session.user_id), grantedBy: String(session.user_id),
    });
  }
  return { empresaId, provider, scopes: grantedScopes };
}

export async function disconnectDotOAuth(empresaId: string, provider: DotIntegrationProvider) {
  await revokeDotCredentials(empresaId, provider);
  await getDb().run('UPDATE dot_integrations SET status=?, token_ref=NULL, updated_at=? WHERE empresa_id=? AND provider=?', ['disconnected', new Date().toISOString(), empresaId, provider]);
}
