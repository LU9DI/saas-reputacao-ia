import type { DotAccessAction, DotAccessResource } from './dotAccessControl.js';

export type DotCapability = {
  key: string;
  resource: DotAccessResource;
  read: boolean;
  write: boolean;
  execute: boolean;
  externalSideEffect: boolean;
  approvalRequired: boolean;
  description: string;
};

const capabilities: DotCapability[] = [
  { key: 'filtra.context', resource: 'filtra', read: true, write: false, execute: false, externalSideEffect: false, approvalRequired: false, description: 'Ler e analisar dados internos já disponíveis no Filtra.' },
  { key: 'operations.case', resource: 'operations', read: true, write: true, execute: true, externalSideEffect: false, approvalRequired: true, description: 'Criar e acompanhar tarefas/casos operacionais internos.' },
  { key: 'crm.core', resource: 'crm', read: true, write: true, execute: true, externalSideEffect: false, approvalRequired: true, description: 'Consultar e preparar alterações em CRM; executar somente com permissão.' },
  { key: 'email.core', resource: 'email', read: true, write: true, execute: true, externalSideEffect: true, approvalRequired: true, description: 'Ler, preparar e enviar e-mails conforme escopo autorizado.' },
  { key: 'calendar.core', resource: 'calendar', read: true, write: true, execute: true, externalSideEffect: false, approvalRequired: true, description: 'Consultar e criar/alterar eventos conforme escopo autorizado.' },
  { key: 'whatsapp.core', resource: 'whatsapp', read: true, write: true, execute: true, externalSideEffect: true, approvalRequired: true, description: 'Preparar e enviar mensagens somente com integração e autorização.' },
  { key: 'erp.core', resource: 'erp', read: true, write: true, execute: true, externalSideEffect: false, approvalRequired: true, description: 'Consultar e operar dados do ERP conforme escopo autorizado.' },
  { key: 'marketing.core', resource: 'marketing', read: true, write: true, execute: true, externalSideEffect: true, approvalRequired: true, description: 'Consultar e preparar/operar campanhas de marketing.' },
];

export function listDotCapabilities() { return capabilities; }

export function capabilityForResource(resource: DotAccessResource) {
  return capabilities.filter((item) => item.resource === resource);
}

export function requiredPermissionForTask(resource: DotAccessResource, mode: 'read'|'prepare'|'modify'|'execute') {
  const action: DotAccessAction = mode === 'read' ? 'read' : mode === 'prepare' ? 'create' : mode === 'modify' ? 'update' : 'execute';
  return { resource, action };
}
