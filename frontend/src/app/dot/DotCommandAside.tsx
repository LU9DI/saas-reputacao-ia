'use client';

import { Zap } from 'lucide-react';

export type DotEvent = { id: number; type: string; severity: string; title: string; details: string; created_at: string };
export type DotOption = { id: 'opcao_1' | 'opcao_2'; title: string; description: string; action: string; risk: string };
export type DotDecision = { id: number; priority: string; severity: string; reason: string; recommendation: string; requiresApproval: boolean; status: string; options: DotOption[] };
export type DotAction = { id: number; decision_id: number; option_id: string; action: string; status: string; approved_at?: string | null; executed_at?: string | null; error?: string | null };
export type DotFollowUp = { id: number; decision_id: number; action_id: number; status: 'pending' | 'completed' | 'cancelled'; due_at: string; outcome?: string | null; result_json?: string | null; created_at: string; completed_at?: string | null };
export type Briefing = { headline: string; trend?: string; rating?: string; reviews?: number; priority?: string; reason?: string; suggestedAction: string };
export type DotPanelId = 'overview' | 'alerts' | 'decisions' | 'actions' | 'followups' | 'resolve' | 'capabilities' | 'suggestions' | 'control';

type UiBits = {
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
  localDemo: string;
  protectedActions: string;
};

type Props = {
  ui: UiBits;
  uiLocale: string;
  demo?: boolean;
  busy: boolean;
  events: DotEvent[];
  decisions: DotDecision[];
  actions: DotAction[];
  followUps: DotFollowUp[];
  briefing: Briefing | null;
  focusPanel: (panel: DotPanelId) => void;
  prepareAction: () => void | Promise<void>;
  approveAction: (id: number) => void | Promise<void>;
  runAction: (id: number) => void | Promise<void>;
};

type PrimaryCta = {
  label: string;
  kind: 'approve' | 'run' | 'decision' | 'followup' | 'briefing' | 'calm';
  actionId?: number;
};

function pickPrimaryCta(
  ui: UiBits,
  events: DotEvent[],
  decisions: DotDecision[],
  actions: DotAction[],
  followUps: DotFollowUp[],
  briefing: Briefing | null,
): PrimaryCta {
  const prepared = actions.find((a) => String(a.status).toLowerCase() === 'prepared');
  if (prepared) return { label: ui.approveAction, kind: 'approve', actionId: prepared.id };

  const approved = actions.find((a) => String(a.status).toLowerCase() === 'approved');
  if (approved) return { label: ui.executeLocal, kind: 'run', actionId: approved.id };

  const openDecision = decisions.find((d) => {
    const s = String(d.status || '').toLowerCase();
    return !s || s === 'pending' || s === 'open' || s === 'suggested';
  });
  if (openDecision) return { label: ui.prepareAction, kind: 'decision' };

  const dueFollowUp = followUps.find((f) => f.status === 'pending');
  if (dueFollowUp) return { label: ui.followupTitle, kind: 'followup' };

  if (briefing?.suggestedAction) return { label: briefing.suggestedAction, kind: 'briefing' };

  if (events.length === 0 && decisions.length === 0 && actions.length === 0) {
    return { label: ui.calmContext, kind: 'calm' };
  }
  return { label: ui.nextStepLabel, kind: 'briefing' };
}

type StepId = 'signals' | 'investigate' | 'decision' | 'prepare' | 'approve' | 'result';

function deriveStep(events: DotEvent[], decisions: DotDecision[], actions: DotAction[], followUps: DotFollowUp[]): StepId {
  if (actions.some((a) => ['executed', 'completed'].includes(String(a.status).toLowerCase())) || followUps.some((f) => f.status === 'pending')) return 'result';
  if (actions.some((a) => String(a.status).toLowerCase() === 'approved')) return 'approve';
  if (actions.some((a) => String(a.status).toLowerCase() === 'prepared')) return 'prepare';
  if (decisions.some((d) => {
    const s = String(d.status || '').toLowerCase();
    return !s || ['pending', 'open', 'suggested', 'prepared'].includes(s);
  })) return 'decision';
  if (events.length > 0) return 'investigate';
  return 'signals';
}

export function DotCommandAside({
  ui,
  uiLocale,
  demo,
  busy,
  events,
  decisions,
  actions,
  followUps,
  briefing,
  focusPanel,
  prepareAction,
  approveAction,
  runAction,
}: Props) {
  const primaryCta = pickPrimaryCta(ui, events, decisions, actions, followUps, briefing);
  const step = deriveStep(events, decisions, actions, followUps);
  const steps: { id: StepId; label: string; panel: DotPanelId }[] = [
    { id: 'signals', label: ui.signalsLabel, panel: 'alerts' },
    { id: 'investigate', label: ui.investigateTitle, panel: 'resolve' },
    { id: 'decision', label: ui.decisionLabel, panel: 'decisions' },
    { id: 'prepare', label: ui.prepareAction, panel: 'actions' },
    { id: 'approve', label: ui.approveAction, panel: 'actions' },
    { id: 'result', label: ui.resultLabel, panel: 'followups' },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);

  const queueItems: { key: string; kind: string; title: string; panel: DotPanelId; meta?: string }[] = [];
  for (const d of decisions.slice(0, 2)) {
    queueItems.push({ key: `d-${d.id}`, kind: ui.decisionLabel, title: d.recommendation || d.reason, panel: 'decisions', meta: d.priority });
  }
  for (const a of actions.slice(0, 2)) {
    if (queueItems.length >= 5) break;
    queueItems.push({ key: `a-${a.id}`, kind: ui.actionsTitle, title: a.action, panel: 'actions', meta: a.status });
  }
  for (const f of followUps.filter((x) => x.status === 'pending').slice(0, 2)) {
    if (queueItems.length >= 5) break;
    queueItems.push({
      key: `f-${f.id}`,
      kind: ui.followupTitle,
      title: new Date(f.due_at).toLocaleDateString(uiLocale === 'pt' ? 'pt-BR' : uiLocale === 'es' ? 'es-ES' : 'en-US'),
      panel: 'followups',
      meta: ui.pending,
    });
  }
  for (const e of events.slice(0, 2)) {
    if (queueItems.length >= 5) break;
    queueItems.push({ key: `e-${e.id}`, kind: ui.signalsLabel, title: e.title, panel: 'alerts', meta: e.severity });
  }

  const runPrimary = () => {
    if (primaryCta.kind === 'approve' && primaryCta.actionId != null) void approveAction(primaryCta.actionId);
    else if (primaryCta.kind === 'run' && primaryCta.actionId != null) void runAction(primaryCta.actionId);
    else if (primaryCta.kind === 'decision') {
      focusPanel('decisions');
      void prepareAction();
    } else if (primaryCta.kind === 'followup') focusPanel('followups');
    else if (primaryCta.kind === 'briefing') void prepareAction();
    else focusPanel('overview');
  };

  return (
    <aside className="order-2 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-[22px] border border-indigo-400/20 bg-gradient-to-b from-indigo-500/10 to-white/[0.02] p-4 shadow-[0_0_0_1px_rgba(99,102,241,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.7)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">{ui.currentTitle}</span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{ui.nextStepLabel}</span>
        </div>
        <div className="mt-3 text-base font-semibold tracking-tight text-white">{briefing?.headline || briefing?.priority || ui.monitoringActive}</div>
        <p className="mt-1.5 text-xs leading-5 text-zinc-400">{briefing?.reason || ui.currentBody}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          {events.length > 0 && <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-2 py-1 text-amber-200">{events.length} {ui.signalsContext}</span>}
          {decisions.length > 0 && <span className="rounded-full border border-indigo-400/15 bg-indigo-500/10 px-2 py-1 text-indigo-200">{decisions.length} {ui.pendingDecision.toLowerCase()}</span>}
          {actions.length > 0 && <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-zinc-300">{actions.length} {ui.pendingAction.toLowerCase()}</span>}
          {followUps.filter((f) => f.status === 'pending').length > 0 && (
            <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 text-emerald-200">
              {followUps.filter((f) => f.status === 'pending').length} {ui.followUpsLabel.toLowerCase()}
            </span>
          )}
          {events.length === 0 && decisions.length === 0 && actions.length === 0 && <span className="text-zinc-500">{ui.calmContext}</span>}
        </div>
        <button
          type="button"
          onClick={runPrimary}
          disabled={busy || primaryCta.kind === 'calm'}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Zap size={13} /> {primaryCta.label}
        </button>
      </div>

      <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">{ui.workflowTitle}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((s, idx) => {
            const done = idx < activeIdx;
            const active = idx === activeIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => focusPanel(s.panel)}
                className={`rounded-lg border px-2 py-1 text-[10px] font-medium transition ${
                  active
                    ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100'
                    : done
                      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/[0.06] bg-black/20 text-zinc-500'
                }`}
                title={s.label}
              >
                {done ? '✓ ' : active ? '● ' : '○ '}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {queueItems.length > 0 && (
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">{ui.groupDecide}</div>
          <div className="mt-3 space-y-2">
            {queueItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => focusPanel(item.panel)}
                className="flex w-full items-start justify-between gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5 text-left transition hover:border-indigo-400/25"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-600">{item.kind}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-zinc-200">{item.title}</div>
                </div>
                {item.meta && <span className="shrink-0 text-[10px] text-zinc-500">{item.meta}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[20px] border border-white/[0.06] bg-black/10 px-4 py-3 text-[10px] leading-5 text-zinc-600">
        {demo ? ui.localDemo : ui.protectedActions}
      </div>
    </aside>
  );
}
