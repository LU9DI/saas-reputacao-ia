'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock3, KeyRound, Lock, Play, RefreshCw, ShieldCheck, Target, Unlock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiFetch } from '../../utils/apiFailover';
import { BrandMark } from '../../components/BrandMark';

type DotData = {
  status: any;
  decisions: any[];
  actions: any[];
  cases: any[];
  followups: any[];
  events: any[];
  briefing: any;
};

function headers(): HeadersInit {
  const h: Record<string, string> = {};
  try {
    const token = localStorage.getItem('filtra_token');
    if (token) h.Authorization = `Bearer ${token}`;
  } catch {}
  // Operações administrativas do Dot exigem o cabeçalho canônico (anti-CSRF).
  h['X-Dot-Admin'] = '1';
  return h;
}

async function getJson(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, { credentials: 'include', ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Falha ${response.status}`);
  return body;
}

const pill = 'rounded-full border px-2.5 py-1 text-[11px] font-medium';
const panel = 'rounded-2xl border border-white/10 bg-white/2.5';

export default function DotPage() {
  const [data, setData] = useState<DotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminState, setAdminState] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetSenha, setResetSenha] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [status, decisions, actions, cases, followups, events, briefing, admin] = await Promise.all([
        getJson('/api/dot/status'),
        getJson('/api/dot/decisions'),
        getJson('/api/dot/actions'),
        getJson('/api/dot/cases'),
        getJson('/api/dot/followups'),
        getJson('/api/dot/events'),
        getJson('/api/dot/briefing'),
        // Estado administrativo: se indisponível (ex.: ordem de publicação
        // entre frontend e API), a página continua funcionando normalmente.
        getJson('/api/dot/admin/state').catch(() => null),
      ]);
      setData({
        status,
        decisions: decisions.decisions || [],
        actions: actions.actions || [],
        cases: cases.cases || [],
        followups: followups.followups || [],
        events: events.events || [],
        briefing,
      });
      setAdminState(admin);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar o Filtra Dot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do painel Dot (fetch)
    void load();
  }, [load]);

  const mutate = async (key: string, path: string, options: RequestInit = {}) => {
    setBusy(key);
    setNotice('');
    try {
      await getJson(path, options);
      setNotice('Operação concluída.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Operação não concluída.');
    } finally {
      setBusy(null);
    }
  };

  const runAdmin = async (path: string, options: RequestInit, successMessage: string) => {
    setAdminBusy(true);
    setError('');
    setNotice('');
    try {
      await getJson(path, options);
      setNotice(successMessage);
      setPinInput('');
      setResetPin('');
      setResetSenha('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Operação administrativa não concluída.');
    } finally {
      setAdminBusy(false);
    }
  };

  const pending = useMemo(() => data?.decisions.filter((d) => d.status === 'pending' || d.status === 'prepared').length || 0, [data]);
  const prepared = useMemo(() => data?.actions.filter((a) => a.status === 'prepared').length || 0, [data]);
  const approved = useMemo(() => data?.actions.filter((a) => a.status === 'approved').length || 0, [data]);
  const activeCases = useMemo(() => data?.cases.filter((c) => !['resolved', 'completed'].includes(String(c.status))).length || 0, [data]);

  if (loading && !data) {
    return <div className="min-h-screen bg-[#050507] text-zinc-400 flex items-center justify-center"><RefreshCw className="mr-2 animate-spin" size={16} /> Carregando Dot…</div>;
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050507]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BrandMark size="sm" href="/painel" subtitle="Filtra Dot" />
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="hidden sm:block">
              <div className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">Centro de execução</div>
              <div className="text-sm text-zinc-400">Decisões, aprovações e casos internos</div>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{error}</div>}
        {notice && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

        <section className={`${panel} p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-indigo-300"><Bot size={20} /><span className="text-sm font-semibold">Filtra Dot</span></div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{data?.briefing?.briefing?.headline || 'Centro de inteligência operacional'}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{data?.briefing?.briefing?.suggestedAction || 'O Dot observa sinais, cria decisões e prepara ações internas para aprovação humana.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`${pill} border-indigo-400/20 bg-indigo-400/5 text-indigo-200`}>{String(data?.status?.plan_label || data?.status?.plan || 'REI')}</span>
              <span className={`${pill} ${data?.status?.enabled ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200' : 'border-amber-400/20 bg-amber-400/5 text-amber-200'}`}>{data?.status?.enabled ? 'ATIVO' : 'DESLIGADO'}</span>
              <span className={`${pill} border-white/10 bg-white/3 text-zinc-400`}>aprovação humana obrigatória</span>
            </div>
          </div>
        </section>

        {adminState?.is_owner && (
          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-300"><KeyRound size={18} /><span className="text-sm font-semibold">Administração do Dot (PIN)</span></div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                  {adminState.pin_configured
                    ? 'O PIN protege a execução de ações aprovadas e operações administrativas do Dot. A sessão dura 30 minutos e vale apenas para a sua conta.'
                    : 'Defina o PIN administrativo da empresa: ele protege a execução de ações aprovadas e operações administrativas sensíveis.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {adminState.session_active ? (
                  <>
                    <span className={`${pill} border-emerald-400/20 bg-emerald-400/5 text-emerald-200`}>administração desbloqueada</span>
                    <button type="button" disabled={adminBusy} onClick={() => void runAdmin('/api/dot/admin/session', { method: 'DELETE' }, 'Administração bloqueada.')} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50">
                      <Lock size={13} /> Bloquear
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={pinInput}
                      onChange={(ev) => setPinInput(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="PIN de 6 dígitos"
                      className="w-40 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-hidden focus:border-indigo-400/40"
                    />
                    {adminState.pin_configured ? (
                      <button type="button" disabled={adminBusy || pinInput.length !== 6} onClick={() => void runAdmin('/api/dot/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinInput }) }, 'Administração desbloqueada por 30 minutos.')} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        <Unlock size={13} /> Desbloquear
                      </button>
                    ) : (
                      <button type="button" disabled={adminBusy || pinInput.length !== 6} onClick={() => void runAdmin('/api/dot/admin/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinInput }) }, 'PIN administrativo definido.')} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        <KeyRound size={13} /> Definir PIN
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {adminState.pin_configured && (
              <details className="mt-4 border-t border-white/5 pt-3">
                <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">Esqueci o PIN — redefinir com a senha da conta</summary>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input value={resetPin} onChange={(ev) => setResetPin(ev.target.value.replace(/\D/g, '').slice(0, 6))} type="password" inputMode="numeric" autoComplete="off" placeholder="Novo PIN (6 dígitos)" className="w-44 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-hidden focus:border-indigo-400/40" />
                  <input value={resetSenha} onChange={(ev) => setResetSenha(ev.target.value)} type="password" autoComplete="current-password" placeholder="Senha atual da conta" className="w-52 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-hidden focus:border-indigo-400/40" />
                  <button type="button" disabled={adminBusy || resetPin.length !== 6 || resetSenha.length < 4} onClick={() => void runAdmin('/api/dot/admin/pin/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: resetPin, senha: resetSenha }) }, 'PIN redefinido. As sessões anteriores foram encerradas.')} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50">
                    <KeyRound size={13} /> Redefinir PIN
                  </button>
                </div>
              </details>
            )}
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {([
            [pending, 'Decisões aguardando tratamento', AlertTriangle],
            [prepared, 'Ações preparadas', Target],
            [approved, 'Ações aprovadas', CheckCircle2],
            [activeCases, 'Casos internos ativos', ShieldCheck],
          ] as [unknown, string, LucideIcon][]).map(([value, label, Icon]) => (
            <div key={String(label)} className={`${panel} p-5`}>
              <Icon size={17} className="text-indigo-300" />
              <div className="mt-4 text-2xl font-semibold">{String(value)}</div>
              <div className="mt-1 text-xs text-zinc-500">{String(label)}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div><h2 className="font-semibold">Decisões</h2><p className="mt-1 text-xs text-zinc-500">O Dot explica o sinal e prepara opções; não executa sozinho.</p></div>
              <button type="button" disabled={busy === 'monitor'} onClick={() => void mutate('monitor', '/api/dot/monitor/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50">
                <Play size={13} /> Rodar monitor
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {!data?.decisions.length && <div className="px-5 py-8 text-sm text-zinc-500">Nenhuma decisão registrada ainda.</div>}
              {data?.decisions.slice(0, 12).map((d) => (
                <div key={String(d.id)} className="p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`${pill} border-white/10 bg-white/3 text-zinc-300`}>{String(d.priority || 'media').toUpperCase()}</span>
                        <span className="text-xs text-zinc-600">#{d.id}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{String(d.reason || 'Sinal detectado')}</h3>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{String(d.recommendation || '')}</p>
                    </div>
                    <span className="h-fit rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-500">{String(d.status || 'pending')}</span>
                  </div>
                  {Array.isArray(d.options) && <div className="mt-4 grid gap-2 sm:grid-cols-2">{d.options.map((option: any) => (
                    <button key={String(option.id)} type="button" disabled={busy === `prepare-${d.id}`} onClick={() => void mutate(`prepare-${d.id}`, `/api/dot/decisions/${d.id}/prepare-action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ optionId: option.id }) })} className="rounded-xl border border-white/10 bg-black/10 p-3 text-left hover:border-indigo-400/30 hover:bg-indigo-400/5 disabled:opacity-50">
                      <div className="text-xs font-semibold text-zinc-200">{String(option.title)}</div>
                      <div className="mt-1 text-[11px] leading-4 text-zinc-500">{String(option.description)}</div>
                    </button>
                  ))}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Fila de ações</h2><p className="mt-1 text-xs text-zinc-500">Preparar → aprovar → executar.</p></div>
            <div className="divide-y divide-white/5">
              {!data?.actions.length && <div className="px-5 py-8 text-sm text-zinc-500">A fila está vazia.</div>}
              {data?.actions.slice(0, 12).map((a) => (
                <div key={String(a.id)} className="p-5">
                  <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{String(a.action)}</div><div className="mt-1 text-xs text-zinc-600">Ação #{a.id}</div></div><span className={`${pill} border-white/10 bg-white/3 text-zinc-400`}>{String(a.status)}</span></div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.status === 'prepared' && <button type="button" disabled={busy === `approve-${a.id}`} onClick={() => void mutate(`approve-${a.id}`, `/api/dot/actions/${a.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={13}/> Aprovar</button>}
                    {a.status === 'approved' && <button type="button" disabled={busy === `run-${a.id}`} onClick={() => void mutate(`run-${a.id}`, `/api/dot/actions/${a.id}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"><Play size={13}/> Executar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Casos internos</h2><p className="mt-1 text-xs text-zinc-500">Execução interna rastreável, sem efeitos externos.</p></div>
            <div className="divide-y divide-white/5">
              {!data?.cases.length && <div className="px-5 py-8 text-sm text-zinc-500">Nenhum caso criado.</div>}
              {data?.cases.slice(0, 10).map((c) => <div key={String(c.id)} className="p-4"><div className="flex justify-between gap-3"><span className="text-sm font-medium">{String(c.summary)}</span><span className="text-[11px] text-zinc-600">{String(c.status)}</span></div><div className="mt-1 text-xs text-zinc-500">{String(c.next_step)}</div></div>)}
            </div>
          </div>
          <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Acompanhamentos</h2><p className="mt-1 text-xs text-zinc-500">O resultado da ação volta para o ciclo de decisão.</p></div>
            <div className="divide-y divide-white/5">
              {!data?.followups.length && <div className="px-5 py-8 text-sm text-zinc-500">Nenhum acompanhamento pendente.</div>}
              {data?.followups.slice(0, 10).map((f) => <div key={String(f.id)} className="p-4"><div className="flex items-center gap-2"><Clock3 size={14} className="text-amber-300"/><span className="text-sm">{String(f.status)}</span><span className="text-[11px] text-zinc-600">#{f.id}</span></div><div className="mt-1 text-xs text-zinc-500">Vencimento: {String(f.due_at || '—')}</div></div>)}
            </div>
          </div>
        </section>

        <section className={`${panel} overflow-hidden`}>
          <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Sinais recentes</h2></div>
          <div className="divide-y divide-white/5">
            {!data?.events.length && <div className="px-5 py-8 text-sm text-zinc-500">Nenhum sinal registrado.</div>}
            {data?.events.slice(0, 12).map((e) => (
              <div key={String(e.id)} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="text-sm font-medium">{String(e.title)}</div><div className="mt-1 text-xs text-zinc-500">{String(e.details)}</div></div>
                <span className={`${pill} ${e.severity === 'critical' ? 'border-red-400/20 bg-red-400/5 text-red-200' : 'border-amber-400/20 bg-amber-400/5 text-amber-200'}`}>{String(e.severity)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-2 text-xs text-zinc-600"><ShieldCheck size={14}/> Governança ativa: aprovação explícita e efeitos externos bloqueados por padrão.</div>
      </main>
    </div>
  );
}
