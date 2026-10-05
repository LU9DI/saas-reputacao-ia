'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/apiFailover';
import { DotCommandAside } from './DotCommandAside';
import { DotAgentSurface } from './DotAgentSurface';
import {
  ArrowUp,
  RotateCcw,
  Bot,
  Clipboard,
  ClipboardCheck,
  Wifi,
  FlaskConical,
} from 'lucide-react';

const SESSION_KEY = 'filtra-dot-local-session';
const DOT_LOCALE_KEY = 'filtra-dot-locale';
const DOT_MODE_KEY = 'filtra-dot-response-mode';

type Message = { role: 'dot' | 'user'; text: string };
type Briefing = {
  headline: string;
  trend?: string;
  rating?: string;
  reviews?: number;
  priority?: string;
  reason?: string;
  suggestedAction: string;
};
type DotEvent = {
  id: number;
  type: string;
  severity: string;
  title: string;
  details: string;
  created_at: string;
};
type DotOption = {
  id: 'opcao_1' | 'opcao_2';
  title: string;
  description: string;
  action: string;
  risk: string;
};
type DotDecision = {
  id: number;
  priority: string;
  severity: string;
  reason: string;
  recommendation: string;
  requiresApproval: boolean;
  status: string;
  options: DotOption[];
};
type DotAction = {
  id: number;
  decision_id: number;
  option_id: string;
  action: string;
  status: string;
  approved_at?: string | null;
  executed_at?: string | null;
  error?: string | null;
};
type DotFollowUp = {
  id: number;
  decision_id: number;
  action_id: number;
  status: 'pending' | 'completed' | 'cancelled';
  due_at: string;
  outcome?: string | null;
  created_at: string;
};
type DotTokenBudget = {
  used: number;
  limit: number;
  percent: number;
  warning: boolean;
  exhausted: boolean;
  remaining: number;
};
type DotStatus = {
  access: boolean;
  enabled: boolean;
  demo: boolean;
  plan?: string;
  plan_label?: string;
  token_budget?: DotTokenBudget;
};
type DotPanelId =
  | 'overview'
  | 'alerts'
  | 'decisions'
  | 'actions'
  | 'followups'
  | 'resolve'
  | 'capabilities'
  | 'suggestions'
  | 'control';

type DotUi = {
  earlyAccessTitle: string;
  earlyAccessBody: string;
  plan: string;
  newConversation: string;
  analyzing: string;
  ask: string;
  localDemo: string;
  protectedActions: string;
  online: string;
  demo: string;
  copyResponse: string;
  copiedResponse: string;
  loading: string;
  unavailableTitle: string;
  unavailableBody: string;
  unknownPlan: string;
  currentTitle: string;
  currentBody: string;
  nextStepLabel: string;
  monitoringActive: string;
  signalsContext: string;
  pendingDecision: string;
  pendingAction: string;
  calmContext: string;
  approveAction: string;
  executeLocal: string;
  prepareAction: string;
  followupTitle: string;
  followUpsLabel: string;
  workflowTitle: string;
  signalsLabel: string;
  investigateTitle: string;
  decisionLabel: string;
  resultLabel: string;
  actionsTitle: string;
  groupDecide: string;
  pending: string;
  languageLabel: string;
  languagePt: string;
  languageEn: string;
  languageEs: string;
  responseModeLabel: string;
  modeObjective: string;
  modeDidactic: string;
};

const DOT_UI: Record<string, DotUi> = {
  pt: {
    earlyAccessTitle: 'O Filtra Dot está reservado aos planos Rei e Corporativo.',
    earlyAccessBody:
      'Sua conta atual não possui acesso ao Dot. O recurso está em acesso antecipado para clientes Rei e Corporativo.',
    plan: 'Plano identificado',
    newConversation: 'Nova conversa',
    analyzing: 'Analisando sinais do negócio…',
    ask: 'Pergunte ao Filtra Dot…',
    localDemo: 'Protótipo local · dados demonstrativos · nenhuma ação externa é executada.',
    protectedActions: 'Ações internas somente após aprovação',
    online: 'Online',
    demo: 'Demo local',
    copyResponse: 'Copiar resposta',
    copiedResponse: 'Copiado',
    loading: 'Carregando estado operacional…',
    unavailableTitle: 'O Filtra Dot está temporariamente indisponível.',
    unavailableBody: 'O recurso ainda não está habilitado neste ambiente.',
    unknownPlan: 'não identificado',
    currentTitle: 'Agora',
    currentBody: 'O que merece sua atenção primeiro.',
    nextStepLabel: 'Próximo passo',
    monitoringActive: 'Monitoramento ativo',
    signalsContext: 'sinais',
    pendingDecision: 'Decisão pendente',
    pendingAction: 'Ação pendente',
    calmContext: 'Sem pendências críticas',
    approveAction: 'Aprovar ação',
    executeLocal: 'Registrar ação interna',
    prepareAction: 'Preparar plano',
    followupTitle: 'Acompanhamento',
    followUpsLabel: 'Acompanhamentos',
    workflowTitle: 'Ciclo de decisão',
    signalsLabel: 'Sinais',
    investigateTitle: 'Investigar uma reclamação',
    decisionLabel: 'Decisão',
    resultLabel: 'Resultado',
    actionsTitle: 'Ações preparadas',
    groupDecide: 'Decidir',
    pending: 'pendentes',
    languageLabel: 'Idioma',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Modo de resposta',
    modeObjective: 'Objetivo',
    modeDidactic: 'Didático',
  },
  en: {
    earlyAccessTitle: 'Filtra Dot is reserved for Rei and Corporativo plans.',
    earlyAccessBody:
      'Your account does not have Dot access. The feature is in early access for Rei and Corporativo customers.',
    plan: 'Detected plan',
    newConversation: 'New conversation',
    analyzing: 'Analyzing business signals…',
    ask: 'Ask Filtra Dot…',
    localDemo: 'Local prototype · demo data · no external action is executed.',
    protectedActions: 'Internal actions require approval',
    online: 'Online',
    demo: 'Local demo',
    copyResponse: 'Copy response',
    copiedResponse: 'Copied',
    loading: 'Loading operational state…',
    unavailableTitle: 'Filtra Dot is temporarily unavailable.',
    unavailableBody: 'The feature is not enabled in this environment.',
    unknownPlan: 'not identified',
    currentTitle: 'Now',
    currentBody: 'What deserves your attention first.',
    nextStepLabel: 'Next step',
    monitoringActive: 'Monitoring active',
    signalsContext: 'signals',
    pendingDecision: 'Pending decision',
    pendingAction: 'Pending action',
    calmContext: 'No critical pending items',
    approveAction: 'Approve action',
    executeLocal: 'Register internal action',
    prepareAction: 'Prepare plan',
    followupTitle: 'Follow-up',
    followUpsLabel: 'Follow-ups',
    workflowTitle: 'Decision cycle',
    signalsLabel: 'Signals',
    investigateTitle: 'Investigate a complaint',
    decisionLabel: 'Decision',
    resultLabel: 'Outcome',
    actionsTitle: 'Prepared actions',
    groupDecide: 'Decide',
    pending: 'pending',
    languageLabel: 'Language',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Response mode',
    modeObjective: 'Objective',
    modeDidactic: 'Didactic',
  },
  es: {
    earlyAccessTitle: 'Filtra Dot está reservado para los planes Rei y Corporativo.',
    earlyAccessBody:
      'Tu cuenta no tiene acceso a Dot. La función está en acceso anticipado para clientes Rei y Corporativo.',
    plan: 'Plan detectado',
    newConversation: 'Nueva conversación',
    analyzing: 'Analizando señales del negocio…',
    ask: 'Pregunta a Filtra Dot…',
    localDemo: 'Prototipo local · datos de demostración · no se ejecutan acciones externas.',
    protectedActions: 'Las acciones internas requieren aprobación',
    online: 'En línea',
    demo: 'Demo local',
    copyResponse: 'Copiar respuesta',
    copiedResponse: 'Copiado',
    loading: 'Cargando estado operativo…',
    unavailableTitle: 'Filtra Dot no está disponible temporalmente.',
    unavailableBody: 'La función aún no está habilitada en este entorno.',
    unknownPlan: 'no identificado',
    currentTitle: 'Ahora',
    currentBody: 'Lo que merece tu atención primero.',
    nextStepLabel: 'Siguiente paso',
    monitoringActive: 'Monitoreo activo',
    signalsContext: 'señales',
    pendingDecision: 'Decisión pendiente',
    pendingAction: 'Acción pendiente',
    calmContext: 'Sin pendientes críticas',
    approveAction: 'Aprobar acción',
    executeLocal: 'Registrar acción interna',
    prepareAction: 'Preparar plan',
    followupTitle: 'Seguimiento',
    followUpsLabel: 'Seguimientos',
    workflowTitle: 'Ciclo de decisión',
    signalsLabel: 'Señales',
    investigateTitle: 'Investigar una reclamación',
    decisionLabel: 'Decisión',
    resultLabel: 'Resultado',
    actionsTitle: 'Acciones preparadas',
    groupDecide: 'Decidir',
    pending: 'pendientes',
    languageLabel: 'Idioma',
    languagePt: 'Português',
    languageEn: 'English',
    languageEs: 'Español',
    responseModeLabel: 'Modo de respuesta',
    modeObjective: 'Objetivo',
    modeDidactic: 'Didáctico',
  },
};

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

function initialMessage(company: string, locale: string): Message {
  const map: Record<string, string> = {
    pt: `Olá. Sou o Filtra Dot. Posso analisar a reputação de ${company}, priorizar o que importa e preparar ações internas para sua aprovação.`,
    en: `Hi. I am Filtra Dot. I can analyze ${company}'s reputation, prioritize what matters, and prepare internal actions for your approval.`,
    es: `Hola. Soy Filtra Dot. Puedo analizar la reputación de ${company}, priorizar lo importante y preparar acciones internas para tu aprobación.`,
  };
  return { role: 'dot', text: map[locale] || map.pt };
}

export default function FiltraDotPage() {
  const [localePref, setLocalePref] = useState('auto');
  const [responseMode, setResponseMode] = useState('objetivo');
  const [uiLocale, setUiLocale] = useState('pt');
  const [messages, setMessages] = useState<Message[]>([initialMessage('sua empresa', 'pt')]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [dotStatus, setDotStatus] = useState<DotStatus | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [events, setEvents] = useState<DotEvent[]>([]);
  const [decisions, setDecisions] = useState<DotDecision[]>([]);
  const [actions, setActions] = useState<DotAction[]>([]);
  const [followUps, setFollowUps] = useState<DotFollowUp[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const ui = DOT_UI[uiLocale] || DOT_UI.pt;

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(DOT_LOCALE_KEY);
      const savedMode = localStorage.getItem(DOT_MODE_KEY);
      if (savedLocale) setLocalePref(savedLocale);
      if (savedMode) setResponseMode(savedMode);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const resolved =
      localePref === 'auto'
        ? typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')
          ? 'es'
          : typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')
            ? 'en'
            : 'pt'
        : localePref;
    setUiLocale(resolved);
  }, [localePref]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/dot/status', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const status = await res.json();
        if (cancelled) return;
        setDotStatus({
          access: Boolean(status.access),
          enabled: Boolean(status.enabled),
          demo: Boolean(status.demo),
          plan: status.plan,
          plan_label: status.plan_label,
          token_budget: status.token_budget
            ? {
                used: Number(status.token_budget.used || 0),
                limit: Number(status.token_budget.limit || 0),
                percent: Number(status.token_budget.percent || 0),
                warning: Boolean(status.token_budget.warning),
                exhausted: Boolean(status.token_budget.exhausted),
                remaining: Number(status.token_budget.remaining || 0),
              }
            : undefined,
        });
        if (status.access && status.enabled) {
          const [b, e, d, a, f] = await Promise.all([
            apiFetch('/api/dot/briefing', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            apiFetch('/api/dot/events', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            apiFetch('/api/dot/decisions', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            apiFetch('/api/dot/actions', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            apiFetch('/api/dot/followups', { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ]);
          if (cancelled) return;
          if (b?.briefing) setBriefing(b.briefing);
          else if (b && (b.headline || b.suggestedAction)) setBriefing(b as Briefing);
          if (Array.isArray(e?.events)) setEvents(e.events);
          else if (Array.isArray(e)) setEvents(e);
          if (Array.isArray(d?.decisions)) setDecisions(d.decisions);
          else if (Array.isArray(d)) setDecisions(d);
          if (Array.isArray(a?.actions)) setActions(a.actions);
          else if (Array.isArray(a)) setActions(a);
          if (Array.isArray(f?.followups)) setFollowUps(f.followups);
          else if (Array.isArray(f?.followUps)) setFollowUps(f.followUps);
          else if (Array.isArray(f)) setFollowUps(f);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const focusPanel = (panel: DotPanelId) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`dot-${panel}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  async function prepareAction() {
    try {
      const response = await apiFetch('/api/dot/action/prepare', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: briefing?.priority || 'tempo de espera' }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.action) {
        setActions((current) => {
          const exists = current.some((x) => x.id === data.action.id);
          return exists
            ? current.map((x) => (x.id === data.action.id ? data.action : x))
            : [data.action, ...current];
        });
      }
    } catch {
      /* ignore */
    }
  }

  async function approveAction(actionId: number) {
    try {
      const response = await apiFetch('/api/dot/actions/' + actionId + '/approve', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) {
        setActions((current) => current.map((x) => (x.id === actionId ? { ...x, ...data.action } : x)));
      }
    } catch {
      /* ignore */
    }
  }

  async function runAction(actionId: number) {
    try {
      const response = await apiFetch('/api/dot/actions/' + actionId + '/run', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) {
        setActions((current) => current.map((x) => (x.id === actionId ? { ...x, ...data.action } : x)));
      }
    } catch {
      /* ignore */
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: content }]);
    setBusy(true);
    try {
      const response = await apiFetch('/api/dot/chat', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          message: content,
          locale: uiLocale,
          response_mode: responseMode,
          session_id: typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data?.session_id && typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, data.session_id);
      }
      if (data?.token_budget && dotStatus) {
        setDotStatus({
          ...dotStatus,
          token_budget: {
            used: Number(data.token_budget.used || 0),
            limit: Number(data.token_budget.limit || 0),
            percent: Number(data.token_budget.percent || 0),
            warning: Boolean(data.token_budget.warning),
            exhausted: Boolean(data.token_budget.exhausted),
            remaining: Number(data.token_budget.remaining || 0),
          },
        });
      }
      const reply =
        data?.reply ||
        data?.message ||
        data?.error ||
        (response.status === 403
          ? ui.earlyAccessBody
          : response.ok
            ? '…'
            : `Erro ${response.status}`);
      setMessages((m) => [...m, { role: 'dot', text: String(reply) }]);
    } catch {
      setMessages((m) => [...m, { role: 'dot', text: ui.unavailableBody }]);
    } finally {
      setBusy(false);
    }
  }

  function resetConversation() {
    setMessages([initialMessage('sua empresa', uiLocale)]);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  async function copyLast() {
    const last = [...messages].reverse().find((m) => m.role === 'dot');
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-lg font-semibold">{ui.unavailableTitle}</h1>
            <p className="mt-2 text-sm text-zinc-400">{ui.unavailableBody}</p>
          </div>
        </div>
      </main>
    );
  }

  if (dotStatus && (!dotStatus.access || !dotStatus.enabled)) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-lg font-semibold">{ui.earlyAccessTitle}</h1>
            <p className="mt-2 text-sm text-zinc-400">{ui.earlyAccessBody}</p>
            <p className="mt-4 text-xs text-zinc-500">
              {ui.plan}: {dotStatus.plan_label || dotStatus.plan || ui.unknownPlan}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!dotStatus) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <p className="text-sm text-zinc-400">{ui.loading}</p>
        </div>
      </main>
    );
  }

  const budget = dotStatus.token_budget;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <Bot size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Filtra Dot</div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  {dotStatus.demo ? <FlaskConical size={11} /> : <Wifi size={11} />}
                  {dotStatus.demo ? ui.demo : ui.online}
                </span>
                <span>·</span>
                <span>{dotStatus.plan_label || dotStatus.plan || ui.unknownPlan}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={localePref}
              onChange={(e) => {
                setLocalePref(e.target.value);
                try {
                  localStorage.setItem(DOT_LOCALE_KEY, e.target.value);
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
              aria-label={ui.languageLabel}
            >
              <option value="auto">Auto</option>
              <option value="pt">{ui.languagePt}</option>
              <option value="en">{ui.languageEn}</option>
              <option value="es">{ui.languageEs}</option>
            </select>
            <select
              value={responseMode}
              onChange={(e) => {
                setResponseMode(e.target.value);
                try {
                  localStorage.setItem(DOT_MODE_KEY, e.target.value);
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
              aria-label={ui.responseModeLabel}
            >
              <option value="objetivo">{ui.modeObjective}</option>
              <option value="didatico">{ui.modeDidactic}</option>
            </select>
            <button
              type="button"
              onClick={resetConversation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.04]"
            >
              <RotateCcw size={12} />
              {ui.newConversation}
            </button>
          </div>
        </header>

        <DotAgentSurface />

        {budget && budget.limit > 0 && budget.warning && !budget.exhausted && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            Atenção: uso de inteligência do Dot em {Math.round(budget.percent * 100)}% —{' '}
            {budget.used.toLocaleString('pt-BR')} de {budget.limit.toLocaleString('pt-BR')} tokens. Bloqueio
            automático em 100%.
          </div>
        )}

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="min-h-[70vh] rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Centro operacional</div>
                <h1 className="mt-1 text-lg font-semibold text-zinc-100">O DOT trabalha para a empresa — não espera uma mensagem.</h1>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">
                  O agente monitora sinais, investiga, prioriza, prepara ações, pede aprovação quando necessário e acompanha o resultado.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] text-emerald-300">agente ativo</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-600">Sinais</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-100">{events.length}</div>
                <div className="mt-1 text-[10px] text-zinc-500">contexto observado pelo agente</div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-600">Decisões</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-100">{decisions.filter((d) => ['pending','prepared','approved'].includes(d.status)).length}</div>
                <div className="mt-1 text-[10px] text-zinc-500">itens ainda em fluxo</div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-600">Ações</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-100">{actions.filter((a) => !['executed','cancelled'].includes(a.status)).length}</div>
                <div className="mt-1 text-[10px] text-zinc-500">preparadas ou aguardando aprovação</div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-600">Acompanhamentos</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-100">{followUps.filter((f) => f.status === 'pending').length}</div>
                <div className="mt-1 text-[10px] text-zinc-500">resultados que o DOT precisa verificar</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/15 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Estado atual</div>
              <div className="mt-2 text-sm font-medium text-zinc-200">{briefing?.headline || 'O agente está observando os dados da empresa.'}</div>
              <div className="mt-2 text-xs leading-5 text-zinc-500">{briefing?.reason || 'Quando surgir um sinal relevante, o DOT cria uma missão e conduz o ciclo operacional.'}</div>
              {briefing?.suggestedAction && (
                <div className="mt-3 rounded-lg border border-sky-400/15 bg-sky-500/5 px-3 py-2 text-xs text-sky-200">
                  Próximo passo do agente: {briefing.suggestedAction}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Últimos sinais</div>
                <div className="mt-3 space-y-2">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-200">{event.title}</span>
                        <span className="text-[9px] uppercase text-zinc-600">{event.severity}</span>
                      </div>
                      <div className="mt-1 text-[10px] leading-4 text-zinc-500">{event.details}</div>
                    </div>
                  ))}
                  {events.length === 0 && <div className="text-xs text-zinc-600">Nenhum sinal crítico pendente.</div>}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Fluxo do agente</div>
                <div className="mt-3 space-y-2 text-xs">
                  {[
                    ['1', 'Observar', 'monitoramento contínuo'],
                    ['2', 'Investigar', 'evidência e causa'],
                    ['3', 'Decidir', 'prioridade e impacto'],
                    ['4', 'Agir', 'ação preparada / aprovada'],
                    ['5', 'Verificar', 'resultado e acompanhamento'],
                  ].map(([n, title, desc]) => (
                    <div key={n} className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-sky-400/20 text-[10px] text-sky-300">{n}</span>
                      <div><div className="text-zinc-300">{title}</div><div className="text-[10px] text-zinc-600">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <DotCommandAside
            ui={ui}
            uiLocale={uiLocale}
            demo={dotStatus.demo}
            busy={busy}
            events={events}
            decisions={decisions}
            actions={actions}
            followUps={followUps}
            briefing={briefing}
            focusPanel={focusPanel}
            prepareAction={prepareAction}
            approveAction={approveAction}
            runAction={runAction}
          />
        </div>
      </div>
    </main>
  );
}
