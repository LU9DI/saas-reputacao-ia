'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEnv } from '../../utils/env';

const TOKEN_KEY = 'admin_saas_token';
const apiUrl = () => getEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '');

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {}
  return h;
}

function fmtDt(s: string | null | undefined) {
  if (!s) return '—';
  try { return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
}

function StatusPill({ ok, label }: { ok: boolean | null; label?: string }) {
  const color = ok === true ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : ok === false ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40';
  const text = label || (ok === true ? 'OK' : ok === false ? 'Falha' : 'Sem dados');
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${color}`}><span className={`w-1.5 h-1.5 rounded-full ${ok === true ? 'bg-emerald-400' : ok === false ? 'bg-red-400' : 'bg-zinc-500'}`} />{text}</span>;
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';

function EventList({ eventos }: { eventos: any[] }) {
  if (!eventos?.length) return <p className="px-5 py-8 text-sm text-zinc-600 text-center">Nenhum evento registrado ainda.</p>;
  return <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/80">{eventos.map((e) => <div key={e.id} className="px-5 py-3 text-sm flex flex-wrap gap-x-3 gap-y-1"><StatusPill ok={e.status === 'ok' ? true : e.status === 'error' ? false : null} label={e.status} /><span className="font-mono text-xs text-zinc-300">{e.event_type || '—'}</span><span className="text-xs text-zinc-500">{e.detail || '—'}</span><span className="text-xs text-zinc-600 ml-auto">{fmtDt(e.created_at)}</span></div>)}</div>;
}

export default function AdminTecnicoPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [auto, setAuto] = useState(true);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const base = apiUrl();
      const headers = authHeaders();
      const me = await fetch(`${base}/api/admin/me`, { credentials: 'include', headers });
      if (!me.ok) {
        try { localStorage.removeItem(TOKEN_KEY); } catch {}
        router.replace('/admin/login');
        return;
      }
      const res = await fetch(`${base}/api/admin/tecnico`, { credentials: 'include', headers });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Erro ${res.status}`); }
      setData(await res.json());
    } catch (e: any) { setErro(e.message || 'Falha ao carregar'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (!auto) return; const id = setInterval(carregar, 15000); return () => clearInterval(id); }, [auto, carregar]);

  if (loading && !data) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">Carregando área técnica…</div>;

  const integrations = data?.integrations || data?.sistema || {};
  const events = Array.isArray(data?.events) ? data.events : [];
  const bySource = (source: string) => events.filter((e: any) => e.source === source);
  const health = data?.health24h || {};
  const n8nEvents = bySource('n8n');
  const paypalEvents = bySource('paypal');
  const mpEvents = bySource('mercadopago');
  const n8nOk = data?.n8n_ping?.ok ?? (n8nEvents.length ? health.n8n === true : null);
  const paypalOk = integrations.paypal === true;
  const mpOk = integrations.pix === true;
  const criticasItems = Array.isArray(data?.criticas) ? data.criticas : (data?.criticas_retidas?.items || []);
  const criticas = data?.criticas_retidas || { total: criticasItems.length, com_resposta_ia: criticasItems.filter((r: any) => !!r.ai_reply).length, sem_resposta_ia: criticasItems.filter((r: any) => !r.ai_reply).length, items: criticasItems };
  const retry = data?.retry || data?.retry_queue;
  const pdf = data?.pdf;
  const cards = [{ t: 'PayPal', ok: integrations.paypal }, { t: 'Pix (MP)', ok: integrations.pix }, { t: 'SMTP', ok: integrations.smtp }, { t: 'Groq IA', ok: integrations.groq }, { t: 'Jobs secret', ok: integrations.jobs_secret }];

  return <div className="min-h-screen bg-black text-zinc-100">
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10"><div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] uppercase tracking-wide text-zinc-500">Admin · Ops</p><h1 className="text-xl font-bold tracking-tight">Área técnica</h1><p className="text-xs text-zinc-500 mt-0.5">Integrações · Webhooks · Críticas · PDF · Retry</p></div><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs text-zinc-400 px-2"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />Auto 15s</label><button type="button" onClick={carregar} className="text-sm px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">Atualizar</button><Link href="/admin" className="text-sm px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">← Painel</Link></div></div></header>
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {erro && <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">{erro}</div>}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">{cards.map((x) => <div key={x.t} className={`${card} px-4 py-3 flex items-center justify-between`}><span className="text-sm text-zinc-400">{x.t}</span><StatusPill ok={x.ok === true} label={x.ok ? 'ON' : 'OFF'} /></div>)}</section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`${card} overflow-hidden`}><div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Webhook Pix (Mercado Pago)</h2><p className="text-xs text-zinc-500 mt-0.5">Configuração: {mpOk ? 'ativa' : 'inativa'}</p><p className="text-[11px] text-zinc-600 mt-1 font-mono">/api/webhook/mercadopago</p></div><StatusPill ok={mpOk} /></div><div className="px-5 py-3 text-xs text-zinc-500">24h: {health.pix?.ok ?? 0} ok / {health.pix?.errors ?? 0} erro · {mpEvents.length} eventos carregados</div><EventList eventos={mpEvents} /></div>
        <div className={`${card} overflow-hidden`}><div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Webhook n8n (Google Maps)</h2><p className="text-xs text-zinc-500 mt-0.5">{data?.n8n_ping?.detail || (integrations.n8n ? 'Configurado' : 'Não configurado')}</p><p className="text-[11px] text-zinc-600 mt-1 font-mono">/api/webhook/n8n</p></div><StatusPill ok={n8nOk} /></div><div className="px-5 py-3 text-xs text-zinc-500">24h: {health.n8n?.ok ?? 0} ok / {health.n8n?.errors ?? 0} erro · {n8nEvents.length} eventos carregados</div><EventList eventos={n8nEvents} /></div>
        <div className={`${card} overflow-hidden`}><div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Webhook PayPal</h2><p className="text-xs text-zinc-500 mt-0.5">Configuração: {paypalOk ? 'ativa' : 'inativa'}</p><p className="text-[11px] text-zinc-600 mt-1 font-mono">/api/webhook/paypal</p></div><StatusPill ok={paypalOk} /></div><div className="px-5 py-3 text-xs text-zinc-500">24h: {health.paypal?.ok ?? 0} ok / {health.paypal?.errors ?? 0} erro · {paypalEvents.length} eventos carregados</div><EventList eventos={paypalEvents} /></div>
      </section>
      {retry && <section className={`${card} px-5 py-4`}><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Fila de retry</h2><p className="text-xs text-zinc-500 mt-0.5">Jobs pendentes de PayPal, Pix e e-mail</p></div><StatusPill ok={(retry.pending_due || 0) === 0} label={(retry.pending_due || 0) > 0 ? `${retry.pending_due} prontos` : 'Em dia'} /></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">{Object.entries(retry.by_status || {}).map(([st, c]) => <span key={st} className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800">{st}: {String(c)}</span>)}{!Object.keys(retry.by_status || {}).length && <span className="text-zinc-600">Fila vazia</span>}</div></section>}
      <section className={`${card} overflow-hidden`}><div className="px-5 py-4 border-b border-zinc-800"><h2 className="text-sm font-semibold">Críticas retidas (auditoria IA)</h2><p className="text-xs text-zinc-500 mt-0.5">Notas 1–3★ · {criticas.total ?? 0} total · {criticas.com_resposta_ia ?? 0} com IA · {criticas.sem_resposta_ia ?? 0} sem IA</p></div>{criticasItems.length === 0 ? <p className="px-5 py-12 text-center text-sm text-zinc-600">Nenhuma crítica retida.</p> : <ul className="divide-y divide-zinc-800 max-h-[520px] overflow-y-auto">{criticasItems.map((r: any) => <li key={r.id} className="px-5 py-4"><div className="flex flex-wrap items-center gap-2 mb-1"><span className="text-sm font-medium text-zinc-200">{r.nome_empresa}</span><span className="text-[10px] uppercase text-zinc-500">{r.plan}</span><span className="text-amber-400 text-xs">{'★'.repeat(Number(r.rating) || 0)}</span><span className="text-xs text-zinc-600 ml-auto">{fmtDt(r.createdAt)}</span></div><p className="text-sm text-zinc-400"><span className="text-zinc-300">{r.name}</span>{r.comment ? ` — ${r.comment}` : ''}</p>{r.ai_reply ? <div className="mt-2 pl-3 border-l-2 border-indigo-500/40"><p className="text-[10px] uppercase text-zinc-500 mb-0.5">Resposta IA</p><p className="text-sm text-zinc-300">{r.ai_reply}</p></div> : <p className="text-xs text-amber-600/80 mt-2">Sem resposta IA</p>}</li>)}</ul>}</section>
      <section className={`${card} overflow-hidden`}><div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Status relatório PDF</h2><p className="text-xs text-zinc-500 mt-0.5">{pdf?.detalhe || 'Monitoramento do relatório'}</p></div><StatusPill ok={pdf?.ok ?? null} /></div><div className="px-5 py-3 text-xs text-zinc-500 flex flex-wrap gap-4"><span>24h: {pdf?.stats_24h?.ok ?? 0} ok / {pdf?.stats_24h?.errors ?? 0} erro / {pdf?.stats_24h?.forbidden ?? 0} bloqueado</span><span>Último: {pdf?.last_age || '—'}</span></div><EventList eventos={pdf?.logs || []} /></section>
    </main>
  </div>;
}
