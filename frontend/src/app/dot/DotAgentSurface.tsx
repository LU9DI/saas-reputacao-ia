'use client';

import { useEffect, useState } from 'react';
import { Bot, X, Target, ShieldCheck, Play, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/apiFailover';

type Goal = {
  id: number;
  title: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  progress: number;
};

type DotStatus = { access: boolean; enabled: boolean; demo: boolean; plan?: string; plan_label?: string };
type Permission = { resource: string; action: string; granted: number };
type Integration = { provider: string; label: string; status: string };

export function DotAgentSurface() {
  const [status, setStatus] = useState<DotStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<{ goals: Goal[]; summary?: { active: number; attention: number } } | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState<string | null>(null);

  async function loadStatus() {
    try {
      const res = await apiFetch('/api/dot/status', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setStatus({
        access: Boolean(data.access),
        enabled: Boolean(data.enabled),
        demo: Boolean(data.demo),
        plan: data.plan,
        plan_label: data.plan_label,
      });
    } catch { /* DOT is non-blocking */ }
  }

  async function loadWorkspace() {
    try {
      const [workspaceRes, permissionRes] = await Promise.all([
        apiFetch('/api/dot/agent/workspace', { credentials: 'include' }),
        apiFetch('/api/dot/agent/permissions', { credentials: 'include' }),
      ]);
      if (workspaceRes.ok) {
        const data = await workspaceRes.json();
        if (data?.ok) setWorkspace({ goals: data.goals || [], summary: data.summary || { active: 0, attention: 0 } });
      }
      if (permissionRes.ok) {
        const data = await permissionRes.json();
        if (data?.ok) setPermissions(data.permissions || []);
      }
    } catch { /* panel remains usable */ }
  }

  async function loadIntegrations() {
    try {
      const res = await apiFetch('/api/dot/agent/integrations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) setIntegrations(data.integrations || []);
      }
    } catch { /* optional */ }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => {
    if (!status?.access || !status.enabled) return;
    void loadWorkspace();
    void loadIntegrations();
  }, [status?.access, status?.enabled]);

  async function createGoal() {
    const title = draft.trim();
    if (title.length < 3 || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/dot/agent/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, source: 'dot_global_agent' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.goal) {
        setWorkspace((current) => current ? { ...current, goals: [data.goal, ...current.goals] } : current);
        setDraft('');
      }
    } finally {
      setBusy(false);
    }
  }

  async function togglePermission(resource: string, action: string, granted: boolean) {
    const key = resource + ':' + action;
    setPermissionBusy(key);
    try {
      const res = await apiFetch('/api/dot/agent/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resource, action, granted }),
      });
      if (res.ok) await loadWorkspace();
    } finally {
      setPermissionBusy(null);
    }
  }

  if (!status?.access || !status.enabled) return null;

  const activeGoals = (workspace?.goals || []).filter((goal) => goal.status === 'active').slice(0, 3);
  const canExecute = permissions.some((p) => p.resource === 'operations' && p.action === 'execute' && Number(p.granted) === 1);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir DOT"
        data-testid="dot-agent-launcher"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[90] grid h-14 w-14 place-items-center rounded-full border border-sky-300/20 bg-sky-500 text-white shadow-2xl shadow-sky-950/40 transition hover:scale-105 hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
      >
        <Bot size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <button
            aria-label="Fechar DOT"
            onClick={() => setOpen(false)}
            className="pointer-events-auto absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="DOT, agente da empresa"
            data-testid="dot-agent-panel"
            className="pointer-events-auto absolute bottom-4 right-4 flex max-h-[calc(100vh-2rem)] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-500/15 text-sky-300"><Bot size={18} /></span>
                <div>
                  <div className="text-sm font-semibold text-white">DOT</div>
                  <div className="text-[10px] text-zinc-500">
                    agente da empresa · {status.demo ? 'ambiente local' : status.plan_label || status.plan || 'plano ativo'}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"><X size={17} /></button>
            </header>

            <div className="overflow-y-auto p-4">
              <div className="rounded-2xl border border-sky-400/10 bg-sky-500/[0.06] p-3">
                <div className="flex items-start gap-2">
                  <Target size={16} className="mt-0.5 text-sky-300" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-100">O que você quer que eu cuide?</div>
                    <div className="mt-1 text-[11px] leading-5 text-zinc-500">O DOT transforma o objetivo em missão, acompanha o progresso e para antes de qualquer ação que exija sua aprovação.</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    data-testid="dot-goal-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void createGoal(); }}
                    placeholder="Ex.: reduzir tempo de resposta"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-sky-300/30 focus:outline-none"
                  />
                  <button type="button" onClick={() => void createGoal()} disabled={busy || draft.trim().length < 3} className="rounded-xl bg-sky-500 px-3 text-xs font-semibold text-white disabled:opacity-40">
                    {busy ? <Loader2 size={15} className="animate-spin" /> : 'Cuidar'}
                  </button>
                </div>
              </div>

              <section className="mt-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.15em] text-zinc-600">Acompanhamento</div>
                {activeGoals.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.07] p-3 text-xs text-zinc-500">Nenhum objetivo ativo. Dê um objetivo ao DOT acima.</div>
                ) : (
                  <div className="space-y-2">
                    {activeGoals.map((goal) => (
                      <div key={goal.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-medium text-zinc-200">{goal.title}</span>
                          <span className="text-[10px] text-sky-300">{Math.round(goal.progress)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-sky-400/70" style={{ width: Math.max(0, Math.min(100, goal.progress)) + '%' }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-4 rounded-xl border border-white/[0.07] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><ShieldCheck size={15} className="text-emerald-300" /> Permissões</div>
                <p className="mt-1 text-[10px] leading-4 text-zinc-600">Leitura e execução são permissões separadas. Execução interna nunca é concedida automaticamente.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['read','execute'].map((action) => {
                    const granted = permissions.some((p) => p.resource === 'operations' && p.action === action && Number(p.granted) === 1);
                    const key = 'operations:' + action;
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={permissionBusy === key}
                        onClick={() => void togglePermission('operations', action, !granted)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] ${granted ? 'border-emerald-400/25 text-emerald-300' : 'border-white/10 text-zinc-500'} disabled:opacity-50`}
                      >
                        {action} {granted ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600">
                  <Play size={11} /> {canExecute ? 'Execução interna autorizada; ações externas continuam bloqueadas.' : 'Execução interna bloqueada até autorização explícita.'}
                </div>
                {integrations.length > 0 && <div className="mt-2 text-[10px] text-zinc-600">{integrations.filter((i) => i.status === 'connected').length} integrações conectadas. Uma integração conectada não significa autorização para ação externa.</div>}
              </section>

              {status.demo && <div className="mt-3 text-[10px] text-zinc-600">Protótipo local: dados demonstrativos. Nenhuma ação externa é executada.</div>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
