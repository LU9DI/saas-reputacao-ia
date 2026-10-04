'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFailover';

type Goal = {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  progress: number;
  last_activity_at?: string | null;
};

type Workspace = {
  goals: Goal[];
  summary: { active: number; paused: number; completed: number; attention: number };
};
type Mission = {
  id: number;
  goal_id: number;
  title: string;
  status: 'planned' | 'working' | 'waiting_approval' | 'completed' | 'paused';
  current_step: number;
  total_steps: number;
};
type MissionStep = {
  id: number;
  type: 'observe' | 'investigate' | 'recommend' | 'prepare' | 'approval' | 'result';
  status: 'pending' | 'working' | 'completed' | 'waiting_approval';
  title: string;
  output?: string | null;
};

export function DotAgentSurface() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [missionBusy, setMissionBusy] = useState<number | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [steps, setSteps] = useState<Record<number, MissionStep[]>>({});

  async function load() {
    try {
      const res = await apiFetch('/api/dot/agent/workspace', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) setWorkspace({ goals: data.goals || [], summary: data.summary || { active: 0, paused: 0, completed: 0, attention: 0 } });
    } catch {
      /* agent surface is optional and must never block the DOT */
    }
  }

  async function loadMissions() {
    try {
      const res = await apiFetch('/api/dot/agent/missions', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) {
        const nextMissions: Mission[] = data.missions || [];
        setMissions(nextMissions);
        await Promise.all(nextMissions.slice(0, 4).map(async (mission) => {
          const stepRes = await apiFetch(`/api/dot/agent/missions/${mission.id}/steps`, { credentials: 'include' });
          if (!stepRes.ok) return;
          const stepData = await stepRes.json();
          if (stepData?.ok) setSteps((current) => ({ ...current, [mission.id]: stepData.steps || [] }));
        }));
      }
    } catch { /* mission surface is optional */ }
  }

  useEffect(() => {
    void load();
    void loadMissions();
  }, []);

  async function startMission(goal: Goal) {
    if (missionBusy) return;
    setMissionBusy(goal.id);
    try {
      const res = await apiFetch('/api/dot/agent/missions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ goal_id: goal.id, title: goal.title }) });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.mission) {
          setMissions((current) => [data.mission, ...current.filter((item) => item.id !== data.mission.id)]);
          const stepRes = await apiFetch(`/api/dot/agent/missions/${data.mission.id}/steps`, { credentials: 'include' });
          if (stepRes.ok) {
            const stepData = await stepRes.json();
            if (stepData?.ok) setSteps((current) => ({ ...current, [data.mission.id]: stepData.steps || [] }));
          }
        }
      }
    } finally { setMissionBusy(null); }
  }

  async function createGoal() {
    const title = draft.trim();
    if (title.length < 3 || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/dot/agent/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, source: 'dot_surface' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.goal) {
        setWorkspace((current) => current ? { ...current, goals: [data.goal, ...current.goals], summary: { ...current.summary, active: current.summary.active + 1 } } : current);
        setDraft('');
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!workspace) return null;

  const activeGoals = workspace.goals.filter((goal) => goal.status === 'active').slice(0, 4);

  return (
    <section className="mb-4 rounded-[20px] border border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500/10 text-sky-300">●</span>
            <div>
              <div className="text-xs font-semibold text-zinc-200">DOT · agente da empresa</div>
              <div className="text-[11px] text-zinc-500">
                {workspace.summary.active} objetivo{workspace.summary.active === 1 ? '' : 's'} em acompanhamento
                {workspace.summary.attention > 0 ? ` · ${workspace.summary.attention} precisa${workspace.summary.attention === 1 ? '' : 'm'} de atenção` : ''}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.04]"
        >
          {open ? 'Fechar' : 'Dar um objetivo'}
        </button>
      </div>

      {activeGoals.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {activeGoals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => void startMission(goal)}
              className="min-w-0 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-left hover:border-sky-300/20"
            >
              <div className="truncate text-xs font-medium text-zinc-200">{goal.title}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-sky-400/70" style={{ width: goal.progress + '%' }} />
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">{missionBusy === goal.id ? 'DOT preparando missão…' : `${goal.progress}% · DOT acompanhando`}</div>
            </button>
          ))}
        </div>
      )}

      {missions.filter((mission) => mission.status !== 'completed').slice(0, 2).map((mission) => {
        const missionSteps = steps[mission.id] || [];
        const activeStep = missionSteps.find((step) => step.status === 'working' || step.status === 'waiting_approval') || missionSteps[mission.current_step - 1];
        return (
          <div key={mission.id} className="mt-3 rounded-xl border border-white/[0.07] bg-black/15 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Missão ativa</div>
                <div className="mt-1 truncate text-xs font-medium text-zinc-200">{mission.title}</div>
              </div>
              <span className="text-[10px] text-sky-300">{mission.status === 'waiting_approval' ? 'aguardando você' : 'DOT trabalhando'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missionSteps.map((step) => (
                <span key={step.id} className={`rounded-full border px-2 py-1 text-[10px] ${step.status === 'completed' ? 'border-emerald-400/20 text-emerald-300' : step.status === 'waiting_approval' ? 'border-amber-400/20 text-amber-300' : step.status === 'working' ? 'border-sky-400/20 text-sky-300' : 'border-white/[0.07] text-zinc-600'}`}>
                  {step.title}
                </span>
              ))}
            </div>
            {activeStep && <div className="mt-2 text-[11px] text-zinc-500">{activeStep.title}{activeStep.output ? ` · ${activeStep.output}` : ''}</div>}
            {activeStep && mission.status !== 'waiting_approval' && (
              <button
                type="button"
                disabled={missionBusy === mission.id}
                onClick={async () => {
                  setMissionBusy(mission.id);
                  try {
                    const res = await apiFetch(`/api/dot/agent/missions/${mission.id}/run-step`, {
                      method: 'POST',
                      credentials: 'include',
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data?.ok) {
                      await loadMissions();
                    }
                  } finally {
                    setMissionBusy(null);
                  }
                }}
                className="mt-3 rounded-lg border border-sky-400/20 px-3 py-1.5 text-[10px] text-sky-300 disabled:opacity-50"
              >
                {missionBusy === mission.id ? 'DOT trabalhando…' : 'Executar próxima etapa'}
              </button>
            )}
          </div>
        );
      })}

      {open && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="text-xs font-medium text-zinc-300">O que você quer que o DOT cuide?</div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void createGoal(); }}
              placeholder="Ex.: aumentar vendas, reduzir custos, melhorar atendimento..."
              className="min-h-10 flex-1 rounded-xl border border-white/10 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-400/40 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              disabled={busy || draft.trim().length < 3}
              onClick={() => void createGoal()}
              className="min-h-10 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              {busy ? 'Preparando…' : 'Começar'}
            </button>
          </div>
          <div className="mt-2 text-[10px] text-zinc-600">
            O objetivo fica persistente. Nesta primeira etapa, o DOT registra e acompanha a missão; ações externas continuam sujeitas a integração e aprovação.
          </div>
        </div>
      )}
    </section>
  );
}
