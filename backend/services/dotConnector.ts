import type { DotAccessResource } from './dotAccessControl.js';

export type DotConnectorContext = {
  empresaId: string;
  integrationId?: number;
  userId?: string | null;
};

export type DotConnector = {
  key: string;
  resource: DotAccessResource;
  label: string;
  capabilities: string[];
  connected: (ctx: DotConnectorContext) => Promise<boolean>;
  execute: (ctx: DotConnectorContext, operation: string, input: unknown) => Promise<{ ok: boolean; output?: unknown; error?: string }>;
};

const connectors = new Map<string, DotConnector>();

export function registerDotConnector(connector: DotConnector) {
  connectors.set(connector.key, connector);
}

export function getDotConnector(key: string) {
  return connectors.get(key) || null;
}

export function listDotConnectors() {
  return Array.from(connectors.values()).map(({ key, resource, label, capabilities }) => ({ key, resource, label, capabilities }));
}

export async function runDotConnector(key: string, ctx: DotConnectorContext, operation: string, input: unknown) {
  const connector = getDotConnector(key);
  if (!connector) return { ok: false, error: 'Conector DOT não registrado.' };
  if (!(await connector.connected(ctx))) return { ok: false, error: 'Integração não conectada.' };
  return connector.execute(ctx, operation, input);
}
