'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Bot, Check, CheckCircle2, Circle, Clock3, Loader2, RefreshCw, X,
} from 'lucide-react';
import { apiFetch } from '../utils/apiFailover';

type Goal = { id: number; title: string; description?: string; status: 'active' | 'paused' | 'completed' | 'archived'; progress: number };
type DotStatus = { access: boolean; enabled: boolean; demo: boolean; plan?: string; plan_label?: string };
type Permission = { resource: string; action: string; granted: number };
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

  const pendingFollowups = followups.filter((item) => item.status === 'pending').length;

  return (
    <>
      <button type="button" aria-label="Abrir DOT" data-testid="dot-agent-launcher" onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-[90] grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-[linear-gradient(145deg,#171b26,#090b10)] text-white shadow-[0_18px_55px_rgba(0,0,0,.48),0_0_0_1px_rgba(125,211,252,.05)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-sky-300/35 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
        <span className="relative grid h-7 w-7 place-items-center rounded-xl bg-sky-300/[.09] text-sky-200"><Bot size={17} strokeWidth={2} aria-hidden="true" /><span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[.06]" /></span>
        {hasAccess && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-400" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <button aria-label="Fechar DOT" onClick={() => setOpen(false)} className="pointer-events-auto absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
          <aside role="dialog" aria-modal="true" aria-label="DOT, agente da empresa" data-testid="dot-agent-panel"
            className="pointer-events-auto absolute bottom-4 right-4 flex max-h-[min(760px,calc(100vh-2rem))] w-[min(500px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[30px] border border-white/[.11] bg-[#080a0f]/[.98] shadow-[0_35px_120px_rgba(0,0,0,.72),0_0_0_1px_rgba(255,255,255,.02)] backdrop-blur-2xl">
            <header className="relative shrink-0 border-b border-white/[.07] bg-[radial-gradient(circle_at_15%_0%,rgba(125,211,252,.08),transparent_35%)] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(145deg,rgba(125,211,252,.14),rgba(255,255,255,.035))] text-sky-200 shadow-inner ring-1 ring-inset ring-white/[.08]"><Bot size={18} strokeWidth={2} /><span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0d12]" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight text-white">DOT</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] ${hasAccess ? 'bg-emerald-400/10 text-emerald-300' : 'bg-zinc-400/10 text-zinc-500'}`}>{hasAccess ? 'ativo' : 'bloqueado'}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">agente operacional · sempre no seu contexto</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {hasAccess && <button type="button" aria-label="Atualizar DOT" onClick={() => void loadWorkspace()} className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"><RefreshCw size={14} /></button>}
                  <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"><X size={16} /></button>
                </div>
              </div>
            </header>

            <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-5">
              {!hasAccess ? (
                <section className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-5">
                  <div className="text-xl font-semibold tracking-tight text-white">O DOT fica aqui.</div>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">Entre em uma conta autorizada para delegar objetivos ao agente. Nenhuma ação externa é executada automaticamente.</p>
                  <a href="/login" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200">Entrar <ArrowUpRight size={13} /></a>
                </section>
              ) : (
                <div className="space-y-3">
                  {error && <div role="alert" className="rounded-xl border border-rose-400/15 bg-rose-500/[.06] px-3 py-2.5 text-[11px] leading-4 text-rose-200">{error}</div>}

                  <section className="relative overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(125,211,252,.075),rgba(255,255,255,.02)_45%,rgba(255,255,255,.012))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-300/80">Delegar</div>
                        <h2 className="mt-1 max-w-[340px] text-[20px] font-semibold leading-tight tracking-[-.02em] text-white">O que você quer que eu cuide?</h2>
                      </div>
                      {workspace?.summary && <div className="text-right"><div className="text-lg font-semibold text-white">{workspace.summary.active}</div><div className="text-[9px] uppercase tracking-[.12em] text-zinc-600">ativas</div></div>}
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/[.09] bg-[#07090d]/70 p-1.5 shadow-inner">
                      <input data-testid="dot-goal-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createGoal(); }} placeholder="Ex.: descobrir por que minhas avaliações caíram" className="w-full bg-transparent px-2.5 py-2.5 text-[13px] text-white outline-none placeholder:text-zinc-700" />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden"><button type="button" onClick={() => setDraft(quickGoals[0])} className="max-w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[10px] text-zinc-500 transition hover:bg-white/[.04] hover:text-zinc-300">Sugestão: {quickGoals[0].toLowerCase()}</button></div>
                        <button type="button" onClick={() => void createGoal()} disabled={busy || draft.trim().length < 3} className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-[10px] font-semibold text-zinc-950 shadow-[0_6px_18px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:translate-y-0 disabled:opacity-35">{busy ? <Loader2 size={13} className="animate-spin" /> : 'Delegar'}</button>
                      </div>
                    </div>
                  </section>

                  {loading ? (
                    <section className="rounded-[22px] border border-white/[.07] bg-white/[.018] p-4 text-xs text-zinc-600">Reunindo o estado da empresa…</section>
                  ) : activeMission ? (
                    <section className="rounded-[26px] border border-white/[.08] bg-[#0b0e14] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-600">Missão atual</div><h3 className="mt-1 truncate text-[14px] font-semibold text-white">{activeMission.title}</h3></div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[.1em] ${activeMission.status === 'waiting_approval' ? 'bg-amber-400/10 text-amber-300' : activeMission.status === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-sky-400/10 text-sky-300'}`}>{activeMission.status === 'waiting_approval' ? 'sua decisão' : activeMission.status === 'completed' ? 'concluída' : 'trabalhando'}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: missionProgress(activeMission) + '%' }} /></div><span className="text-[9px] text-zinc-600">{Math.round(missionProgress(activeMission))}%</span></div>
                      <div className="mt-4 space-y-1.5">
                        {steps.map((step, index) => {
                          const current = index === activeMission.current_step;
                          const done = step.status === 'completed' || index < activeMission.current_step;
                          return <div key={step.id} className={`flex items-center gap-2.5 rounded-xl px-2 py-2 ${current ? 'bg-white/[.035]' : ''}`}>
                            {done ? <CheckCircle2 size={14} className="shrink-0 text-emerald-400" /> : current ? <Clock3 size={14} className={step.status === 'waiting_approval' ? 'shrink-0 text-amber-300' : 'shrink-0 text-sky-300'} /> : <Circle size={14} className="shrink-0 text-zinc-700" />}
                            <span className={`min-w-0 flex-1 text-[11px] ${done ? 'text-zinc-600' : current ? 'text-zinc-200' : 'text-zinc-700'}`}>{stepLabel[step.type] || step.title}</span>
                          </div>;
                        })}
                      </div>
                      {activeMission.status !== 'waiting_approval' && activeMission.status !== 'completed' && <button type="button" disabled={!canMissionExecute || actionBusy === activeMission.id} onClick={() => void runMission(activeMission.id)} className="mt-4 w-full rounded-xl border border-white/[.08] bg-white/[.035] py-2.5 text-[10px] font-semibold text-zinc-200 transition hover:bg-white/[.06] disabled:opacity-35">{actionBusy === activeMission.id ? 'Executando…' : canMissionExecute ? 'Avançar missão' : 'Aguardando autorização'}</button>}
                    </section>
                  ) : (
                    <section className="rounded-[24px] border border-dashed border-white/[.08] p-6 text-center">
                      <Bot className="mx-auto text-sky-300/60" size={26} strokeWidth={1.8} />
                      <div className="mt-2 text-sm font-semibold text-white">Nenhuma missão ativa</div>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-600">Delegue um objetivo acima e o DOT transforma isso em uma missão acompanhável.</p>
                    </section>
                  )}

                  {pendingApproval && <section className="rounded-[22px] border border-amber-300/15 bg-amber-300/[.05] p-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[.16em] text-amber-300/80">Sua decisão</div>
                    <div className="mt-1 text-sm font-semibold text-white">O próximo passo está pronto.</div>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">Nada foi executado. Sua aprovação libera a ação; execução continua separada.</p>
                    <div className="mt-3">{canApprove ? <button type="button" disabled={approvalBusy === pendingApproval.id} onClick={() => void approveAction(pendingApproval.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-3 py-2 text-[10px] font-semibold text-zinc-950">{approvalBusy === pendingApproval.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Aprovar</button> : <span className="text-[10px] text-zinc-600">Aprovação reservada ao responsável.</span>}</div>
                  </section>}

                  {actions.some((action) => action.status === 'approved') && <section className="rounded-[22px] border border-emerald-400/10 bg-emerald-400/[.035] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><div className="text-[9px] font-semibold uppercase tracking-[.16em] text-emerald-300/80">Liberado</div><div className="mt-1 text-[11px] text-zinc-300">Existe uma ação aprovada.</div></div>
                      {actions.filter((action) => action.status === 'approved').slice(0, 1).map((action) => <button key={action.id} type="button" disabled={!canActionExecute || approvalBusy === action.id} onClick={() => void executeAction(action.id)} className="shrink-0 rounded-xl bg-emerald-400 px-3 py-2 text-[10px] font-semibold text-zinc-950 disabled:opacity-35">{approvalBusy === action.id ? 'Executando…' : 'Executar'}</button>)}
                    </div>
                  </section>}

                  {(activeCases.length > 0 || pendingFollowups > 0) && <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-white/[.07] bg-white/[.018] p-3"><div className="text-[9px] uppercase tracking-[.14em] text-zinc-700">Casos em foco</div><div className="mt-1 text-lg font-semibold text-white">{activeCases.length}</div></div>
                    <div className="rounded-2xl border border-white/[.07] bg-white/[.018] p-3"><div className="text-[9px] uppercase tracking-[.14em] text-zinc-700">Acompanhamentos</div><div className="mt-1 text-lg font-semibold text-white">{pendingFollowups}</div></div>
                  </div>}

                  {missions.length > 1 && <section className="rounded-[22px] border border-white/[.07] bg-white/[.015] p-3">
                    <div className="flex items-center justify-between"><span className="text-[9px] font-semibold uppercase tracking-[.15em] text-zinc-700">Missões</span><span className="text-[9px] text-zinc-700">{missions.length}</span></div>
                    <div className="mt-2 space-y-1">{missions.slice(0, 4).map((mission) => <button key={mission.id} type="button" onClick={() => setSelectedMissionId(mission.id)} className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left ${selectedMissionId === mission.id ? 'bg-white/[.05]' : 'hover:bg-white/[.03]'}`}><span className="truncate text-[10px] text-zinc-500">{mission.title}</span><span className="text-[9px] text-zinc-700">{Math.round(missionProgress(mission))}%</span></button>)}</div>
                  </section>}

                  <details className="rounded-[20px] border border-white/[.07] bg-white/[.012]">
                    <summary className="cursor-pointer list-none px-4 py-3 text-[9px] font-semibold uppercase tracking-[.15em] text-zinc-700">Controle do agente</summary>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/[.06] px-4 py-3">
                      <div className="rounded-xl border border-white/[.06] p-2.5"><div className="text-[9px] text-zinc-700">Execução</div><div className="mt-1 text-[10px] text-zinc-500">{canActionExecute ? 'autorizada' : 'bloqueada'}</div></div>
                      <div className="rounded-xl border border-white/[.06] p-2.5"><div className="text-[9px] text-zinc-700">Escopo</div><div className="mt-1 text-[10px] text-zinc-500">isolado por empresa</div></div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
