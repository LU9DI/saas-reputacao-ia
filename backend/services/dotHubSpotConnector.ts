import { getDb } from './lib/db.js';
import { getDotCredential } from './dotCredentialVault.js';
import { registerDotConnector, type DotConnectorContext } from './dotConnector.js';

const BASE_URL = 'https://api.hubapi.com';
const OBJECTS = new Set(['contacts', 'companies', 'deals']);

async function token(empresaId: string) {
  const credential = await getDotCredential(empresaId, 'crm', 'access_token');
  if (!credential) throw new Error('Token CRM indisponível ou expirado.');
  return credential.value;
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
