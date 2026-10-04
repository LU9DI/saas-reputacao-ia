import { getDb } from '../lib/db.js';
import { getDotCredential, putDotCredential } from './dotCredentialVault.js';
import { registerDotConnector, type DotConnectorContext } from './dotConnector.js';

const BASE_URL = 'https://api.hubapi.com';
const OBJECTS = new Set(['contacts', 'companies', 'deals']);

function boundedLimit(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 20;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

function boundedAfter(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? String(Math.floor(n)) : undefined;
}

async function token(empresaId: string) {
  const credential = await getDotCredential(empresaId, 'crm', 'access_token');
  if (credential) return credential.value;
  const refresh = await getDotCredential(empresaId, 'crm', 'refresh_token', { allowExpired: true });
  const clientId = process.env.DOT_OAUTH_CRM_CLIENT_ID?.trim();
  if (!refresh || !clientId) throw new Error('Sessão OAuth CRM indisponível.');
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh.value, client_id: clientId });
  const secret = process.env.DOT_OAUTH_CRM_CLIENT_SECRET?.trim();
  if (secret) body.set('client_secret', secret);
  const response = await fetch(
    process.env.DOT_OAUTH_CRM_TOKEN_URL?.trim() || 'https://api.hubapi.com/oauth/2026-03/token',
    { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body },
  );
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error('Não foi possível renovar a sessão do CRM.');
  await putDotCredential({
    empresaId, provider: 'crm', kind: 'access_token', value: String(data.access_token),
    expiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
  });
  if (data.refresh_token) await putDotCredential({ empresaId, provider: 'crm', kind: 'refresh_token', value: String(data.refresh_token) });
  return String(data.access_token);
}

async function hubspotRequest(empresaId: string, path: string, init?: RequestInit) {
  const t = await token(empresaId);
  const response = await fetch(BASE_URL + path, {
    ...init,
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + t, ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('CRM respondeu HTTP ' + response.status + '.');
  return data;
}

async function read(empresaId: string, object: string, id?: string, input: any = {}) {
  const suffix = id ? '/' + encodeURIComponent(id) : '';
  const params = new URLSearchParams();
  if (!id) {
    params.set('limit', String(boundedLimit(input?.limit)));
    const after = boundedAfter(input?.after);
    if (after) params.set('after', after);
  }
  const query = params.toString();
  return hubspotRequest(empresaId, '/crm/v3/objects/' + object + suffix + (query ? '?' + query : ''));
}

async function search(empresaId: string, object: string, input: any = {}) {
  const body: any = { limit: boundedLimit(input?.limit), query: typeof input?.query === 'string' ? input.query.slice(0, 200) : '' };
  const after = boundedAfter(input?.after);
  if (after) body.after = after;
  if (Array.isArray(input?.properties)) body.properties = input.properties.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 50);
  return hubspotRequest(empresaId, '/crm/v3/objects/' + object + '/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const hubSpotDotConnector = {
  key: 'crm.hubspot.read',
  resource: 'crm' as const,
  label: 'HubSpot CRM — somente leitura',
  capabilities: [
    'contacts.list','contacts.get','contacts.search',
    'companies.list','companies.get','companies.search',
    'deals.list','deals.get','deals.search',
  ],
  async connected(ctx: DotConnectorContext) {
    const row = await getDb().get(
      'SELECT status, scopes FROM dot_integrations WHERE empresa_id=? AND provider=? LIMIT 1',
      [ctx.empresaId, 'crm'],
    );
    if (!row || row.status !== 'connected') return false;
    const scopes = String(row.scopes || '').split(',').filter(Boolean);
    return scopes.includes('crm.objects.contacts.read') &&
      scopes.includes('crm.objects.companies.read') &&
      scopes.includes('crm.objects.deals.read');
  },
  async execute(ctx: DotConnectorContext, operation: string, input: any) {
    const match = operation.match(/^(contacts|companies|deals)\.(list|get|search)$/);
    if (!match || !OBJECTS.has(match[1])) return { ok: false, error: 'Operação não permitida: CRM é somente leitura.' };
    try {
      const object = match[1];
      const mode = match[2];
      if (mode === 'get') {
        const id = String(input?.id || '');
        if (!/^\d+$/.test(id)) return { ok: false, error: 'ID CRM inválido.' };
        return { ok: true, output: await read(ctx.empresaId, object, id, input) };
      }
      if (mode === 'search') return { ok: true, output: await search(ctx.empresaId, object, input) };
      return { ok: true, output: await read(ctx.empresaId, object, undefined, input) };
    } catch (error: any) {
      return { ok: false, error: String(error?.message || error) };
    }
  },
};

registerDotConnector(hubSpotDotConnector);
