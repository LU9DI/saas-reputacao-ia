import { getDb } from './lib/db.js';
import { getDotCredential, putDotCredential } from './dotCredentialVault.js';
import { registerDotConnector, type DotConnectorContext } from './dotConnector.js';

const BASE_URL = 'https://api.hubapi.com';
const OBJECTS = new Set(['contacts', 'companies', 'deals']);

async function token(empresaId: string) {
  const credential = await getDotCredential(empresaId, 'crm', 'access_token');
  if (credential) return credential.value;

  const refresh = await getDotCredential(empresaId, 'crm', 'refresh_token', { allowExpired: true });
  const clientId = process.env.DOT_OAUTH_CRM_CLIENT_ID?.trim();
  if (!refresh || !clientId) throw new Error('Sessão OAuth CRM indisponível.');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh.value,
    client_id: clientId,
  });
  const secret = process.env.DOT_OAUTH_CRM_CLIENT_SECRET?.trim();
  if (secret) body.set('client_secret', secret);

  const response = await fetch(
    process.env.DOT_OAUTH_CRM_TOKEN_URL?.trim() || 'https://api.hubapi.com/oauth/2026-03/token',
    { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body },
  );
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error('Não foi possível renovar a sessão do CRM.');

  await putDotCredential({
    empresaId,
    provider: 'crm',
    kind: 'access_token',
    value: String(data.access_token),
    expiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
  });
  if (data.refresh_token) {
    await putDotCredential({ empresaId, provider: 'crm', kind: 'refresh_token', value: String(data.refresh_token) });
  }
  return String(data.access_token);
}

async function read(empresaId: string, object: string, id?: string) {
  const t = await token(empresaId);
  const suffix = id ? '/' + encodeURIComponent(id) : '';
  const response = await fetch(BASE_URL + '/crm/v3/objects/' + object + suffix, {
    headers: { Authorization: 'Bearer ' + t, Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('CRM respondeu HTTP ' + response.status + '.');
  return data;
}

export const hubSpotDotConnector = {
  key: 'crm.hubspot.read',
  resource: 'crm' as const,
  label: 'HubSpot CRM — somente leitura',
  capabilities: ['contacts.list','contacts.get','companies.list','companies.get','deals.list','deals.get'],
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
    const match = operation.match(/^(contacts|companies|deals)\.(list|get)$/);
    if (!match || !OBJECTS.has(match[1])) {
      return { ok: false, error: 'Operação não permitida: CRM é somente leitura.' };
    }
    try {
      const object = match[1];
      if (match[2] === 'get') {
        const id = String(input?.id || '');
        if (!/^\d+$/.test(id)) return { ok: false, error: 'ID CRM inválido.' };
        return { ok: true, output: await read(ctx.empresaId, object, id) };
      }
      const result = await read(ctx.empresaId, object);
      return { ok: true, output: result };
    } catch (error: any) {
      return { ok: false, error: String(error?.message || error) };
    }
  },
};

registerDotConnector(hubSpotDotConnector);
