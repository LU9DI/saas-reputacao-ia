import { getDb } from '../lib/db.js';

export type DotIntegrationProvider = 'crm'|'email'|'calendar'|'erp'|'whatsapp'|'marketing';

export type DotIntegrationDefinition = {
  provider: DotIntegrationProvider;
  label: string;
  resource: string;
  scopes: string[];
  requiresOAuth: boolean;
  externalSideEffects: boolean;
};

const registry: DotIntegrationDefinition[] = [
  { provider:'crm', label:'CRM', resource:'crm', scopes:['read','analyze','create','update','execute'], requiresOAuth:true, externalSideEffects:true },
  { provider:'email', label:'E-mail', resource:'email', scopes:['read','analyze','create','update','execute','external_send'], requiresOAuth:true, externalSideEffects:true },
  { provider:'calendar', label:'Calendário', resource:'calendar', scopes:['read','analyze','create','update','execute'], requiresOAuth:true, externalSideEffects:false },
  { provider:'erp', label:'ERP', resource:'erp', scopes:['read','analyze','create','update','execute'], requiresOAuth:true, externalSideEffects:true },
  { provider:'whatsapp', label:'WhatsApp', resource:'whatsapp', scopes:['read','analyze','create','update','execute','external_send'], requiresOAuth:true, externalSideEffects:true },
  { provider:'marketing', label:'Marketing', resource:'marketing', scopes:['read','analyze','create','update','execute','external_send'], requiresOAuth:true, externalSideEffects:true },
];

export function listDotIntegrations() { return registry; }

export async function ensureDotIntegrationSchema() {
  const db = getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    scopes TEXT,
    token_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_dot_integrations_empresa_provider ON dot_integrations(empresa_id, provider)');
}

export async function listDotIntegrationStatus(empresaId: string) {
  const db = getDb();
  const rows = await db.all('SELECT provider, provider_account_id, status, scopes, created_at, updated_at FROM dot_integrations WHERE empresa_id = ? ORDER BY provider', [empresaId]);
  return registry.map((definition) => {
    const row = rows.find((item: any) => String(item.provider) === definition.provider);
    return {
      ...definition,
      status: row?.status || 'disconnected',
      provider_account_id: row?.provider_account_id || null,
      scopes: row?.scopes ? String(row.scopes).split(',').filter(Boolean) : [],
    };
  });
}
