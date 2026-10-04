'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../utils/apiFailover';
import { ArrowUp, RotateCcw, Bot, CheckCircle2, Clock3, ShieldCheck, Sparkles, TrendingUp, Zap, Clipboard, ClipboardCheck, Wifi, FlaskConical, ChevronRight, ChevronDown, CircleAlert } from 'lucide-react';

const SESSION_KEY = 'filtra-dot-local-session';
const DOT_LOCALE_KEY = 'filtra-dot-locale';
const DOT_MODE_KEY = 'filtra-dot-response-mode';
type DotUi = {
  locale: string;
  earlyAccess: string;
  earlyAccessTitle: string;
  earlyAccessBody: string;
  plan: string;
  newConversation: string;
  protectedActions: string;
  analyzing: string;
  ask: string;
  localDemo: string;
  suggestionsTitle: string;
  canDoTitle: string;
  analyze: string;
  explain: string;
  prepare: string;
  detectPatterns: string;
  memory: string;
  investigate: string;
  internalExecution: string;
  notAvailable: string;
  verifyComplaint: string;
  verifyingComplaint: string;
  decisionOwner: string;
  noAction: string;
  loading: string;
  unavailableTitle: string;
  unavailableBody: string;
  unknownPlan: string;
  noExternalAuto: string;
  companyPlaceholder: string;
  online: string;
  demo: string;
  copyResponse: string;
  copiedResponse: string;
  responseLimit: string;
  quickGuideTitle: string;
  quickGuideBody: string;
  quickGuideSummary: string;
  groupOverview: string;
  groupDecide: string;
  groupTrack: string;
  groupTools: string;
  healthTitle: string;
  monitoringActive: string;
  running: string;
  waiting: string;
  lastRound: string;
  notRunYet: string;
  companies: string;
  processed: string;
  waitingCompanies: string;
  followUpsLabel: string;
  decisionsLabel: string;
  preparedLabel: string;
  overviewTitle: string;
  overviewBody: string;
  prioritySignal: string;
  trendLabel: string;
  signalsLabel: string;
  nextStepLabel: string;
  prepareAction: string;
  alertsTitle: string;
  alertsBody: string;
  autonomy: string;
  decisionsTitle: string;
  decisionsBody: string;
  registered: string;
  finalOwner: string;
  actionsTitle: string;
  actionsBody: string;
  approveAction: string;
  executeLocal: string;
  executedLocal: string;
  followupTitle: string;
  pending: string;
  due: string;
  outcome: string;
  investigateTitle: string;
  investigateBody: string;
  evidenceTitle: string;
  optionsTitle: string;
  riskLabel: string;
  capabilitiesTitle: string;
  suggestionsTitle2: string;
  detailsGroup: string;
  languageLabel: string;
  languageAuto: string;
  languagePt: string;
  languageEn: string;
  languageEs: string;
  responseModeLabel: string;
  modeObjective: string;
  modeDidactic: string;
  modeObjectiveHint: string;
  modeDidacticHint: string;
  whyThisResponse: string;
  explainingResponse: string;
  explanationUnavailable: string;
  pendingDecision: string;
  pendingAction: string;
  signalsContext: string;
  calmContext: string;
  currentTitle: string;
  currentBody: string;
  workflowTitle: string;
  impactLabel: string;
  evidenceLabel: string;
  decisionLabel: string;
  resultLabel: string;
};

const DOT_UI: Record<string, Omit<DotUi, 'locale'>> = {
  pt: {
    earlyAccess: 'Acesso antecipado',
    earlyAccessTitle: 'O Filtra Dot está reservado aos planos Rei e Corporativo.',
    earlyAccessBody: 'Sua conta atual não possui acesso ao Dot. O recurso está em acesso antecipado para clientes Rei e Corporativo.',
    plan: 'Plano identificado',
    newConversation: 'Nova conversa',
    protectedActions: 'Ações internas somente após aprovação',
    analyzing: 'Analisando sinais do negócio…',
    ask: 'Pergunte ao Filtra Dot…',
    localDemo: 'Protótipo local · dados demonstrativos · nenhuma ação externa é executada.',
    suggestionsTitle: 'Sugestões',
    canDoTitle: 'O que posso fazer',
    analyze: 'Analisar avaliações e padrões',
    explain: 'Explicar mudanças na reputação',
    prepare: 'Preparar ações internas para aprovação',
    detectPatterns: 'Detectar padrões recorrentes',
    memory: 'Manter memória da conversa',
    investigate: 'Investigar reclamações com evidências disponíveis',
    internalExecution: 'Registrar e acompanhar ações internamente após aprovação',
    notAvailable: 'Não executa integrações externas, publica respostas, envia mensagens ou exporta arquivos.',
    verifyComplaint: 'Verificar reclamação',
    verifyingComplaint: 'Verificando evidências…',
    decisionOwner: 'A decisão final permanece com o responsável.',
    noAction: 'Nenhuma ação foi preparada ainda.',
    loading: 'Carregando estado operacional…',
    unavailableTitle: 'O Filtra Dot está temporariamente indisponível.',
    unavailableBody: 'O recurso ainda não está habilitado neste ambiente.',
    unknownPlan: 'não identificado',
    noExternalAuto: 'Nenhuma ação externa é executada automaticamente.',
    companyPlaceholder: 'sua empresa',
    online: 'Online',
    demo: 'Demo local',
    copyResponse: 'Copiar resposta',
    copiedResponse: 'Copiado',
    responseLimit: 'Resposta otimizada para ser completa sem excesso de tokens.',
    quickGuideTitle: 'Guia rápido',
    quickGuideBody: 'Entenda o Dot em etapas',
    quickGuideSummary: 'Comece pelo resumo e avance para sinais, decisões, ações e acompanhamento.',
    groupOverview: 'Visão geral',
    groupDecide: 'Decidir',
    groupTrack: 'Acompanhar',
    groupTools: 'Ferramentas',
    healthTitle: 'Saúde do monitoramento',
    monitoringActive: 'Monitoramento ativo',
    running: 'Executando',
    waiting: 'Aguardando',
    lastRound: 'Última rodada',
    notRunYet: 'ainda não executada',
    companies: 'Empresas',
    processed: 'processadas',
    waitingCompanies: 'aguardando',
    followUpsLabel: 'Acompanhamentos',
    decisionsLabel: 'Decisões',
    preparedLabel: 'preparadas',
    overviewTitle: 'Resumo de hoje',
    overviewBody: 'O que mudou, o que importa e qual próximo passo faz sentido.',
    prioritySignal: 'Sinal prioritário',
    trendLabel: 'Tendência',
    signalsLabel: 'Sinais',
    nextStepLabel: 'Próximo passo',
    prepareAction: 'Preparar plano',
    alertsTitle: 'Sinais que merecem atenção',
    alertsBody: 'Sinais detectados automaticamente. Leia a evidência antes de decidir.',
    autonomy: 'Preferências do monitoramento',
    decisionsTitle: 'Decisões sugeridas',
    decisionsBody: 'O Dot transforma sinais em opções claras. A decisão continua com o responsável.',
    registered: 'registradas',
    finalOwner: 'A decisão final permanece com o responsável.',
    actionsTitle: 'Ações preparadas',
    actionsBody: 'Preparar não significa executar. Cada ação passa pelo fluxo de aprovação.',
    approveAction: 'Aprovar ação',
    executeLocal: 'Registrar ação interna',
    executedLocal: 'Ação registrada internamente para acompanhamento; nenhum sistema externo foi alterado.',
    followupTitle: 'Acompanhamento',
    pending: 'pendentes',
    due: 'Retorno previsto',
    outcome: 'Resultado',
    investigateTitle: 'Investigar uma reclamação',
    investigateBody: 'Descreva a reclamação. O Dot verifica o que os dados sustentam e mostra as evidências encontradas.',
    evidenceTitle: 'Evidências encontradas',
    optionsTitle: 'Opções de encaminhamento',
    riskLabel: 'Risco',
    capabilitiesTitle: 'O que o Dot pode fazer',
    suggestionsTitle2: 'Perguntas para começar',
    detailsGroup: 'Detalhes operacionais',
    languageLabel: 'Idioma',
    languageAuto: 'Automático',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Modo de resposta',
    modeObjective: 'Objetivo',
    modeDidactic: 'Didático',
    modeObjectiveHint: 'Direto ao ponto, com evidências e próximo passo.',
    modeDidacticHint: 'Explica melhor o contexto, os termos e a evidência.',
    whyThisResponse: 'Por que o Dot está dizendo isso?',
    explainingResponse: 'Explicando a evidência…',
    explanationUnavailable: 'Não foi possível explicar esta resposta agora.',
    pendingDecision: 'Decisão pendente',
    pendingAction: 'Ação pendente',
    signalsContext: 'sinais',
    calmContext: 'Sem pendências críticas',
    currentTitle: 'Agora',
    currentBody: 'O que merece sua atenção primeiro.',
    workflowTitle: 'Ciclo de decisão',
    impactLabel: 'Impacto',
    evidenceLabel: 'Evidências',
    decisionLabel: 'Decisão',
    resultLabel: 'Resultado',
  },
  en: {
    earlyAccess: 'Early access',
    earlyAccessTitle: 'Filtra Dot is reserved for Rei and Corporativo plans.',
    earlyAccessBody: 'Your account does not have Dot access. The feature is in early access for Rei and Corporativo customers.',
    plan: 'Detected plan',
    newConversation: 'New conversation',
    protectedActions: 'Internal actions require approval',
    analyzing: 'Analyzing business signals…',
    ask: 'Ask Filtra Dot…',
    localDemo: 'Local prototype · demo data · no external action is executed.',
    suggestionsTitle: 'Suggestions',
    canDoTitle: 'What I can do',
    analyze: 'Analyze reviews and patterns',
    explain: 'Explain reputation changes',
    prepare: 'Prepare internal actions for approval',
    detectPatterns: 'Detect recurring patterns',
    memory: 'Keep conversation memory',
    investigate: 'Investigate complaints using available evidence',
    internalExecution: 'Register and track internal actions after approval',
    notAvailable: 'Does not execute external integrations, publish replies, send messages, or export files.',
    verifyComplaint: 'Verify complaint',
    verifyingComplaint: 'Checking evidence…',
    decisionOwner: 'The final decision remains with the responsible owner.',
    noAction: 'No action prepared.',
    loading: 'Loading operational state…',
    unavailableTitle: 'Filtra Dot is temporarily unavailable.',
    unavailableBody: 'The feature is not enabled in this environment.',
    unknownPlan: 'not identified',
    noExternalAuto: 'No external action is executed automatically.',
    companyPlaceholder: 'your company',
    online: 'Online',
    demo: 'Local demo',
    copyResponse: 'Copy response',
    copiedResponse: 'Copied',
    responseLimit: 'Response optimized to stay complete without unnecessary token usage.',
    quickGuideTitle: 'Quick guide',
    quickGuideBody: 'Understand Dot in steps',
    quickGuideSummary: 'Start with the summary, then move to signals, decisions, actions, and follow-up.',
    groupOverview: 'Overview',
    groupDecide: 'Decide',
    groupTrack: 'Track',
    groupTools: 'Tools',
    healthTitle: 'Monitoring health',
    monitoringActive: 'Monitoring active',
    running: 'Running',
    waiting: 'Waiting',
    lastRound: 'Last run',
    notRunYet: 'not run yet',
    companies: 'Companies',
    processed: 'processed',
    waitingCompanies: 'waiting',
    followUpsLabel: 'Follow-ups',
    decisionsLabel: 'Decisions',
    preparedLabel: 'prepared',
    overviewTitle: 'Today’s summary',
    overviewBody: 'What changed, what matters, and what the next useful step is.',
    prioritySignal: 'Priority signal',
    trendLabel: 'Trend',
    signalsLabel: 'Signals',
    nextStepLabel: 'Next step',
    prepareAction: 'Prepare plan',
    alertsTitle: 'Signals that need attention',
    alertsBody: 'Signals detected automatically. Review the evidence before deciding.',
    autonomy: 'Monitoring preferences',
    decisionsTitle: 'Suggested decisions',
    decisionsBody: 'Dot turns signals into clear options. The responsible owner keeps the final decision.',
    registered: 'registered',
    finalOwner: 'The final decision remains with the responsible owner.',
    actionsTitle: 'Prepared actions',
    actionsBody: 'Preparing does not mean executing. Each action follows the approval flow.',
    approveAction: 'Approve action',
    executeLocal: 'Register internal action',
    executedLocal: 'Action recorded internally for follow-up; no external system was changed.',
    followupTitle: 'Follow-up',
    pending: 'pending',
    due: 'Due',
    outcome: 'Outcome',
    investigateTitle: 'Investigate a complaint',
    investigateBody: 'Describe the complaint. Dot checks what the data supports and shows the evidence found.',
    evidenceTitle: 'Evidence found',
    optionsTitle: 'Next-step options',
    riskLabel: 'Risk',
    capabilitiesTitle: 'What Dot can do',
    suggestionsTitle2: 'Questions to get started',
    detailsGroup: 'Operational details',
    languageLabel: 'Language',
    languageAuto: 'Automatic',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Response mode',
    modeObjective: 'Objective',
    modeDidactic: 'Didactic',
    modeObjectiveHint: 'Straight to the point, with evidence and a next step.',
    modeDidacticHint: 'Explains context, terms, and evidence more clearly.',
    whyThisResponse: 'Why is Dot saying this?',
    explainingResponse: 'Explaining the evidence…',
    explanationUnavailable: 'This response could not be explained right now.',
    pendingDecision: 'Pending decision',
    pendingAction: 'Pending action',
    signalsContext: 'signals',
    calmContext: 'No critical pending items',
    currentTitle: 'Now',
    currentBody: 'What deserves your attention first.',
    workflowTitle: 'Decision cycle',
    impactLabel: 'Impact',
    evidenceLabel: 'Evidence',
    decisionLabel: 'Decision',
    resultLabel: 'Outcome',
  },
  es: {
    earlyAccess: 'Acceso anticipado',
    earlyAccessTitle: 'Filtra Dot está reservado para los planes Rei y Corporativo.',
    earlyAccessBody: 'Tu cuenta no tiene acceso a Dot. La función está en acceso anticipado para clientes Rei y Corporativo.',
    plan: 'Plan detectado',
    newConversation: 'Nueva conversación',
    protectedActions: 'Las acciones internas requieren aprobación',
    analyzing: 'Analizando señales del negocio…',
    ask: 'Pregunta a Filtra Dot…',
    localDemo: 'Prototipo local · datos de demostración · no se ejecutan acciones externas.',
    suggestionsTitle: 'Sugerencias',
    canDoTitle: 'Lo que puedo hacer',
    analyze: 'Analizar reseñas y patrones',
    explain: 'Explicar cambios en la reputación',
    prepare: 'Preparar acciones internas para aprobación',
    detectPatterns: 'Detectar patrones recurrentes',
    memory: 'Mantener memoria de la conversación',
    investigate: 'Investigar reclamaciones con las evidencias disponibles',
    internalExecution: 'Registrar y dar seguimiento a acciones internas tras la aprobación',
    notAvailable: 'No ejecuta integraciones externas, publica respuestas, envía mensajes ni exporta archivos.',
    verifyComplaint: 'Verificar reclamación',
    verifyingComplaint: 'Verificando evidencias…',
    decisionOwner: 'La decisión final permanece con el responsable.',
    noAction: 'No hay ninguna acción preparada.',
    loading: 'Cargando estado operativo…',
    unavailableTitle: 'Filtra Dot no está disponible temporalmente.',
    unavailableBody: 'La función aún no está habilitada en este entorno.',
    unknownPlan: 'no identificado',
    noExternalAuto: 'Ninguna acción externa se ejecuta automáticamente.',
    companyPlaceholder: 'tu empresa',
    online: 'En línea',
    demo: 'Demo local',
    copyResponse: 'Copiar respuesta',
    copiedResponse: 'Copiado',
    responseLimit: 'Respuesta optimizada para ser completa sin exceso de tokens.',
    quickGuideTitle: 'Guía rápida',
    quickGuideBody: 'Entiende Dot por etapas',
    quickGuideSummary: 'Empieza por el resumen y avanza hacia señales, decisiones, acciones y seguimiento.',
    groupOverview: 'Resumen',
    groupDecide: 'Decidir',
    groupTrack: 'Seguimiento',
    groupTools: 'Herramientas',
    healthTitle: 'Salud del monitoreo',
    monitoringActive: 'Monitoreo activo',
    running: 'Ejecutando',
    waiting: 'En espera',
    lastRound: 'Última ronda',
    notRunYet: 'todavía no ejecutada',
    companies: 'Empresas',
    processed: 'procesadas',
    waitingCompanies: 'en espera',
    followUpsLabel: 'Seguimientos',
    decisionsLabel: 'Decisiones',
    preparedLabel: 'preparadas',
    overviewTitle: 'Resumen de hoy',
    overviewBody: 'Qué cambió, qué importa y cuál es el siguiente paso útil.',
    prioritySignal: 'Señal prioritaria',
    trendLabel: 'Tendencia',
    signalsLabel: 'Señales',
    nextStepLabel: 'Siguiente paso',
    prepareAction: 'Preparar plan',
    alertsTitle: 'Señales que requieren atención',
    alertsBody: 'Señales detectadas automáticamente. Revisa la evidencia antes de decidir.',
    autonomy: 'Preferencias de monitoreo',
    decisionsTitle: 'Decisiones sugeridas',
    decisionsBody: 'Dot convierte señales en opciones claras. El responsable mantiene la decisión final.',
    registered: 'registradas',
    finalOwner: 'La decisión final permanece con el responsable.',
    actionsTitle: 'Acciones preparadas',
    actionsBody: 'Preparar no significa ejecutar. Cada acción sigue el flujo de aprobación.',
    approveAction: 'Aprobar acción',
    executeLocal: 'Registrar acción interna',
    executedLocal: 'Acción registrada internamente para seguimiento; ningún sistema externo fue alterado.',
    followupTitle: 'Seguimiento',
    pending: 'pendientes',
    due: 'Próximo retorno',
    outcome: 'Resultado',
    investigateTitle: 'Investigar una reclamación',
    investigateBody: 'Describe la reclamación. Dot verifica qué sostienen los datos y muestra las evidencias encontradas.',
    evidenceTitle: 'Evidencias encontradas',
    optionsTitle: 'Opciones de encaminamiento',
    riskLabel: 'Riesgo',
    capabilitiesTitle: 'Lo que Dot puede hacer',
    suggestionsTitle2: 'Preguntas para empezar',
    detailsGroup: 'Detalles operativos',
    languageLabel: 'Idioma',
    languageAuto: 'Automático',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Modo de respuesta',
    modeObjective: 'Objetivo',
    modeDidactic: 'Didáctico',
    modeObjectiveHint: 'Directo al punto, con evidencias y siguiente paso.',
    modeDidacticHint: 'Explica mejor el contexto, los términos y la evidencia.',
    whyThisResponse: '¿Por qué Dot dice esto?',
    explainingResponse: 'Explicando la evidencia…',
    explanationUnavailable: 'No fue posible explicar esta respuesta ahora.',
    pendingDecision: 'Decisión pendiente',
    pendingAction: 'Acción pendiente',
    signalsContext: 'señales',
    calmContext: 'Sin pendientes críticos',
    currentTitle: 'Ahora',
    currentBody: 'Lo que merece tu atención primero.',
    workflowTitle: 'Ciclo de decisión',
    impactLabel: 'Impacto',
    evidenceLabel: 'Evidencias',
    decisionLabel: 'Decisión',
    resultLabel: 'Resultado',
  },
};

function detectDotLocale(): string {
  if (typeof navigator === 'undefined') return 'pt';
  const raw = String(navigator.language || 'pt-BR').toLowerCase();
  if (raw.startsWith('pt')) return 'pt';
  if (raw.startsWith('es')) return 'es';
  return 'en';
}

function dotUi(locale = detectDotLocale()): DotUi {
  return { locale, ...(DOT_UI[locale] || DOT_UI.en) };
}



function dotExtra(locale: string) {
  const maps: Record<string, Record<string, string>> = {
    pt: { plansBadge:'REI / CORPORATIVO', agentSubtitle:'Agente de reputação e crescimento', sendMessage:'Enviar mensagem', prepare:'Preparar', reject:'Rejeitar', verification:'Verificação', confidence:'confiança', followupItem:'Acompanhamento', note:'Nota', criticalDetected:'Piora detectada: nova decisão gerada.', policy:'Política', approvalRequiredWord:'aprovação obrigatória', preparedNotExecuted:'Ação preparada · não executada', approvalRequired:'A aprovação é obrigatória antes de qualquer ação externa.', complaintPlaceholder:'Ex.: cliente diz que esperou 40 minutos para ser atendido...', noSignals:'Nenhum sinal novo no momento.', noDecisions:'Ainda não há decisões sugeridas.', noPreparedActions:'Nenhuma ação foi preparada ainda.', followupEmpty:'O acompanhamento aparecerá quando houver uma ação executada.' },
    en: { plansBadge:'REI / CORPORATE', agentSubtitle:'Reputation and growth agent', sendMessage:'Send message', prepare:'Prepare', reject:'Reject', verification:'Verification', confidence:'confidence', followupItem:'Follow-up', note:'Rating', criticalDetected:'Deterioration detected: a new decision was generated.', policy:'Policy', approvalRequiredWord:'approval required', preparedNotExecuted:'Prepared action · not executed', approvalRequired:'Approval is required before any external action.', complaintPlaceholder:'E.g. a customer says they waited 40 minutes to be served...', noSignals:'No new signals at the moment.', noDecisions:'There are no suggested decisions yet.', noPreparedActions:'No action has been prepared yet.', followupEmpty:'Follow-up will appear after an action is executed.' },
    es: { plansBadge:'REI / CORPORATIVO', agentSubtitle:'Agente de reputación y crecimiento', sendMessage:'Enviar mensaje', prepare:'Preparar', reject:'Rechazar', verification:'Verificación', confidence:'confianza', followupItem:'Seguimiento', note:'Calificación', criticalDetected:'Empeoramiento detectado: se generó una nueva decisión.', policy:'Política', approvalRequiredWord:'aprobación obligatoria', preparedNotExecuted:'Acción preparada · no ejecutada', approvalRequired:'La aprobación es obligatoria antes de cualquier acción externa.', complaintPlaceholder:'Ej.: un cliente dice que esperó 40 minutos para ser atendido...', noSignals:'No hay señales nuevas en este momento.', noDecisions:'Todavía no hay decisiones sugeridas.', noPreparedActions:'Todavía no hay ninguna acción preparada.', followupEmpty:'El seguimiento aparecerá cuando se ejecute una acción.' },
  };
  return maps[locale] || maps.en;
}

function authHeaders(json = true): HeadersInit {
  return json ? { 'Content-Type': 'application/json' } : {};
}

function dotStatusLabel(value: string, locale = 'pt'): string {
  const maps: Record<string, Record<string, string>> = {
    pt: { pending: 'Pendente', prepared: 'Preparada', approved: 'Aprovada', executing: 'Executando', executed: 'Executada', failed: 'Falhou', cancelled: 'Cancelada', completed: 'Concluído', rejected: 'Rejeitada', confirmed: 'Confirmada', unverified: 'Não confirmada', not_found: 'Não encontrada', baixa: 'Baixa', medio: 'Média', alta: 'Alta', critica: 'Crítica' },
    en: { pending: 'Pending', prepared: 'Prepared', approved: 'Approved', executing: 'Running', executed: 'Executed', failed: 'Failed', cancelled: 'Cancelled', completed: 'Completed', rejected: 'Rejected', confirmed: 'Confirmed', unverified: 'Unverified', not_found: 'Not found', baixa: 'Low', medio: 'Medium', alta: 'High', critica: 'Critical' },
    es: { pending: 'Pendiente', prepared: 'Preparada', approved: 'Aprobada', executing: 'Ejecutando', executed: 'Ejecutada', failed: 'Falló', cancelled: 'Cancelada', completed: 'Completado', rejected: 'Rechazada', confirmed: 'Confirmada', unverified: 'No confirmada', not_found: 'No encontrada', baixa: 'Baja', medio: 'Media', alta: 'Alta', critica: 'Crítica' },
  };
  return maps[locale]?.[value] || value.replace(/_/g, ' ');
}

function dotPriorityLabel(value: string, locale = 'pt'): string {
  return dotStatusLabel(value, locale).replace(/^./, (char) => char.toUpperCase());
}

function localizedSuggestions(locale: string): string[] {
  if (locale === 'en') return [
    'How is my reputation today?',
    'Find the main problem in the reviews.',
    'What should I solve first?',
    'Prepare a plan to improve my rating.',
  ];
  if (locale === 'es') return [
    '¿Cómo está mi reputación hoy?',
    'Encuentra el principal problema en las reseñas.',
    '¿Qué debería resolver primero?',
    'Prepara un plan para mejorar mi puntuación.',
  ];
  return [
    'Como está minha reputação hoje?',
    'Encontre o principal problema nas avaliações.',
    'O que eu deveria resolver primeiro?',
    'Prepare um plano para melhorar minha nota.',
  ];
}

type Message = { role: 'dot' | 'user'; text: string };
type Briefing = { headline: string; trend?: string; rating?: string; reviews?: number; priority?: string; reason?: string; suggestedAction: string };
type DotEvent = { id: number; type: string; severity: string; title: string; details: string; created_at: string };
type DotOption = { id: 'opcao_1' | 'opcao_2'; title: string; description: string; action: string; risk: string };
type DotDecision = { id: number; priority: string; severity: string; reason: string; recommendation: string; requiresApproval: boolean; status: string; options: DotOption[] };
type DotAction = { id: number; decision_id: number; option_id: string; action: string; status: string; approved_at?: string | null; executed_at?: string | null; error?: string | null };
type DotSchedulerStatus = { running: boolean; timer_active: boolean; tick_ms: number; last_run_at: string | null; last_success_at: string | null; last_error_at: string | null; last_error: string | null; duration_ms: number | null; companies_processed: number; companies_skipped: number; companies_errors: number; followups_processed: number; events_created: number; decisions_created: number; actions_prepared: number };
type DotTokenBudget = { used: number; limit: number; percent: number; warning: boolean; exhausted: boolean; remaining: number };
type DotStatus = { access: boolean; enabled: boolean; demo: boolean; feature_enabled?: boolean; plan?: string; plan_label?: string; scheduler?: DotSchedulerStatus; token_budget?: DotTokenBudget; token_warning_threshold?: number };
type DotFollowUp = { id: number; decision_id: number; action_id: number; status: 'pending' | 'completed' | 'cancelled'; due_at: string; outcome?: string | null; result_json?: string | null; created_at: string; completed_at?: string | null };
type DotResolve = {
  problem_summary: string;
  verification_status: 'confirmed' | 'unverified' | 'not_found';
  confidence: 'alta' | 'media' | 'baixa';
  facts: { source: string; fact: string }[];
  evidence: { id: string; rating: number; comment: string; createdAt?: string }[];
  options: DotOption[];
  requires_owner_decision: boolean;
  decision_id?: number;
};

function DotAvatar({ active = false }: { active?: boolean }) {
  return (
    <div
      className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] border border-indigo-300/20 bg-gradient-to-br from-indigo-500/[0.14] via-violet-500/[0.08] to-transparent shadow-[0_10px_32px_rgba(49,46,129,.22)] ${active ? 'ring-2 ring-indigo-300/20' : ''}`}
      aria-label="Filtra Dot"
      role="img"
    >
      <div className="absolute inset-1 rounded-[1.1rem] border border-white/10" />
      <div className="relative mt-1 h-9 w-8">
        <div className="absolute left-1/2 top-0 h-7 w-8 -translate-x-1/2 rounded-[48%] border border-white/15 bg-gradient-to-br from-indigo-200 via-indigo-400 to-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_6px_14px_rgba(79,70,229,.28)]">
          <div className="absolute -top-1 left-1/2 h-3.5 w-7 -translate-x-1/2 rounded-t-full bg-violet-950/80" />
          <div className="absolute left-[7px] top-[12px] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,.7)]" />
          <div className="absolute right-[7px] top-[12px] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,.7)]" />
          <div className="absolute left-1/2 top-[18px] h-1.5 w-3 -translate-x-1/2 rounded-b-full border-b border-white/75" />
        </div>
        <div className="absolute left-1/2 top-[25px] h-4 w-9 -translate-x-1/2 rounded-t-[1rem] border border-white/10 bg-gradient-to-r from-violet-700 to-indigo-500">
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/20 bg-indigo-300/30" />
        </div>
      </div>
      {active && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.8)]" />}
    </div>
  );
}

function inlineMarkdown(value: string): ReactNode[] {
  return value.split(/(\\*\\*[^*]+\\*\\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function DotRichText({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  const isBullet = (value: string) => /^\s*[-*]\s+/.test(value);
  const isNumbered = (value: string) => /^\s*\d+[.)]\s+/.test(value);
  const isHeading = (value: string) => /^\s*#{1,3}\s+/.test(value);
  const isTableRow = (value: string) => value.includes("|");

  while (i < lines.length) {
    const line = (lines[i] || "").trimEnd();
    if (!line.trim()) { i += 1; continue; }

    if (isTableRow(line) && isTableRow(lines[i + 1] || "") && /---+/.test(lines[i + 1] || "")) {
      const rows: string[][] = [];
      const parseRow = (value: string) => value.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
      rows.push(parseRow(line));
      i += 2;
      while (i < lines.length && isTableRow(lines[i] || "") && (lines[i] || "").trim()) {
        rows.push(parseRow(lines[i] || ""));
        i += 1;
      }
      blocks.push(
        <div key={blocks.length} className="my-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-zinc-300"><tr>{rows[0].map((cell, idx) => <th key={idx} className="px-3 py-2 font-semibold">{inlineMarkdown(cell)}</th>)}</tr></thead>
            <tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/5 align-top">{rows[0].map((_, colIndex) => <td key={colIndex} className="px-3 py-2 leading-5 text-zinc-400">{inlineMarkdown(row[colIndex] || "")}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isHeading(line)) {
      const content = line.replace(/^\s*#{1,3}\s+/, '');
      blocks.push(<div key={blocks.length} className="mt-4 text-sm font-semibold text-white">{inlineMarkdown(content)}</div>);
      i += 1;
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i] || "")) {
        items.push((lines[i] || '').replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(<ul key={blocks.length} className="my-3 space-y-1.5 pl-5 text-zinc-300">{items.map((item, idx) => <li key={idx} className="list-disc leading-6">{inlineMarkdown(item)}</li>)}</ul>);
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];
      while (i < lines.length && isNumbered(lines[i] || "")) {
        items.push((lines[i] || '').replace(/^\s*\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(<ol key={blocks.length} className="my-3 space-y-1.5 pl-5 text-zinc-300">{items.map((item, idx) => <li key={idx} className="list-decimal leading-6">{inlineMarkdown(item)}</li>)}</ol>);
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && (lines[i] || "").trim() && !isBullet(lines[i] || "") && !isNumbered(lines[i] || "") && !isHeading(lines[i] || "") && !isTableRow(lines[i] || "")) {
      paragraph.push((lines[i] || '').trim());
      i += 1;
    }
    blocks.push(<p key={blocks.length} className="my-2 leading-7 text-zinc-200">{inlineMarkdown(paragraph.join(" "))}</p>);
  }

  return <div>{blocks}</div>;
}

function initialMessage(company = 'sua empresa', locale = detectDotLocale()): Message {
  if (locale === 'en') {
    return { role: 'dot', text: `Hello. I’m Filtra Dot. I’m monitoring the reputation of ${company}. Ask me what changed, what matters most, or what you should do next. I’ll explain the evidence and prepare the next step when appropriate.` };
  }
  if (locale === 'es') {
    return { role: 'dot', text: `Hola. Soy Filtra Dot. Estoy siguiendo la reputación de ${company}. Pregúntame qué cambió, qué importa más o qué deberías hacer ahora. Te explicaré la evidencia y prepararé el siguiente paso cuando corresponda.` };
  }
  return { role: 'dot', text: `Olá. Eu sou o Filtra Dot e estou acompanhando a reputação de ${company}. Pergunte o que mudou, o que merece atenção ou o que fazer agora. Eu explico a evidência e preparo o próximo passo quando fizer sentido.` };
}

type DotPanelId = 'overview' | 'alerts' | 'decisions' | 'actions' | 'followups' | 'resolve' | 'capabilities' | 'suggestions' | 'control';

function DotAccordion({
  id,
  title,
  meta,
  open,
  onToggle,
  icon,
  children,
}: {
  id: DotPanelId;
  title: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={`dot-${id}`}
      className={`scroll-mt-5 overflow-hidden rounded-[22px] border transition-all ${
        open
          ? 'border-indigo-400/20 bg-gradient-to-b from-white/[0.045] to-white/[0.015] shadow-[0_18px_45px_rgba(0,0,0,0.18)]'
          : 'border-white/[0.07] bg-white/[0.018] hover:border-white/10 hover:bg-white/[0.025]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`dot-${id}-content`}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025] sm:px-5"
      >
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${open ? 'border-indigo-400/15 bg-indigo-500/10 text-indigo-200' : 'border-white/5 bg-white/[0.04] text-zinc-400'}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold tracking-[-0.01em] text-zinc-200">{title}</span>
          {meta && <span className="mt-1 block text-[10px] text-zinc-500">{meta}</span>}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-zinc-600 transition-transform ${open ? 'rotate-180 text-indigo-300' : ''}`} />
      </button>
      {open && (
        <div id={`dot-${id}-content`} className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      )}
    </section>
  );
}

export default function FiltraDotPage() {
  const [languagePreference, setLanguagePreference] = useState<'auto' | 'pt' | 'en' | 'es'>('auto');
  const [responseMode, setResponseMode] = useState<'objetivo' | 'didatico'>('objetivo');
  const [uiLocale, setUiLocale] = useState('pt');
  const ui = dotUi(uiLocale);
  const extra = dotExtra(uiLocale);
  const [suggestions, setSuggestions] = useState<string[]>(() => localizedSuggestions('pt'));
  const [messages, setMessages] = useState<Message[]>([initialMessage('sua empresa', 'pt')]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return 'local-demo';
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
  });
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [events, setEvents] = useState<DotEvent[]>([]);
  const [decisions, setDecisions] = useState<DotDecision[]>([]);
  const [actions, setActions] = useState<DotAction[]>([]);
  const [followUps, setFollowUps] = useState<DotFollowUp[]>([]);
  const [scheduler, setScheduler] = useState<DotSchedulerStatus | null>(null);
  const [dotStatus, setDotStatus] = useState<DotStatus | null>(null);
  const [resolveInput, setResolveInput] = useState('');
  const [resolveBusy, setResolveBusy] = useState(false);
  const [resolveResult, setResolveResult] = useState<DotResolve | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [explainingMessage, setExplainingMessage] = useState<number | null>(null);
  const [openPanel, setOpenPanel] = useState<DotPanelId>('overview');
  const panelTouchedRef = useRef(false);

  const togglePanel = (panel: DotPanelId) => {
    panelTouchedRef.current = true;
    setOpenPanel((current) => current === panel ? 'overview' : panel);
  };

  useEffect(() => {
    if (panelTouchedRef.current) return;
    if (proposal || actions.some((action) => ['prepared', 'approved', 'executing'].includes(action.status))) {
      setOpenPanel('actions');
    } else if (decisions.some((decision) => decision.status === 'pending')) {
      setOpenPanel('decisions');
    } else if (events.length > 0) {
      setOpenPanel('alerts');
    } else if (followUps.some((followUp) => followUp.status === 'pending')) {
      setOpenPanel('followups');
    } else {
      setOpenPanel('overview');
    }
  }, [proposal, actions, decisions, events.length, followUps]);

  const focusPanel = (panel: DotPanelId) => {
    panelTouchedRef.current = true;
    setOpenPanel(panel);
    window.requestAnimationFrame(() => {
      document.getElementById(`dot-${panel}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  useEffect(() => {
    let preference: 'auto' | 'pt' | 'en' | 'es' = 'auto';
    try {
      const stored = window.localStorage.getItem(DOT_LOCALE_KEY);
      if (stored === 'pt' || stored === 'en' || stored === 'es' || stored === 'auto') preference = stored;
      const storedMode = window.localStorage.getItem(DOT_MODE_KEY);
      if (storedMode === 'objetivo' || storedMode === 'didatico') setResponseMode(storedMode);
    } catch {}
    const locale = preference === 'auto' ? detectDotLocale() : preference;
    setLanguagePreference(preference);
    setUiLocale(locale);
    const nextUi = dotUi(locale);
    setSuggestions(localizedSuggestions(locale));
    setMessages((current) =>
      current.length === 1 && current[0].role === 'dot'
        ? [initialMessage(nextUi.companyPlaceholder, locale)]
        : current
    );
  }, []);

  function changeLanguage(next: 'auto' | 'pt' | 'en' | 'es') {
    const locale = next === 'auto' ? detectDotLocale() : next;
    setLanguagePreference(next);
    setUiLocale(locale);
    const nextUi = dotUi(locale);
    setSuggestions(localizedSuggestions(locale));
    setMessages((current) =>
      current.length === 1 && current[0].role === 'dot'
        ? [initialMessage(nextUi.companyPlaceholder, locale)]
        : current
    );
    try {
      window.localStorage.setItem(DOT_LOCALE_KEY, next);
    } catch {}
  }

  function changeResponseMode(next: 'objetivo' | 'didatico') {
    setResponseMode(next);
    try { window.localStorage.setItem(DOT_MODE_KEY, next); } catch {}
  }

  useEffect(() => {
    let disposed = false;
    const refreshOperationalState = async () => {
      const headers = authHeaders(false);
      const statusResponse = await apiFetch('/api/dot/status', { headers });
      if (disposed) return;
      const status = statusResponse.ok ? await statusResponse.json() : null;
      if (!status) return;

      setDotStatus({
        access: Boolean(status.access),
        enabled: Boolean(status.enabled),
        demo: Boolean(status.demo),
        feature_enabled: typeof status.feature_enabled === 'boolean' ? status.feature_enabled : undefined,
        plan: status.plan,
        plan_label: status.plan_label,
        scheduler: status.scheduler,
        token_budget: status.token_budget ? {
          used: Number(status.token_budget.used || 0),
          limit: Number(status.token_budget.limit || 0),
          percent: Number(status.token_budget.percent || 0),
          warning: Boolean(status.token_budget.warning),
          exhausted: Boolean(status.token_budget.exhausted),
          remaining: Number(status.token_budget.remaining || 0),
        } : undefined,
        token_warning_threshold: Number(status.token_warning_threshold || 0.8),
      });
      if (status?.scheduler) setScheduler(status.scheduler);

      if (status.demo) {
        try {
          const monitorResponse = await apiFetch('/api/dot/monitor/run', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({}),
          });
          if (monitorResponse.ok) {
            const monitorData = await monitorResponse.json();
            const result = monitorData?.result;
            if (result?.events) {
              setEvents(result.events.map((event: any, index: number) => ({
                ...event,
                id: Number(event.id ?? index + 1),
                created_at: event.created_at || new Date().toISOString(),
              })));
            }
            if (result?.decisions) {
              setDecisions(result.decisions.map((decision: any) => ({
                ...decision,
                id: Number(decision.id),
                options: decision.options || [],
              })));
            }
          }
        } catch {}
        return;
      }

      if (!status.access) return;
      const [eventsResponse, decisionsResponse, actionsResponse, followupsResponse] = await Promise.all([
        apiFetch('/api/dot/events', { headers }),
        apiFetch('/api/dot/decisions', { headers }),
        apiFetch('/api/dot/actions', { headers }),
        apiFetch('/api/dot/followups', { headers }),
      ]);
      if (disposed) return;
      const [eventsData, decisionsData, actionsData, followupsData] = await Promise.all([
        eventsResponse.ok ? eventsResponse.json() : null,
        decisionsResponse.ok ? decisionsResponse.json() : null,
        actionsResponse.ok ? actionsResponse.json() : null,
        followupsResponse.ok ? followupsResponse.json() : null,
      ]);
      if (eventsData?.events) setEvents(eventsData.events);
      if (decisionsData?.decisions) setDecisions(decisionsData.decisions);
      if (actionsData?.actions) setActions(actionsData.actions);
      if (followupsData?.followups) setFollowUps(followupsData.followups);
    };
    void refreshOperationalState().catch(() => undefined);
    const interval = window.setInterval(() => { void refreshOperationalState().catch(() => undefined); }, 30_000);
    return () => { disposed = true; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    void apiFetch('/api/dot/briefing', { headers: authHeaders(false) }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Acesso ao Dot não liberado.');
      return data;
    }).then((data) => setBriefing(data.briefing)).catch(() => undefined);
  }, []);

  async function resolveComplaint() {
    const complaint = resolveInput.trim();
    if (!complaint || resolveBusy) return;
    setResolveBusy(true);
    try {
      const response = await apiFetch('/api/dot/resolve', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ complaint }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Não foi possível verificar o relato.');
      setResolveResult(data.result);
      setResolveInput('');
      if (data.result?.decision_id) {
        const d = await apiFetch('/api/dot/decisions', { headers: authHeaders(false) }).then(r => r.ok ? r.json() : null);
        if (d?.decisions) setDecisions(d.decisions);
      }
    } catch (error: any) {
      setResolveResult({
        problem_summary: complaint,
        verification_status: 'unverified',
        confidence: 'baixa',
        facts: [{ source: 'Filtra Dot', fact: error?.message || 'Falha na verificação.' }],
        evidence: [],
        options: [
          { id: 'opcao_1', title: 'Investigar e acompanhar', description: 'Verificar os fatos antes de agir.', action: 'corrigir_e_acompanhar', risk: 'medio' },
          { id: 'opcao_2', title: 'Escalar para responsável', description: 'Deixar a decisão com o responsável da empresa.', action: 'escalar_responsavel', risk: 'baixo' },
        ],
        requires_owner_decision: true,
      });
    } finally {
      setResolveBusy(false);
    }
  }

  async function prepareOption(decisionId: number, optionId: string) {
    try {
      const response = await apiFetch('/api/dot/decisions/' + decisionId + '/prepare-action', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ optionId }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) {
        setActions(current => {
          const exists = current.some(action => action.id === Number(data.action.id));
          return exists
            ? current.map(action => action.id === Number(data.action.id) ? { ...action, ...data.action } : action)
            : [data.action, ...current];
        });
      }
      setDecisions(current => current.map(d => d.id === decisionId ? { ...d, status: 'prepared' } : d));
    } catch {}
  }

  async function approveAction(actionId: number) {
    try {
      const response = await apiFetch('/api/dot/actions/' + actionId + '/approve', { method: 'POST', headers: authHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) {
        setActions(current => current.map(a => a.id === actionId ? { ...a, status: 'approved', approved_at: data.action.approvedAt || data.action.approved_at } : a));
        if (data.action.decisionId) {
          setDecisions(current => current.map(d => d.id === Number(data.action.decisionId) ? { ...d, status: 'approved' } : d));
        }
      }
    } catch {}
  }

  async function runAction(actionId: number) {
    try {
      const response = await apiFetch('/api/dot/actions/' + actionId + '/run', { method: 'POST', headers: authHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) setActions(current => current.map(a => a.id === actionId ? { ...a, status: data.action.status, executed_at: data.action.executedAt } : a));
      if (data?.action?.status === 'executed') {
        const follow = await apiFetch('/api/dot/followups', { headers: authHeaders(false) }).then(r => r.ok ? r.json() : null);
        if (follow?.followups) setFollowUps(follow.followups);
      }
    } catch {}
  }

  async function updateDecision(id: number, action: 'prepare' | 'approve' | 'reject') {
    try {
      const url = '/api/dot/decisions/' + id + '/' + action;
      const response = await apiFetch(url, { method: 'POST', headers: authHeaders() });
      if (!response.ok) return;
      setDecisions(current => current.map(d => d.id === id ? { ...d, status: action === 'prepare' ? 'prepared' : action === 'approve' ? 'approved' : 'rejected' } : d));
    } catch {}
  }

  async function prepareAction() {
    try {
      const response = await apiFetch('/api/dot/action/prepare', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: briefing?.priority || 'tempo de espera' }),
      });
      const data = await response.json();
      if (response.ok) setProposal(data.proposal);
    } catch {
      // A proposta é opcional no protótipo local.
    }
  }
  async function copyResponse(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(index);
      window.setTimeout(() => setCopiedMessage(current => current === index ? null : current), 1600);
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  }

  async function resetConversation() {
    try {
      await apiFetch(`/api/dot/session/${sessionId}`, { method: 'DELETE', headers: authHeaders(false) });
    } catch {
      // O reset visual continua disponível mesmo se a API local estiver parada.
    }
    setMessages([initialMessage(ui.companyPlaceholder, uiLocale)]);
    setInput('');
  }

  const featureEnabled = dotStatus?.feature_enabled ?? dotStatus?.enabled ?? false;
  if (dotStatus && !dotStatus.access) {
    return (
      <main className="min-h-screen bg-[#050507] text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
          <section className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <DotAvatar />
              <div>
                <div className="text-sm font-semibold text-white">Filtra Dot</div>
                <div className="text-xs text-zinc-500">{ui.earlyAccess}</div>
              </div>
            </div>
            <div className="mt-8 text-2xl font-semibold tracking-tight text-white">
              {featureEnabled ? ui.earlyAccessTitle : ui.unavailableTitle}
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {featureEnabled
                ? ui.earlyAccessBody
                : ui.unavailableBody}
            </p>
            <div className="mt-6 rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.05] p-4 text-xs leading-5 text-zinc-400">
              {ui.plan}: <span className="font-medium text-zinc-200">{dotStatus.plan_label || dotStatus.plan || ui.unknownPlan}</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  async function explainResponse(index: number, responseText: string) {
    if (explainingMessage === index || explanations[index]) return;
    setExplainingMessage(index);
    try {
      const response = await apiFetch('/api/dot/explain', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ response_text: responseText, session_id: sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || ui.explanationUnavailable);
      setExplanations((current) => ({ ...current, [index]: data.explanation }));
    } catch {
      setExplanations((current) => ({ ...current, [index]: ui.explanationUnavailable }));
    } finally {
      setExplainingMessage(null);
    }
  }

  async function send(message = input) {
    const text = message.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setBusy(true);

    try {
      const response = await apiFetch(`/api/dot/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text, session_id: sessionId, response_mode: responseMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao falar com o Dot.');
      if (typeof data.dot_token_limit === 'number') {
        const used = Number(data.dot_tokens_used || 0);
        const limit = Number(data.dot_token_limit || 0);
        setDotStatus((current) => current ? {
          ...current,
          token_budget: {
            used,
            limit,
            percent: limit > 0 ? used / limit : 0,
            warning: Boolean(data.token_warning),
            exhausted: limit > 0 && used >= limit,
            remaining: Math.max(0, limit - used),
          },
        } : current);
      }
      setMessages((current) => [...current, { role: 'dot', text: data.message }]);
    } catch (error: any) {
      setMessages((current) => [...current, {
        role: 'dot',
        text: `Não consegui responder agora. ${error?.message || 'Verifique se a API local está rodando.'}`,
      }]);
    } finally {
      setBusy(false);
    }
  }

  const dynamicPrompts = (() => {
    const prompts: Array<{ label: string; message: string; tone?: 'priority' | 'neutral' }> = [];
    if (events.length > 0) prompts.push({
      label: ui.investigateTitle,
      message: uiLocale === 'pt' ? 'Investigue os sinais prioritários e mostre as evidências.' : uiLocale === 'es' ? 'Investiga las señales prioritarias y muestra las evidencias.' : 'Investigate the priority signals and show the evidence.',
      tone: 'priority',
    });
    if (decisions.length > 0 || proposal) prompts.push({
      label: ui.decisionLabel,
      message: uiLocale === 'pt' ? 'Qual decisão devo priorizar agora?' : uiLocale === 'es' ? '¿Qué decisión debería priorizar ahora?' : 'Which decision should I prioritize now?',
    });
    if (actions.length > 0 || proposal) prompts.push({
      label: ui.prepareAction,
      message: uiLocale === 'pt' ? 'Prepare o próximo passo com base nas evidências.' : uiLocale === 'es' ? 'Prepara el siguiente paso según las evidencias.' : 'Prepare the next step based on the evidence.',
    });
    prompts.push({
      label: ui.analyze,
      message: uiLocale === 'pt' ? 'Resuma o que mudou e o que merece atenção primeiro.' : uiLocale === 'es' ? 'Resume qué cambió y qué merece atención primero.' : 'Summarize what changed and what deserves attention first.',
    });
    return prompts.slice(0, 4);
  })();

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <DotAvatar />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span className="text-[15px] tracking-[-0.01em]">Filtra Dot</span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">{extra.plansBadge}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {dotStatus?.demo ? <FlaskConical size={10} /> : <Wifi size={10} />}
                  {dotStatus?.demo ? ui.demo : ui.online}
                </span>
              </div>
              <div className="text-xs text-zinc-500">{extra.agentSubtitle} · decisões com supervisão humana</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(() => {
                  const hasPendingAction = Boolean(proposal) || actions.some((action) => ['prepared', 'approved', 'executing'].includes(action.status));
                  const hasPendingDecision = decisions.some((decision) => decision.status === 'pending');
                  if (hasPendingAction) return <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-200">{ui.pendingAction}</span>;
                  if (hasPendingDecision) return <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">{ui.pendingDecision}</span>;
                  if (events.length > 0) return <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">{events.length} {ui.signalsContext}</span>;
                  return <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-200">{ui.calmContext}</span>;
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dotStatus?.token_budget && dotStatus.token_budget.limit > 0 && (
              <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-[10px] sm:flex ${dotStatus.token_budget.warning ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200' : 'border-white/[0.08] bg-white/[0.02] text-zinc-400'}`}>
                <span>Uso</span>
                <span className="font-semibold">{Math.round(dotStatus.token_budget.percent * 100)}%</span>
                <span className="text-zinc-600">·</span>
                <span>{dotStatus.token_budget.remaining.toLocaleString('pt-BR')} restantes</span>
              </div>
            )}
            <label className="relative inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-zinc-400 transition hover:border-indigo-400/30 hover:text-zinc-200">
              <span className="sr-only">{ui.languageLabel}</span>
              <span className="mr-2 text-[10px] uppercase tracking-[.12em] text-zinc-600">{ui.languageLabel}</span>
              <select
                value={languagePreference}
                onChange={(event) => changeLanguage(event.target.value as 'auto' | 'pt' | 'en' | 'es')}
                aria-label={ui.languageLabel}
                title={ui.languageLabel}
                className="cursor-pointer appearance-none bg-transparent pr-4 text-xs text-zinc-300 outline-none"
              >
                <option value="auto">{ui.languageAuto}</option>
                <option value="pt">{ui.languagePt}</option>
                <option value="en">{ui.languageEn}</option>
                <option value="es">{ui.languageEs}</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2.5 text-zinc-600" />
            </label>
            <label className="relative inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-zinc-400 transition hover:border-indigo-400/30 hover:text-zinc-200">
              <span className="sr-only">{ui.responseModeLabel}</span>
              <span className="mr-2 text-[10px] uppercase tracking-[.12em] text-zinc-600">{ui.responseModeLabel}</span>
              <select
                value={responseMode}
                onChange={(event) => changeResponseMode(event.target.value as 'objetivo' | 'didatico')}
                aria-label={ui.responseModeLabel}
                title={responseMode === 'didatico' ? ui.modeDidacticHint : ui.modeObjectiveHint}
                className="cursor-pointer appearance-none bg-transparent pr-4 text-xs text-zinc-300 outline-none"
              >
                <option value="objetivo">{ui.modeObjective}</option>
                <option value="didatico">{ui.modeDidactic}</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2.5 text-zinc-600" />
            </label>
            <button type="button" onClick={() => void resetConversation()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-indigo-400/30 hover:text-zinc-200 disabled:opacity-40">
              <RotateCcw size={13} /> {ui.newConversation}
            </button>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.03] px-3 py-1.5 text-[11px] text-zinc-500 xl:flex">
            <ShieldCheck size={14} className="text-emerald-400" /> {ui.protectedActions}
          </div>
        </header>

        {dotStatus?.token_budget?.warning && !dotStatus.token_budget.exhausted && (
          <div className="mb-1 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 shadow-[0_12px_35px_rgba(245,158,11,.08)] lg:col-span-2">
            <div className="flex items-start gap-3">
              <CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-300" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-200">Atenção: uso de inteligência do Dot em {Math.round(dotStatus.token_budget.percent * 100)}%</div>
                <div className="mt-1 text-[11px] leading-5 text-amber-100/70">
                  Seu plano {dotStatus.plan_label || dotStatus.plan || ''} já utilizou {dotStatus.token_budget.used.toLocaleString('pt-BR')} de {dotStatus.token_budget.limit.toLocaleString('pt-BR')} tokens neste mês. O Dot continuará disponível, mas novas respostas de IA serão bloqueadas automaticamente ao atingir 100%.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">{ui.currentTitle}</span>
          {briefing?.priority && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-3 py-1.5 text-[10px] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> {briefing.priority}
            </span>
          )}
          {events.length > 0 && (
            <button type="button" onClick={() => void send(dynamicPrompts[0]?.message || ui.investigateTitle)} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-1.5 text-[10px] font-medium text-indigo-200 transition hover:border-indigo-300/40 hover:bg-indigo-500/[0.12] disabled:opacity-40">
              {ui.investigateTitle} <ChevronRight size={11} />
            </button>
          )}
          {dynamicPrompts.filter((item) => item.label !== ui.investigateTitle).map((item) => (
            <button key={item.label} type="button" onClick={() => void send(item.message)} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-40">
              {item.label} <ChevronRight size={11} className="text-zinc-600" />
            </button>
          ))}
          <span className="ml-auto hidden text-[10px] text-zinc-600 lg:block">
            {busy ? ui.analyzing : ui.responseLimit}
          </span>
        </div>

        <div className="grid flex-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
          <section className="order-2 flex min-h-[760px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-indigo-950/20">
            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-7">
              <div className="mx-auto max-w-4xl">
                <div className="mb-7 flex items-start gap-3 sm:gap-4">
                  <DotAvatar active={busy} />
                  <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-indigo-300/15 bg-gradient-to-br from-indigo-500/[0.08] to-white/[0.02] p-4 text-sm leading-7 text-zinc-200 shadow-[0_12px_40px_rgba(30,27,75,.16)]">
                    {messages[0].text}
                  </div>
                </div>

                <div className="space-y-4">
                  {messages.slice(1).map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}>
                      {message.role === 'dot' && <DotAvatar active={busy && index === messages.length - 2} />}
                      <div className={`group ${message.role === 'user' ? 'max-w-[85%]' : 'max-w-[92%]'}`}>
                        <div className={message.role === 'user'
                          ? 'rounded-2xl rounded-br-sm bg-indigo-500 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-indigo-950/20'
                          : 'rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-zinc-200 shadow-lg shadow-black/10'}>
                          {message.role === 'user' ? message.text : <DotRichText text={message.text} />}
                        </div>
                        {message.role === 'dot' && (
                          <>
                            <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => void copyResponse(message.text, index)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                              aria-label={copiedMessage === index ? ui.copiedResponse : ui.copyResponse}
                              title={copiedMessage === index ? ui.copiedResponse : ui.copyResponse}
                            >
                              {copiedMessage === index ? <ClipboardCheck size={11} /> : <Clipboard size={11} />}
                              {copiedMessage === index ? ui.copiedResponse : ui.copyResponse}
                            </button>
                            <button
                              type="button"
                              onClick={() => void explainResponse(index, message.text)}
                              disabled={explainingMessage === index}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-50"
                            >
                              <CircleAlert size={11} />
                              {explainingMessage === index ? ui.explainingResponse : ui.whyThisResponse}
                            </button>
                            </div>
                          {explanations[index] && (
                            <div className="mt-2 rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.04] p-3 text-xs leading-6 text-zinc-300">
                              <DotRichText text={explanations[index]} />
                            </div>
                          )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="flex items-center gap-3">
                      <DotAvatar active />
                      <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/[0.04] px-4 py-3 text-xs text-zinc-500">{ui.analyzing}</div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/30 p-4 sm:p-5">
              <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-2 focus-within:border-indigo-400/40">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
                  placeholder={ui.ask}
                  rows={1}
                  className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!input.trim() || busy}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={extra.sendMessage}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              {dotStatus?.token_budget && dotStatus.token_budget.limit > 0 && (
                <div className="mx-auto mb-2 flex max-w-4xl items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] text-zinc-500">
                  <span>Uso do Dot neste mês</span>
                  <span className={dotStatus.token_budget.warning ? 'font-semibold text-amber-300' : 'text-zinc-400'}>
                    {Math.round(dotStatus.token_budget.percent * 100)}% · {dotStatus.token_budget.remaining.toLocaleString('pt-BR')} tokens restantes
                  </span>
                </div>
              )}

              <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between gap-3 text-[10px] text-zinc-600">
                <span>{dotStatus?.demo ? ui.localDemo : ui.protectedActions}</span>
                <span className="hidden text-right sm:block">{responseMode === 'didatico' ? ui.modeDidacticHint : ui.modeObjectiveHint}</span>
              </div>
            </div>
          </section>

          <aside className="order-1 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:pr-1">
            <div className="rounded-[24px] border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.10] via-white/[0.025] to-black/20 p-5 shadow-[0_18px_50px_rgba(49,46,129,0.12)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-300">{ui.currentTitle}</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight text-white">{briefing?.headline || briefing?.priority || ui.monitoringActive}</div>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{briefing?.reason || ui.currentBody}</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[9px] font-medium text-emerald-300">{ui.online}</span>
              </div>
              <div className="mt-3 text-[10px] text-zinc-500">
                {events.length > 0 ? <>Evidências: <span className="text-zinc-300">{events.length}</span> · </> : null}
                {decisions.length > 0 ? <><span className="text-zinc-300">{decisions.length}</span> {ui.pendingDecision.toLowerCase()}</> : ui.calmContext}
              </div>
              <button type="button" onClick={() => void prepareAction()} disabled={busy || (!proposal && decisions.length === 0 && actions.length === 0)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
                <Zap size={14} /> {briefing?.suggestedAction || ui.prepareAction}
              </button>
              {briefing?.suggestedAction && <button type="button" onClick={() => focusPanel('alerts')} className="mt-2 w-full rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] text-zinc-400 transition hover:border-white/15 hover:text-zinc-200">{ui.alertsTitle}</button>}
            </div>

            <div className="border-b border-white/[0.08] py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">{ui.workflowTitle}</div>
                <span className="text-[9px] text-zinc-600">● {ui.currentTitle}</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  [ui.signalsLabel, events.length > 0, 'alerts'],
                  [ui.investigateTitle, Boolean(resolveResult), 'resolve'],
                  [ui.decisionLabel, decisions.length > 0, 'decisions'],
                  [ui.prepare, Boolean(proposal || actions.length), 'actions'],
                  [ui.approveAction, actions.some((a) => ['approved','executing','executed'].includes(a.status)), 'actions'],
                  [ui.resultLabel, followUps.some((f) => f.status !== 'pending'), 'followups'],
                ].map(([label, active, panel], index) => (
                  <button key={String(label)} type="button" onClick={() => focusPanel(panel as DotPanelId)} title={String(label)} className="group relative flex min-w-0 flex-1 flex-col items-center">
                    <span className={`h-2.5 w-2.5 rounded-full border ${active ? 'border-indigo-300 bg-indigo-400' : 'border-zinc-700 bg-zinc-900'}`} />
                    {index < 5 && <span className="absolute left-1/2 top-1.5 h-px w-full translate-x-1 bg-white/[0.08]" />}
                    <span className={`mt-2 w-full truncate text-center text-[8px] ${active ? 'text-indigo-200' : 'text-zinc-600'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-white/[0.08] py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">Fila</div>
                <span className="text-[9px] text-zinc-600">{decisions.length + actions.length + followUps.length} itens</span>
              </div>
              <div className="space-y-2">
                {decisions.slice(0, 2).map((decision) => (
                  <div key={`decision-${decision.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    <div className="min-w-0"><div className="text-[10px] font-medium text-zinc-200 truncate">{ui.decisionLabel} · {decision.recommendation}</div><div className="mt-0.5 text-[9px] text-zinc-600">{dotStatusLabel(decision.status, uiLocale)}</div></div>
                    <button type="button" onClick={() => focusPanel('decisions')} className="shrink-0 text-[9px] font-semibold text-indigo-300 hover:text-indigo-200">{decision.requiresApproval ? ui.prepare : 'Abrir'}</button>
                  </div>
                ))}
                {actions.slice(0, 2).map((action) => (
                  <div key={`action-${action.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    <div className="min-w-0"><div className="text-[10px] font-medium text-zinc-200 truncate">{ui.actionsTitle} · {action.action}</div><div className="mt-0.5 text-[9px] text-zinc-600">{dotStatusLabel(action.status, uiLocale)}</div></div>
                    <button type="button" onClick={() => focusPanel('actions')} className="shrink-0 text-[9px] font-semibold text-indigo-300 hover:text-indigo-200">{action.status === 'prepared' ? ui.approveAction : 'Abrir'}</button>
                  </div>
                ))}
                {followUps.slice(0, 1).map((followUp) => (
                  <div key={`followup-${followUp.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    <div className="min-w-0"><div className="text-[10px] font-medium text-zinc-200 truncate">{ui.followupTitle}</div><div className="mt-0.5 text-[9px] text-zinc-600">{new Date(followUp.due_at).toLocaleDateString(uiLocale === 'pt' ? 'pt-BR' : uiLocale === 'es' ? 'es-ES' : 'en-US')}</div></div>
                    <button type="button" onClick={() => focusPanel('followups')} className="shrink-0 text-[9px] font-semibold text-indigo-300 hover:text-indigo-200">Abrir</button>
                  </div>
                ))}
                {decisions.length === 0 && actions.length === 0 && followUps.length === 0 && <div className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-[10px] leading-5 text-zinc-600">{ui.calmContext}</div>}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/[0.06] bg-black/10 px-4 py-3 text-[10px] leading-5 text-zinc-600">
              {dotStatus?.demo ? ui.localDemo : ui.protectedActions}
            </div>
          </aside>        </div>
      </div>
    </main>
  );
}
