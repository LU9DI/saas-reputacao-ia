'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, Bot, Check, CheckCircle2, ChevronDown, Circle,
  Clock3, Loader2, RefreshCw, Settings2, Sparkles, Target, X,
} from 'lucide-react';
import { apiFetch } from '../utils/apiFailover';

type Goal = { id: number; title: string; description?: string; status: 'active' | 'paused' | 'completed' | 'archived'; progress: number };
type DotStatus = { access: boolean; enabled: boolean; demo: boolean; plan?: string; plan_label?: string };
type Permission = { resource: string; action: string; granted: number };
type Integration = { provider: string; label: string; status: string };
type Mission = { id: number; goal_id: number; title: string; status: 'planned' | 'working' | 'waiting_approval' | 'completed' | 'paused' | string; current_step: number; total_steps: number };
type MissionStep = { id: number; mission_id: number; type: 'observe' | 'investigate' | 'recommend' | 'prepare' | 'approval' | 'result' | string; status: 'pending' | 'working' | 'completed' | 'waiting_approval' | string; title: string; output?: string | null };
type Action = { id: number; decisionId: number; optionId: string; action: string; status: 'prepared' | 'approved' | 'executing' | 'executed' | 'failed' | 'cancelled' | string; approvedAt?: string | null; executedAt?: string | null; error?: string | null };
type FollowUp = { id: number; status: string; due_at: string; outcome?: string | null };
type CaseItem = { id: number; status: string; priority: string; summary: string; next_step: string };

const quickGoals = [
  'Encontrar o principal problema da minha operação',
  'Descobrir o que está derrubando minha reputação',
  'Organizar as pendências mais importantes',
  'Acompanhar se as ações estão funcionando',
];

const stepLabel: Record<string, string> = {
  observe: 'Entender', investigate: 'Investigar', recommend: 'Decidir',
  prepare: 'Preparar', approval: 'Sua aprovação', result: 'Acompanhar',
};

function clampProgress(value: number) { return Math.max(0, Math.min(100, Number(value) || 0)); }
function missionProgress(mission: Mission) {
  if (mission.status === 'completed') return 100;
  return clampProgress((Math.min(mission.current_step, mission.total_steps) / Math.max(1, mission.total_steps)) * 100);
}

export function DotAgentSurface() {
  const [status, setStatus] = useState<DotStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<{ goals: Goal[]; summary?: { active: number; attention: number } } | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [approvalBusy, setApprovalBusy] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);

  const hasAccess = Boolean(status?.access && status?.enabled);
  const canApprove = permissions.some((p) => p.resource === 'filtra' && p.action === 'update' && Number(p.granted) === 1);
  const canMissionExecute = permissions.some((p) => p.resource === 'operations' && p.action === 'execute' && Number(p.granted) === 1);
  const canActionExecute = permissions.some((p) => p.resource === 'filtra' && p.action === 'execute' && Number(p.granted) === 1);
  const activeMission = useMemo(
    () => missions.find((mission) => ['working', 'planned', 'waiting_approval'].includes(mission.status)) ||
      missions.find((mission) => mission.status !== 'completed'),
    [missions],
  );
  const activeGoal = useMemo(
    () => workspace?.goals.find((goal) => goal.id === activeMission?.goal_id && goal.status === 'active') ||
      workspace?.goals.find((goal) => goal.status === 'active'),
    [workspace, activeMission],
  );
  const pendingApproval = useMemo(() => actions.find((action) => action.status === 'prepared'), [actions]);
  const activeCases = useMemo(() => cases.filter((item) => ['prioritized', 'escalated'].includes(item.status)).slice(0, 3), [cases]);

  async function loadStatus() {
    try {
      const res = await apiFetch('/api/dot/status', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setStatus({ access: Boolean(data.access), enabled: Boolean(data.enabled), demo: Boolean(data.demo), plan: data.plan, plan_label: data.plan_label });
    } catch {}
  }

  async function loadWorkspace() {
    try {
      setError('');
      const requests = await Promise.all([
        apiFetch('/api/dot/agent/workspace', { credentials: 'include' }),
        apiFetch('/api/dot/agent/permissions', { credentials: 'include' }),
        apiFetch('/api/dot/agent/missions', { credentials: 'include' }),
        apiFetch('/api/dot/actions', { credentials: 'include' }),
        apiFetch('/api/dot/followups', { credentials: 'include' }),
        apiFetch('/api/dot/cases', { credentials: 'include' }),
      ]);
      const [workspaceRes, permissionRes, missionsRes, actionsRes, followupsRes, casesRes] = requests;
      if (workspaceRes.ok) {
        const data = await workspaceRes.json();
        if (data?.ok) setWorkspace({ goals: data.goals || [], summary: data.summary || { active: 0, attention: 0 } });
      }
      if (permissionRes.ok) {
        const data = await permissionRes.json();
        if (data?.ok) setPermissions(data.permissions || []);
      }
      if (missionsRes.ok) {
        const data = await missionsRes.json();
        if (data?.ok) {
          const nextMissions = data.missions || [];
          setMissions(nextMissions);
          setSelectedMissionId((current) => current && nextMissions.some((mission: Mission) => mission.id === current) ? current : nextMissions[0]?.id ?? null);
        }
      }
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        if (data?.ok) setActions(data.actions || []);
      }
      if (followupsRes.ok) {
        const data = await followupsRes.json();
        if (data?.ok) setFollowups(data.followups || []);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        if (data?.ok) setCases(data.cases || []);
      }
    } catch {
      setError('Não consegui atualizar o estado do DOT.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMissionSteps(missionId: number | null) {
    if (!missionId) { setSteps([]); return; }
    try {
      const res = await apiFetch('/api/dot/agent/missions/' + missionId + '/steps', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) setSteps(data.steps || []);
    } catch {}
  }

  useEffect(() => { void loadStatus(); }, []);
  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    void loadWorkspace();
    const interval = window.setInterval(() => void loadWorkspace(), 30_000);
    return () => window.clearInterval(interval);
  }, [hasAccess]);
  useEffect(() => { void loadMissionSteps(selectedMissionId); }, [selectedMissionId]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  async function createGoal(titleOverride?: string) {
    const title = (titleOverride ?? draft).trim();
    if (title.length < 3 || busy) return;
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/dot/agent/goals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title, source: 'dot_global_agent' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Não foi possível iniciar a missão.');
      if (data?.goal) setWorkspace((current) => current ? { ...current, goals: [data.goal, ...current.goals] } : { goals: [data.goal] });
      setDraft('');
      await loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar a missão.');
    } finally { setBusy(false); }
  }

  async function runMission(missionId: number) {
    if (!canMissionExecute || actionBusy) return;
    setActionBusy(missionId); setError('');
    try {
      const res = await apiFetch('/api/dot/agent/missions/' + missionId + '/run-step', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Não foi possível avançar a missão.');
      await loadWorkspace(); await loadMissionSteps(missionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao avançar a missão.');
    } finally { setActionBusy(null); }
  }

  async function approveAction(actionId: number) {
    if (!canApprove || approvalBusy) return;
    setApprovalBusy(actionId); setError('');
    try {
      const res = await apiFetch('/api/dot/actions/' + actionId + '/approve', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Não foi possível aprovar a ação.');
      await loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao aprovar a ação.');
    } finally { setApprovalBusy(null); }
  }

  async function executeAction(actionId: number) {
    if (!canActionExecute || approvalBusy) return;
    setApprovalBusy(actionId); setError('');
    try {
      const res = await apiFetch('/api/dot/actions/' + actionId + '/run', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.reason || data?.error || 'Não foi possível executar a ação.');
      await loadWorkspace();
      if (activeMission?.id) await loadMissionSteps(activeMission.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao executar a ação.');
    } finally { setApprovalBusy(null); }
  }

  const selectedMission = missions.find((mission) => mission.id === selectedMissionId) || activeMission;
  const connectedIntegrations = integrations.filter((item) => item.status === 'connected').length;
  const pendingFollowups = followups.filter((item) => item.status === 'pending').length;

  return (
    <>
      <button type="button" aria-label="Abrir DOT" data-testid="dot-agent-launcher" onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[90] grid h-12 w-12 place-items-center rounded-[16px] border border-white/10 bg-[#0b0d12]/95 text-white shadow-[0_14px_45px_rgba(0,0,0,.48)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-[#11141b] focus:outline-none focus:ring-2 focus:ring-sky-400/50">
        <span className="absolute inset-0 rounded-[16px] bg-sky-400/[0.07] animate-pulse" />
        <Bot size={21} className="relative text-sky-300" strokeWidth={1.8} />
        {hasAccess && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050507] bg-emerald-400" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <button aria-label="Fechar DOT" onClick={() => setOpen(false)} className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
          <aside role="dialog" aria-modal="true" aria-label="DOT, agente da empresa" data-testid="dot-agent-panel"
            className="pointer-events-auto absolute bottom-3 right-3 flex max-h-[calc(100vh-1.5rem)] w-[min(500px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#080a0f] shadow-[0_35px_120px_rgba(0,0,0,.72)]">
            <header className="shrink-0 border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-sky-300/10 bg-sky-400/[0.08] text-sky-300"><Bot size={19} strokeWidth={1.7} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[15px] font-semibold tracking-tight text-white">DOT</span><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[.12em] text-emerald-300">{hasAccess ? 'ativo' : 'bloqueado'}</span></div>
                    <div className="truncate text-[10px] text-zinc-500">agente da empresa · {status?.demo ? 'modo demonstração' : status?.plan_label || status?.plan || 'acesso'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {hasAccess && <button type="button" aria-label="Atualizar DOT" onClick={() => void loadWorkspace()} className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"><RefreshCw size={15} /></button>}
                  <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"><X size={17} /></button>
                </div>
              </div>
            </header>

            <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-4">
              {!hasAccess ? (
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/[0.08] to-white/[0.02] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300"><Bot size={21} /></div>
                  <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Eu fico aqui com você.</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">Entre em uma conta autorizada para que eu possa acompanhar a empresa. O DOT nunca age fora do escopo autenticado.</p>
                  <a href="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200">Entrar na Filtra.AI <ArrowUpRight size={14} /></a>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-200"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

                  <section className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.018] p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Sparkles size={17} /></div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-[.16em] text-sky-300/80">Delegue para mim</div>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white">O que você quer que eu cuide?</h2>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">Eu transformo seu objetivo em missão, investigo, preparo o próximo passo e paro quando sua decisão for necessária.</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-2">
                      <input data-testid="dot-goal-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createGoal(); }} placeholder="Ex.: descobrir por que minhas avaliações caíram" className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600" />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5">
                          {quickGoals.slice(0, 2).map((goal) => <button key={goal} type="button" onClick={() => setDraft(goal)} className="shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-[10px] text-zinc-500 transition hover:border-sky-300/20 hover:text-zinc-300">{goal.length > 28 ? goal.slice(0, 28) + '…' : goal}</button>)}
                        </div>
                        <button type="button" onClick={() => void createGoal()} disabled={busy || draft.trim().length < 3} className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-35">{busy ? <Loader2 size={14} className="animate-spin" /> : 'Delegar'}</button>
                      </div>
                    </div>
                  </section>

                  {loading ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-xs text-zinc-500">O DOT está reunindo o estado da empresa…</div>
                  ) : activeMission ? (
                    <section className="rounded-[26px] border border-white/10 bg-[#0c0f15] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500"><Target size={13} className="text-sky-300" />Estou cuidando de</div>
                          <h3 className="mt-1.5 truncate text-[15px] font-semibold text-white">{activeMission.title}</h3>
                          {activeGoal && <p className="mt-1 text-[11px] text-zinc-600">objetivo · {activeGoal.title}</p>}
                        </div>
                        <span className={"shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] " + (activeMission.status === 'waiting_approval' ? 'bg-amber-400/10 text-amber-300' : activeMission.status === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-sky-400/10 text-sky-300')}>
                          {activeMission.status === 'waiting_approval' ? 'aguardando você' : activeMission.status === 'completed' ? 'concluída' : 'em andamento'}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500"><span>{Math.round(missionProgress(activeMission))}% concluído</span><span>{Math.min(activeMission.current_step + 1, activeMission.total_steps)}/{activeMission.total_steps}</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: missionProgress(activeMission) + '%' }} /></div>
                      </div>
                      <div className="mt-5 space-y-2">
                        {steps.map((step, index) => {
                          const current = index === activeMission.current_step;
                          const done = step.status === 'completed' || index < activeMission.current_step;
                          return <div key={step.id} className={"flex items-start gap-3 rounded-xl px-2.5 py-2 " + (current ? 'bg-white/[0.035]' : '')}>
                            <div className="mt-0.5 shrink-0">{done ? <CheckCircle2 size={15} className="text-emerald-400" /> : current ? <Clock3 size={15} className={step.status === 'waiting_approval' ? 'text-amber-300' : 'text-sky-300'} /> : <Circle size={15} className="text-zinc-700" />}</div>
                            <div className="min-w-0 flex-1"><div className={"text-xs " + (done ? 'text-zinc-500' : current ? 'font-medium text-zinc-200' : 'text-zinc-600')}>{stepLabel[step.type] || step.title}</div>{current && step.output && <div className="mt-1 text-[10px] leading-4 text-zinc-500">{step.output}</div>}</div>
                          </div>;
                        })}
                      </div>
                      {activeMission.status !== 'waiting_approval' && activeMission.status !== 'completed' && <button type="button" disabled={!canMissionExecute || actionBusy === activeMission.id} onClick={() => void runMission(activeMission.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] py-2.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40">{actionBusy === activeMission.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{canMissionExecute ? 'Deixar o DOT avançar agora' : 'Execução interna ainda não autorizada'}</button>}
                    </section>
                  ) : (
                    <section className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.018] p-6 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/[0.07] text-sky-300"><Target size={20} /></div>
                      <h3 className="mt-4 text-sm font-semibold text-white">Ainda não estou cuidando de nada.</h3>
                      <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-5 text-zinc-600">Delegue um objetivo acima. A partir daí, o DOT acompanha a missão sem transformar isso em uma conversa.</p>
                    </section>
                  )}

                  {pendingApproval && <section className="rounded-[24px] border border-amber-300/15 bg-amber-300/[0.055] p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Clock3 size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[.15em] text-amber-300/80">Sua decisão</div>
                        <h3 className="mt-1 text-sm font-semibold text-white">O DOT preparou um próximo passo.</h3>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">Nada foi executado ainda. Revise e aprove quando quiser; aprovação e execução continuam separadas.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canApprove ? <button type="button" disabled={approvalBusy === pendingApproval.id} onClick={() => void approveAction(pendingApproval.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-3 py-2 text-[10px] font-semibold text-zinc-950 disabled:opacity-50">{approvalBusy === pendingApproval.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Aprovar</button> : <span className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-zinc-600">Aprovação reservada ao responsável.</span>}
                        </div>
                      </div>
                    </div>
                  </section>}

                  {actions.some((action) => action.status === 'approved') && <section className="rounded-[24px] border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><div className="text-[10px] font-semibold uppercase tracking-[.15em] text-emerald-300/80">Liberado</div><div className="mt-1 text-xs font-medium text-zinc-200">Existe uma ação aprovada pronta para o DOT.</div></div>
                      {actions.filter((action) => action.status === 'approved').slice(0, 1).map((action) => <button key={action.id} type="button" disabled={!canActionExecute || approvalBusy === action.id} onClick={() => void executeAction(action.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-semibold text-zinc-950 disabled:opacity-40">{approvalBusy === action.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}Executar</button>)}
                    </div>
                  </section>}

                  {(activeCases.length > 0 || pendingFollowups > 0) && <section className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-3"><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-600">Casos em foco</div><div className="mt-1 text-lg font-semibold text-white">{activeCases.length}</div><div className="text-[10px] text-zinc-600">tratativas internas</div></div>
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-3"><div className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-600">Acompanhamentos</div><div className="mt-1 text-lg font-semibold text-white">{pendingFollowups}</div><div className="text-[10px] text-zinc-600">pendentes</div></div>
                  </section>}

                  {missions.length > 1 && <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-3">
                    <div className="flex items-center justify-between"><div className="text-[10px] font-semibold uppercase tracking-[.15em] text-zinc-600">Outras missões</div><span className="text-[10px] text-zinc-700">{missions.length}</span></div>
                    <div className="mt-2 space-y-1">
                      {missions.slice(0, 5).map((mission) => <button key={mission.id} type="button" onClick={() => setSelectedMissionId(mission.id)} className={"flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition " + (selectedMissionId === mission.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]')}><span className="min-w-0 truncate text-[11px] text-zinc-400">{mission.title}</span><span className="shrink-0 text-[9px] text-zinc-600">{Math.round(missionProgress(mission))}%</span></button>)}
                    </div>
                  </section>}

                  <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015]">
                    <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600"><Settings2 size={13} />Controle do agente</span>
                      <ChevronDown size={14} className={"text-zinc-600 transition " + (settingsOpen ? 'rotate-180' : '')} />
                    </button>
                    {settingsOpen && <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/[0.06] p-2.5"><div className="text-[9px] uppercase tracking-[.12em] text-zinc-700">Execução</div><div className="mt-1 text-[10px] text-zinc-500">{canActionExecute ? 'Autorizada internamente' : 'Bloqueada'}</div></div>
                        <div className="rounded-xl border border-white/[0.06] p-2.5"><div className="text-[9px] uppercase tracking-[.12em] text-zinc-700">Integrações</div><div className="mt-1 text-[10px] text-zinc-500">{connectedIntegrations} conectadas</div></div>
                      </div>
                      <p className="mt-3 text-[10px] leading-4 text-zinc-700">O DOT não envia nada para fora automaticamente. Ações externas permanecem fora do gateway de execução.</p>
                    </div>}
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
