import type { DotAccessAction, DotAccessResource } from './dotAccessControl.js';

export type DotTaskRisk = 'low' | 'medium' | 'high' | 'critical';
export type DotTaskMode = 'observe' | 'analyze' | 'prepare' | 'modify' | 'execute';

export type DotTaskPlan = {
  resource: DotAccessResource;
  mode: DotTaskMode;
  risk: DotTaskRisk;
  requiresApproval: boolean;
  externalSideEffect: boolean;
  requiredPermission: DotAccessAction;
  prerequisites: string[];
  validation: string[];
};

const modePermission: Record<DotTaskMode, DotAccessAction> = {
  observe: 'read',
  analyze: 'analyze',
  prepare: 'create',
  modify: 'update',
  execute: 'execute',
};

export function buildDotTaskPlan(input: {
  resource: DotAccessResource;
  mode: DotTaskMode;
  risk?: DotTaskRisk;
  externalSideEffect?: boolean;
  prerequisites?: string[];
  validation?: string[];
}): DotTaskPlan {
  const external = Boolean(input.externalSideEffect);
  const risk = input.risk || (external ? 'high' : 'medium');
  return {
    resource: input.resource,
    mode: input.mode,
    risk,
    requiresApproval: external || input.mode === 'modify' || input.mode === 'execute' || risk === 'high' || risk === 'critical',
    externalSideEffect: external,
    requiredPermission: modePermission[input.mode],
    prerequisites: input.prerequisites || ['tenant_validated', 'integration_available'],
    validation: input.validation || ['executor_confirmed', 'result_persisted', 'audit_recorded'],
  };
}

export function assertDotTaskPlanSafe(plan: DotTaskPlan) {
  if (!plan.resource || !plan.requiredPermission) throw new Error('Plano DOT inválido.');
  if (plan.externalSideEffect && !plan.requiresApproval) throw new Error('Ação externa não pode ser executada sem aprovação.');
  if (plan.mode === 'execute' && !plan.validation.includes('result_persisted')) throw new Error('Execução exige validação persistida.');
  return true;
}
