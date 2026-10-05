'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, X, ChevronRight, Activity, Circle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { apiFetch } from './utils/apiFailover';

type Goal = { id: number; title: string; status: string; progress: number };
type Mission = { id: number; title: string; status: string; current_step: number; total_steps: number };

function contextLabel(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') return 'seu painel';
  if (pathname.includes('/empresa')) return 'esta empresa';
  if (pathname.includes('/contato') || pathname.includes('/contacts')) return 'este contato';
  if (pathname.includes('/deal') || pathname.includes('/negocio')) return 'este negócio';
  if (pathname.includes('/avali') || pathname.includes('/review')) return 'estas avaliações';
  return 'esta área';
}

export function DotGlobalSurface() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [attention, setAttention] = useState(0);

  const context = useMemo(() => contextLabel(pathname), [pathname]);

  async function refresh() {
    try {
      const [workspaceRes, missionsRes] = await Promise.all([
        apiFetch('/api/dot/agent/workspace', { credentials: 'include' }),
        apiFetch('/api/dot/agent/missions', { credentials: 'include' }),
      ]);
      if (workspaceRes.ok) {
        const data = await workspaceRes.json();
        if (data?.ok) {
          setGoals((data.goals || []).slice(0, 3));
          setAttention(Number(data.summary?.attention || 0));
        }
      }
      if (missionsRes.ok) {
        const data = await missionsRes.json();
        if (data?.ok) setMissions((data.missions || []).filter((m: Mission) => m.status !== 'completed').slice(0, 3));
      }
    } catch {
      // The global surface must never block the application.
    }
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir DOT"
        title="DOT"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-zinc-950/95 text-white shadow-[0_12px_40px_rgba(0,0,0,.45)] backdrop-blur transition hover:scale-105 hover:border-indigo-400/50 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
      >
        <Bot size={21} strokeWidth={1.8} />
        {(attention > 0 || missions.length > 0) && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full border border-zinc-950 bg-indigo-500 px-1 text-[9px] font-bold text-white">
            {Math.min(9, Math.max(attention, missions.length))}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Fechar DOT"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-white/10 bg-zinc-950/98 shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500/15 text-indigo-300">
                  <Bot size={19} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">DOT</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Circle size={7} className="fill-emerald-400 text-emerald-400" />
                    trabalhando em segundo plano
                  </div>
                </div>
              </div>
              <button type="button" aria-label="Fechar DOT" onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.06] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-300/70">Contexto atual</div>
                <div className="mt-2 text-base font-semibold text-white">Estou acompanhando {context}.</div>
                <div className="mt-1 text-xs leading-5 text-zinc-400">
                  Você não precisa abrir uma página do DOT. Ele continua observando, investigando e acompanhando as missões enquanto você trabalha.
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">
                  <Activity size={12} /> O que o DOT está fazendo
                </div>

                {missions.length > 0 ? missions.map((mission) => (
                  <div key={mission.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white">{mission.title}</div>
                        <div className="mt-1 text-[10px] text-zinc-500">
                          {mission.status === 'waiting_approval' ? 'Aguardando sua aprovação' : 'DOT trabalhando automaticamente'}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-300">
                        etapa {mission.current_step}/{mission.total_steps}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="text-xs font-medium text-white">Nenhuma missão aguardando atenção</div>
                    <div className="mt-1 text-[11px] leading-5 text-zinc-500">O DOT continua monitorando e inicia novas investigações quando encontrar um sinal relevante.</div>
                  </div>
                )}

                {goals.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">Objetivos em acompanhamento</div>
                    <div className="mt-3 space-y-3">
                      {goals.map((goal) => (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs text-zinc-300">{goal.title}</span>
                            <span className="text-[10px] text-zinc-600">{goal.progress}%</span>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-indigo-400/70" style={{ width: Math.max(0, Math.min(100, goal.progress)) + '%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-white/10 p-4">
              <a
                href="/dot"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]"
              >
                Abrir centro de supervisão <ChevronRight size={14} />
              </a>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
