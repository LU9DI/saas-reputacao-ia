'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../utils/apiFailover';
import { ArrowUp, RotateCcw, Bot, CheckCircle2, Clock3, ShieldCheck, Sparkles, TrendingUp, Zap, Clipboard, ClipboardCheck, Wifi, FlaskConical } from 'lucide-react';

const SESSION_KEY = 'filtra-dot-local-session';
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
};

const DOT_UI: Record<string, Omit<DotUi, 'locale'>> = {
  pt: {
    earlyAccess: 'Acesso antecipado',
    earlyAccessTitle: 'O Filtra Dot está reservado aos planos Rei e Corporativo.',
    earlyAccessBody: 'Sua conta atual não possui acesso ao Dot. O recurso está em acesso antecipado para clientes Rei e Corporativo.',
    plan: 'Plano identificado',
    newConversation: 'Nova conversa',
    protectedActions: 'Ações externas protegidas por aprovação',
    analyzing: 'Analisando sinais do negócio…',
    ask: 'Pergunte ao Filtra Dot…',
    localDemo: 'Protótipo local · dados demonstrativos · nenhuma ação externa é executada.',
    suggestionsTitle: 'Sugestões',
    canDoTitle: 'O que posso fazer',
    analyze: 'Analisar avaliações e padrões',
    explain: 'Explicar mudanças na reputação',
    prepare: 'Preparar ações para aprovação',
    verifyComplaint: 'Verificar reclamação',
    verifyingComplaint: 'Verificando evidências…',
    decisionOwner: 'A decisão final permanece com o responsável.',
    noAction: 'Nenhuma ação preparada.',
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
  },
  en: {
    earlyAccess: 'Early access',
    earlyAccessTitle: 'Filtra Dot is reserved for Rei and Corporativo plans.',
    earlyAccessBody: 'Your account does not have Dot access. The feature is in early access for Rei and Corporativo customers.',
    plan: 'Detected plan',
    newConversation: 'New conversation',
    protectedActions: 'External actions require approval',
    analyzing: 'Analyzing business signals…',
    ask: 'Ask Filtra Dot…',
    localDemo: 'Local prototype · demo data · no external action is executed.',
    suggestionsTitle: 'Suggestions',
    canDoTitle: 'What I can do',
    analyze: 'Analyze reviews and patterns',
    explain: 'Explain reputation changes',
    prepare: 'Prepare actions for approval',
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
  },
  es: {
    earlyAccess: 'Acceso anticipado',
    earlyAccessTitle: 'Filtra Dot está reservado para los planes Rei y Corporativo.',
    earlyAccessBody: 'Tu cuenta no tiene acceso a Dot. La función está en acceso anticipado para clientes Rei y Corporativo.',
    plan: 'Plan detectado',
    newConversation: 'Nueva conversación',
    protectedActions: 'Las acciones externas requieren aprobación',
    analyzing: 'Analizando señales del negocio…',
    ask: 'Pregunta a Filtra Dot…',
    localDemo: 'Prototipo local · datos de demostración · no se ejecutan acciones externas.',
    suggestionsTitle: 'Sugerencias',
    canDoTitle: 'Lo que puedo hacer',
    analyze: 'Analizar reseñas y patrones',
    explain: 'Explicar cambios en la reputación',
    prepare: 'Preparar acciones para aprobación',
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


function authHeaders(json = true): HeadersInit {
  return json ? { 'Content-Type': 'application/json' } : {};
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
type DotStatus = { access: boolean; enabled: boolean; demo: boolean; feature_enabled?: boolean; plan?: string; plan_label?: string; scheduler?: DotSchedulerStatus };
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
    <div className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 shadow-[0_0_35px_rgba(99,102,241,.22)] ${active ? 'animate-pulse' : ''}`}>
      <div className="absolute inset-2 rounded-xl border border-indigo-300/20" />
      <div className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-300 via-indigo-500 to-violet-700 shadow-lg">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </div>
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
    return { role: 'dot', text: `Hello. I’m Filtra Dot. I’m monitoring the reputation of ${company}. I can analyze signals, explain what changed, and prepare the next step for you.` };
  }
  if (locale === 'es') {
    return { role: 'dot', text: `Hola. Soy Filtra Dot. Estoy siguiendo la reputación de ${company}. Puedo analizar señales, explicar qué cambió y preparar el siguiente paso para ti.` };
  }
  return { role: 'dot', text: `Olá. Eu sou o Filtra Dot. Estou acompanhando a reputação de ${company}. Posso analisar sinais, explicar o que mudou e preparar o próximo passo para você.` };
}

export default function FiltraDotPage() {
  const [uiLocale, setUiLocale] = useState('pt');
  const ui = dotUi(uiLocale);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  useEffect(() => {
    const locale = detectDotLocale();
    if (locale === 'pt') return;
    const nextUi = dotUi(locale);
    setUiLocale(locale);
    setSuggestions(localizedSuggestions(locale));
    setMessages((current) => current.length === 1 && current[0].role === 'dot'
      ? [initialMessage(nextUi.companyPlaceholder, locale)]
      : current);
  }, []);

  useEffect(() => {
    let disposed = false;
    const refreshOperationalState = async () => {
      const headers = authHeaders(false);
      const responses = await Promise.all([
        apiFetch('/api/dot/status', { headers }),
        apiFetch('/api/dot/events', { headers }),
        apiFetch('/api/dot/decisions', { headers }),
        apiFetch('/api/dot/actions', { headers }),
        apiFetch('/api/dot/followups', { headers }),
      ]);
      if (disposed) return;
      const [statusResponse, eventsResponse, decisionsResponse, actionsResponse, followupsResponse] = responses;
      const [status, eventsData, decisionsData, actionsData, followupsData] = await Promise.all([
        statusResponse.ok ? statusResponse.json() : null,
        eventsResponse.ok ? eventsResponse.json() : null,
        decisionsResponse.ok ? decisionsResponse.json() : null,
        actionsResponse.ok ? actionsResponse.json() : null,
        followupsResponse.ok ? followupsResponse.json() : null,
      ]);
      if (status) {
        setDotStatus({
          access: Boolean(status.access),
          enabled: Boolean(status.enabled),
          demo: Boolean(status.demo),
          feature_enabled: typeof status.feature_enabled === 'boolean' ? status.feature_enabled : undefined,
          plan: status.plan,
          plan_label: status.plan_label,
          scheduler: status.scheduler,
        });
      }
      if (status?.scheduler) setScheduler(status.scheduler);
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
      setDecisions(current => current.map(d => d.id === decisionId ? { ...d, status: 'prepared' } : d));
    } catch {}
  }

  async function approveAction(actionId: number) {
    try {
      const response = await apiFetch('/api/dot/actions/' + actionId + '/approve', { method: 'POST', headers: authHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.action) setActions(current => current.map(a => a.id === actionId ? { ...a, status: 'approved' } : a));
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
      <main className="min-h-screen bg-black text-zinc-100">
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
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao falar com o Dot.');
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

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <DotAvatar />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span>Filtra Dot</span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">REI / CORPORATIVO</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {dotStatus?.demo ? <FlaskConical size={10} /> : <Wifi size={10} />}
                  {dotStatus?.demo ? ui.demo : ui.online}
                </span>
              </div>
              <div className="text-xs text-zinc-500">Agente de reputação e crescimento</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void resetConversation()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-indigo-400/30 hover:text-zinc-200 disabled:opacity-40">
              <RotateCcw size={13} /> {ui.newConversation}
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
            <ShieldCheck size={14} className="text-emerald-400" /> {ui.protectedActions}
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[1fr_300px]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-indigo-950/20">
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
              <div className="mx-auto max-w-3xl">
                <div className="mb-7 flex items-start gap-4">
                  <DotAvatar active={busy} />
                  <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-indigo-400/15 bg-indigo-500/[0.06] p-4 text-sm leading-7 text-zinc-200">
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
                          </div>
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
              <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-2 focus-within:border-indigo-400/40">
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
                  aria-label="Enviar mensagem"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between gap-3 text-[10px] text-zinc-600">
                <span>{ui.localDemo}</span>
                <span className="hidden text-right sm:block">{ui.responseLimit}</span>
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:pr-1">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-400">Dot Control</div>
                <div className={scheduler?.last_error_at ? 'text-[10px] text-amber-300' : 'text-[10px] text-emerald-300'}>
                  {scheduler?.running ? '● Executando' : scheduler?.timer_active ? '● Monitoramento ativo' : '● Aguardando'}
                </div>
              </div>
              {scheduler ? (
                <>
                  <div className="mt-3 text-xs text-zinc-500">Última rodada: {scheduler.last_success_at ? new Date(scheduler.last_success_at).toLocaleString('pt-BR') : 'ainda não executada'}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-white/5 bg-black/20 p-2"><span className="text-zinc-600">Empresas</span><div className="mt-1 text-zinc-200">{scheduler.companies_processed} processadas · {scheduler.companies_skipped} aguardando</div></div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-2"><span className="text-zinc-600">Follow-ups</span><div className="mt-1 text-zinc-200">{scheduler.followups_processed}</div></div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-2"><span className="text-zinc-600">Decisões</span><div className="mt-1 text-zinc-200">{scheduler.decisions_created}</div></div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-2"><span className="text-zinc-600">Ações</span><div className="mt-1 text-zinc-200">{scheduler.actions_prepared} preparadas</div></div>
                  </div>
                  {scheduler.last_error && <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2 text-[10px] text-amber-200">{scheduler.last_error}</div>}
                </>
              ) : <div className="mt-3 text-xs text-zinc-600">{ui.loading}</div>}
            </div>


            {proposal && (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
                <div className="text-xs font-semibold text-emerald-300">AÇÃO PREPARADA — NÃO EXECUTADA</div>
                <div className="mt-2 text-sm font-semibold text-white">{proposal.title}</div>
                <div className="mt-2 text-xs leading-5 text-zinc-400">{proposal.objective}</div>
                <ol className="mt-3 space-y-2 text-xs text-zinc-400">
                  {(proposal.steps || []).map((step: string, index: number) => <li key={step}>{index + 1}. {step}</li>)}
                </ol>
                <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-[11px] text-amber-200">Aprovação será obrigatória antes de qualquer ação externa.</div>
              </div>
            )}


            <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/[0.04] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-indigo-300"><Bot size={14} /> Dot Resolve</div>
              <div className="mt-2 text-xs leading-5 text-zinc-500">Receba uma reclamação, verifique o que os dados da empresa sustentam e deixe a decisão final com o responsável.</div>
              <textarea value={resolveInput} onChange={e => setResolveInput(e.target.value)} rows={3} placeholder="Ex.: cliente diz que esperou 40 minutos para ser atendido..." className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-indigo-400/40" />
              <button type="button" onClick={() => void resolveComplaint()} disabled={!resolveInput.trim() || resolveBusy} className="mt-2 w-full rounded-xl bg-indigo-500 px-3 py-2.5 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-40">{resolveBusy ? ui.verifyingComplaint : ui.verifyComplaint}</button>
              {resolveResult && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                      <span className="text-zinc-500">Verificação</span>
                      <span className={resolveResult.verification_status === 'confirmed' ? 'text-emerald-300' : 'text-amber-300'}>{resolveResult.verification_status} · confiança {resolveResult.confidence}</span>
                    </div>
                    <div className="mt-2 text-xs leading-5 text-zinc-300">{resolveResult.problem_summary}</div>
                  </div>
                  {resolveResult.facts.map((fact, i) => <div key={i} className="text-[11px] leading-5 text-zinc-500"><span className="text-zinc-300">{fact.source}:</span> {fact.fact}</div>)}
                  {resolveResult.evidence.length > 0 && <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Evidências encontradas</div><div className="space-y-2">{resolveResult.evidence.slice(0,5).map(e => <div key={e.id} className="rounded-xl border border-white/5 bg-black/20 p-2.5"><div className="flex justify-between text-[10px]"><span className="text-amber-300">Nota {e.rating}/5</span><span className="text-zinc-600">{e.id}</span></div><div className="mt-1 text-[11px] leading-5 text-zinc-400">{e.comment}</div></div>)}</div></div>}
                  <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Duas opções</div><div className="grid gap-2">{resolveResult.options.slice(0,2).map(o => <button key={o.id} type="button" disabled={!resolveResult.decision_id} onClick={() => resolveResult.decision_id && void prepareOption(resolveResult.decision_id, o.id)} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left hover:border-indigo-400/30 disabled:opacity-40"><div className="text-xs font-semibold text-white">{o.title}</div><div className="mt-1 text-[11px] leading-5 text-zinc-500">{o.description}</div><div className="mt-1 text-[10px] text-zinc-600">Risco: {o.risk}</div></button>)}</div></div>
                  {resolveResult.requires_owner_decision && <div className="text-[10px] text-amber-300">{ui.decisionOwner} {ui.noExternalAuto}</div>}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-indigo-300"><Sparkles size={14} /> Hoje</div>
              <div className="mt-4 space-y-3">
                {briefing && <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4"><div className="text-xs font-medium text-amber-200">Sinal prioritário</div><div className="mt-1 text-sm font-semibold text-white">{briefing.priority}</div><div className="mt-1 text-xs leading-5 text-zinc-500">{briefing.reason}</div></div>}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs text-zinc-500"><TrendingUp size={14} /> Tendência</div><div className="mt-1 text-xl font-semibold text-white">{briefing?.trend || 'monitorando'}</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs text-zinc-500"><Zap size={14} /> Sinais</div><div className="mt-1 text-xl font-semibold text-white">{events.length || 'nenhum'}</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs text-zinc-500"><Clock3 size={14} /> Próximo passo</div><div className="mt-1 text-sm font-medium text-white">{briefing?.suggestedAction || 'O Dot está monitorando sua empresa.'}</div><button type="button" onClick={() => void prepareAction()} className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/20">Preparar ação</button></div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-zinc-300">Alertas recentes</div><a href="/dot/configuracoes" className="text-[11px] text-indigo-300">Configurar autonomia</a></div><div className="mt-3 space-y-2">{events.slice(0,3).map(e => <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3"><div className="text-xs font-medium text-white">{e.title}</div><div className="mt-1 text-[11px] leading-5 text-zinc-500">{e.details}</div></div>)}{events.length===0 && <div className="text-xs text-zinc-600">Nenhum alerta novo.</div>}</div></div>

            <div className="rounded-3xl border border-amber-400/15 bg-amber-500/[0.04] p-5">
              <div className="flex items-center justify-between"><div className="text-xs font-semibold text-amber-200">Decisões do Dot</div><span className="text-[10px] text-zinc-500">{decisions.length} registradas</span></div>
              <div className="mt-3 space-y-3">
                {decisions.slice(0,3).map(d => <div key={d.id} className="rounded-2xl border border-white/5 bg-black/20 p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">{d.priority.toUpperCase()}</span><span className="text-[10px] text-zinc-500">{d.status}</span></div>
                  <div className="mt-1 text-xs text-zinc-400">{d.reason}</div>
                  <div className="mt-2 text-[11px] leading-5 text-zinc-500">Recomendação: {d.recommendation}</div>
                  {d.requiresApproval && <div className="mt-2 text-[10px] text-amber-300">A decisão final é do empresário.</div>}
                  <div className="mt-3 grid gap-2">
                    {(d.options || []).slice(0,2).map(option => <button key={option.id} type="button" onClick={() => void prepareOption(d.id, option.id)} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left hover:border-indigo-400/30">
                      <div className="text-xs font-semibold text-white">{option.title}</div>
                      <div className="mt-1 text-[11px] leading-5 text-zinc-500">{option.description}</div>
                      <div className="mt-1 text-[10px] text-zinc-600">Risco: {option.risk}</div>
                    </button>)}
                  </div>
                  {d.status === 'pending' && <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void updateDecision(d.id,'prepare')} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-300 hover:border-indigo-400/30">Preparar</button>
                    <button type="button" onClick={() => void updateDecision(d.id,'reject')} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300">Rejeitar</button>
                  </div>}
                </div>)}
                {decisions.length===0 && <div className="text-xs text-zinc-600">O Dot ainda não registrou uma decisão.</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.05] p-5">
              <div className="flex items-center justify-between"><div className="text-xs font-semibold text-indigo-200">Fila de ações</div><span className="text-[10px] text-zinc-500">{actions.length} registradas</span></div>
              <div className="mt-3 space-y-2">
                {actions.slice(0,3).map(a => <div key={a.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">{a.action}</span><span className="text-[10px] text-zinc-500">{a.status}</span></div>
                  <div className="mt-2 flex gap-2">
                    {a.status === 'prepared' && <button type="button" onClick={() => void approveAction(a.id)} className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[10px] text-white hover:bg-indigo-400">Aprovar ação</button>}
                    {a.status === 'approved' && <button type="button" onClick={() => void runAction(a.id)} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] text-emerald-200 hover:bg-emerald-400/20">Executar local</button>}
                  </div>
                  {a.status === 'executed' && <div className="mt-2 text-[10px] text-emerald-300">Executada somente no executor local; nenhum sistema externo foi alterado.</div>}
                </div>)}
                {actions.length===0 && <div className="text-xs text-zinc-600">{ui.noAction}</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center justify-between"><div className="text-xs font-semibold text-emerald-200">Acompanhamento</div><span className="text-[10px] text-zinc-500">{followUps.filter(f => f.status === 'pending').length} pendentes</span></div>
              <div className="mt-3 space-y-2">
                {followUps.slice(0,3).map(f => <div key={f.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <div className="flex items-center justify-between text-[10px]"><span className="text-zinc-300">Ação #{f.action_id}</span><span className={f.status === 'pending' ? 'text-amber-300' : 'text-emerald-300'}>{f.status}</span></div>
                  <div className="mt-1 text-[11px] text-zinc-500">{f.status === 'pending' ? `Retorno previsto: ${new Date(f.due_at).toLocaleString('pt-BR')}` : `Resultado: ${f.outcome || 'avaliado'}`}</div>
                  {f.result_json && (() => { try { const r = JSON.parse(f.result_json); return <div className="mt-1 space-y-1 text-[10px] text-zinc-600"><div>Nota: {r.current?.average ?? '—'} · críticas: {r.current?.critical_count ?? '—'} · variação: {r.delta_average > 0 ? '+' : ''}{r.delta_average ?? 0}</div>{r.reassessment?.event_id && <div className="text-amber-300">Piora detectada: nova decisão #{r.reassessment.decision_id ?? '—'}{r.reassessment.prepared_action_id ? ` · ação preparada #${r.reassessment.prepared_action_id}` : ''}</div>}{r.reassessment?.policy && <div>Política: {r.reassessment.policy.autonomy} · aprovação obrigatória</div>}</div>; } catch { return null; } })()}
                </div>)}
                {followUps.length === 0 && <div className="text-xs text-zinc-600">O Dot criará o acompanhamento após uma execução.</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.05] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Bot size={16} className="text-indigo-300" /> {ui.canDoTitle}</div>
              <ul className="mt-4 space-y-3 text-xs leading-5 text-zinc-400">
                <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" /> {ui.analyze}</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" /> {ui.explain}</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" /> {ui.prepare}</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <div className="text-xs font-semibold text-zinc-300">{ui.suggestionsTitle}</div>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => void send(suggestion)} disabled={busy} className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left text-xs text-zinc-400 transition hover:-translate-y-0.5 hover:border-indigo-400/30 hover:bg-indigo-500/[0.03] hover:text-zinc-200 disabled:opacity-40">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
