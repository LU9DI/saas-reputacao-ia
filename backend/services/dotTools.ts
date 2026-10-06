export type DotPreparedAction = {
  action: string;
  title: string;
  description: string;
  risk: 'baixo' | 'medio' | 'alto';
  requires_approval: boolean;
  external_side_effect: boolean;
  status: 'prepared';
  demo: boolean;
};

const ACTIONS: Record<string, Omit<DotPreparedAction, 'action' | 'demo'>> = {
  priorizar_e_resolver: {
    title: 'Priorizar e resolver',
    description: 'Registrar a prioridade e preparar a resolução para execução controlada.',
    risk: 'medio',
    requires_approval: true,
    external_side_effect: false,
    status: 'prepared',
  },
  escalar_responsavel: {
    title: 'Escalar para responsável',
    description: 'Preparar o encaminhamento interno para o responsável da empresa.',
    risk: 'baixo',
    requires_approval: true,
    external_side_effect: false,
    status: 'prepared',
  },
  corrigir_e_acompanhar: {
    title: 'Corrigir e acompanhar',
    description: 'Preparar uma ação interna de correção e acompanhamento do caso.',
    risk: 'medio',
    requires_approval: true,
    external_side_effect: false,
    status: 'prepared',
  },
};

export function prepareDotAction(action: string, demo = false): DotPreparedAction {
  const normalized = String(action || '').trim().toLowerCase();
  const template = ACTIONS[normalized] || {
    title: 'Preparar ação',
    description: 'Preparar esta ação para revisão antes de qualquer execução.',
    risk: 'medio' as const,
    requires_approval: true,
    external_side_effect: false,
    status: 'prepared' as const,
  };

  return {
    action: normalized || 'acao_nao_especificada',
    ...template,
    demo,
  };
}
