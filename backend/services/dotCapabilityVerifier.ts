import { getDb } from '../lib/db.js';
import { listDotActionDefinitions, isDotActionExecutorRegistered } from './dotActionRegistry.js';
import { listDotConnectors } from './dotConnector.js';
import { dotAccessAllowed } from './dotAccessControl.js';

export async function verifyDotCapabilities(empresaId: string) {
  const db = getDb();
  const actions = listDotActionDefinitions().map((definition) => {
    const executorRegistered = isDotActionExecutorRegistered(definition.action);
    const gatewaySafe = definition.externalSideEffect === false && definition.requiresApproval === true;
    const executableThroughGateway = gatewaySafe && executorRegistered;
    return {
      action: definition.action, category: definition.category, risk: definition.risk,
      requiresApproval: definition.requiresApproval, externalSideEffect: definition.externalSideEffect,
      executor: definition.executorKey, executorRegistered, executableThroughGateway,
      status: executableThroughGateway ? 'operational' : 'unavailable',
    };
  });

  const connectors = [];
  for (const connector of listDotConnectors()) {
    const connectedRow = await db.get(
      'SELECT status, scopes FROM dot_integrations WHERE empresa_id=? AND provider=? LIMIT 1',
      [empresaId, connector.resource === 'crm' ? 'crm' : connector.resource],
    );
    const permission = await dotAccessAllowed(
      empresaId, connector.resource, 'read', 'agent',
      { verifier: 'dot_capability_preflight', connector: connector.key },
    );
    const connected = connectedRow?.status === 'connected';
    connectors.push({
      key: connector.key, label: connector.label, resource: connector.resource,
      capabilities: connector.capabilities, connected, agentReadPermission: permission,
      status: connected && permission ? 'operational' : 'unavailable',
      executableCapabilities: connector.capabilities.filter((capability) => /\.(list|get|search)$/.test(capability)),
      writeCapabilities: connector.capabilities.filter((capability) => !/\.(list|get|search)$/.test(capability)),
    });
  }

  const blockers = [
    ...actions.filter((item) => !item.executableThroughGateway)
      .map((item) => 'Ação ' + item.action + ' não possui executor seguro registrado no gateway.'),
    ...connectors.filter((item) => item.writeCapabilities.length > 0)
      .map((item) => 'Conector ' + item.key + ' declara capacidade mutável; ela deve ser homologada antes de uso.'),
    ...connectors.filter((item) => item.connected && !item.agentReadPermission)
      .map((item) => 'Conector ' + item.key + ' está conectado, mas o principal agent não possui leitura concedida.'),
  ];

  return {
    ok: blockers.length === 0, empresaId,
    policy: { tenantIsolation: true, defaultDeny: true, piiMinimization: true,
      externalSideEffectsDefaultDenied: true, approvalRequiredForRegisteredActions: true },
    actions, connectors, blockers, verifiedAt: new Date().toISOString(),
  };
}
