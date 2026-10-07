'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ExternalLink, Link2, Loader2, RefreshCw, Search, ShieldCheck, Unplug } from 'lucide-react';
import { apiFetch } from '../../utils/apiFailover';

type Site = { siteUrl: string; permissionLevel: string; selected: boolean };
type Status = { connected: boolean; email: string | null; siteUrl: string | null; connectedAt?: string; updatedAt?: string };

export default function GoogleSearchConsolePage() {
  const [status, setStatus] = useState<Status>({ connected: false, email: null, siteUrl: null });
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/integrations/google-search-console/status', { credentials: 'include' });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Não foi possível consultar a integração.');
      setStatus(body);
      if (body.connected) await loadSites();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    setSitesLoading(true);
    try {
      const r = await apiFetch('/api/integrations/google-search-console/sites', { credentials: 'include' });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Não foi possível carregar as propriedades.');
      setSites(body.sites || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar propriedades Google.');
    } finally {
      setSitesLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, []);

  const selected = useMemo(() => sites.find((x) => x.selected)?.siteUrl || status.siteUrl || '', [sites, status.siteUrl]);

  const selectSite = async (siteUrl: string) => {
    setError('');
    try {
      const r = await apiFetch('/api/integrations/google-search-console/site', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Não foi possível selecionar a propriedade.');
      setStatus((s) => ({ ...s, siteUrl }));
      setSites((all) => all.map((x) => ({ ...x, selected: x.siteUrl === siteUrl })));
      setRows([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao selecionar propriedade.');
    }
  };

  const runQuery = async () => {
    if (!selected) return setError('Selecione uma propriedade antes de consultar.');
    setQueryLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/integrations/google-search-console/query', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: ['query', 'page'], rowLimit: 100 }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Falha na consulta.');
      setRows(body.rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na consulta ao Search Console.');
    } finally {
      setQueryLoading(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Desconectar o Google Search Console desta empresa?')) return;
    const r = await apiFetch('/api/integrations/google-search-console', { method: 'DELETE', credentials: 'include' });
    const body = await r.json();
    if (!r.ok) return setError(body.error || 'Não foi possível desconectar.');
    setStatus({ connected: false, email: null, siteUrl: null });
    setSites([]);
    setRows([]);
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-zinc-100">
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">Filtra.AI · Integrações</p>
            <h1 className="text-3xl font-semibold tracking-tight">Google Search Console</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Conecte sua conta Google diretamente ao Filtra.AI. O DOT poderá usar dados reais de busca para investigar oportunidades e acompanhar resultados.
            </p>
          </div>
          <a href="/painel" className="text-sm text-zinc-400 hover:text-white">Voltar ao painel</a>
        </div>

        {error && <div className="mb-5 rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 md:p-8">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm text-zinc-400"><Loader2 className="animate-spin" size={18} /> Carregando integração…</div>
          ) : !status.connected ? (
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-emerald-300"><ShieldCheck size={18} /> OAuth seguro · somente leitura</div>
                <h2 className="text-xl font-semibold">Conecte o Search Console sem intermediários</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  O Filtra.AI solicita apenas a permissão de leitura do Search Console. A credencial de renovação fica cifrada no banco por empresa e não é exposta ao navegador.
                </p>
              </div>
              <a href="/api/integrations/google-search-console/connect" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                <Link2 size={17} /> Conectar Google
              </a>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={18} /> Conectado</div>
                  <p className="mt-2 text-sm text-zinc-300">{status.email || 'Conta Google conectada'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void loadSites()} disabled={sitesLoading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50">
                    <RefreshCw size={15} className={sitesLoading ? 'animate-spin' : ''} /> Atualizar
                  </button>
                  <button onClick={() => void disconnect()} className="inline-flex items-center gap-2 rounded-xl border border-red-900/50 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30">
                    <Unplug size={15} /> Desconectar
                  </button>
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">Propriedade</span>
                  <select value={selected} onChange={(e) => void selectSite(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-sky-400/50">
                    <option value="">Selecione uma propriedade</option>
                    {sites.map((site) => <option key={site.siteUrl} value={site.siteUrl}>{site.siteUrl} · {site.permissionLevel}</option>)}
                  </select>
                </label>
                <div className="flex items-end">
                  <button onClick={() => void runQuery()} disabled={!selected || queryLoading} className="inline-flex h-[46px] items-center gap-2 rounded-2xl bg-sky-400 px-5 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50">
                    {queryLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Consultar
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-zinc-500">De<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200" /></label>
                <label className="text-xs text-zinc-500">Até<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200" /></label>
              </div>
            </div>
          )}
        </section>

        {rows.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5"><BarChart3 size={18} className="text-sky-300" /><h2 className="font-semibold">Desempenho de busca</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-6 py-3">Consulta</th><th className="px-6 py-3">Página</th><th className="px-6 py-3">Cliques</th><th className="px-6 py-3">Impressões</th><th className="px-6 py-3">CTR</th><th className="px-6 py-3">Posição</th></tr></thead>
                <tbody>{rows.map((row, i) => <tr key={`${row.keys?.join('|') || i}`} className="border-t border-white/5"><td className="px-6 py-3 text-zinc-200">{row.keys?.[0] || '—'}</td><td className="max-w-[320px] truncate px-6 py-3 text-zinc-400">{row.keys?.[1] || '—'}</td><td className="px-6 py-3">{Number(row.clicks || 0).toLocaleString('pt-BR')}</td><td className="px-6 py-3">{Number(row.impressions || 0).toLocaleString('pt-BR')}</td><td className="px-6 py-3">{Number(row.ctr || 0).toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 1 })}</td><td className="px-6 py-3">{Number(row.position || 0).toFixed(1)}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <span>Somente leitura</span><span>•</span><span>Isolamento por empresa</span><span>•</span><span>OAuth do Google</span>
          <a className="inline-flex items-center gap-1 hover:text-zinc-300" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Abrir Search Console <ExternalLink size={12} /></a>
        </div>
      </div>
    </main>
  );
}
