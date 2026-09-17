'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';

type Review = { rating?: unknown; comment?: unknown; sentiment?: unknown; ai_tags?: unknown; createdAt?: unknown; created_at?: unknown; is_test?: unknown };
type PanelData = { empresa?: Record<string, unknown>; metricas?: Record<string, unknown>; reviews?: Review[] };
type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  mesReport: string;
  langReport: string;
  mesesOpcoes: string[];
  labelMes: (m: string) => string;
  onMesChange: (m: string) => void;
  onLangChange: (l: string) => void;
  language: string;
  panelData?: PanelData | null;
};

function n(value: unknown, fallback = 0) { const x = Number(value); return Number.isFinite(x) ? x : fallback; }
function rating(value: unknown) { const x = n(value, NaN); return Number.isFinite(x) && x >= 1 && x <= 5 ? x : null; }
function dateOf(r: Review) { return String(r.createdAt ?? r.created_at ?? '').trim(); }
function sentimentOf(value: unknown): 'positivo' | 'neutro' | 'negativo' | null {
  const s = String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('pos')) return 'positivo'; if (s.includes('neg')) return 'negativo'; if (s.includes('neu')) return 'neutro'; return null;
}
function addMonths(base: Date, amount: number) { const d = new Date(base); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + amount); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return d; }
function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function cycleFor(createdRaw: unknown, now = new Date()) {
  const created = new Date(String(createdRaw || ''));
  if (!Number.isFinite(created.getTime())) return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  let k = Math.max(0, (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth());
  let start = addMonths(created, k);
  if (start > now) { k--; start = addMonths(created, k); }
  let end = addMonths(created, k + 1);
  if (end <= now) { k++; start = end; end = addMonths(created, k + 1); }
  return { start, end };
}
function cycleKey(start: Date, end: Date) { return `${isoDay(start)}|${isoDay(end)}`; }
function parseCycle(key: string) { const [a, b] = key.split('|'); return { start: a, end: b }; }
function fmtCycle(key: string, locale: string) { const { start, end } = parseCycle(key); const a = new Date(`${start}T00:00:00`); const b = new Date(`${end}T00:00:00`); b.setDate(b.getDate() - 1); return `${a.toLocaleDateString(locale)} – ${b.toLocaleDateString(locale)}`; }
function safeName(value: unknown) { const x = String(value ?? 'empresa').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase(); return x || 'empresa'; }
function pct(v: number, total: number) { return total ? Math.round(v / total * 100) : 0; }

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, mesReport, langReport, onMesChange, onLangChange, language, panelData }: Props) {
  const [fallbackPanel, setFallbackPanel] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(!panelData);
  const [downloading, setDownloading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');

  useEffect(() => {
    if (panelData) { setFallbackPanel(null); setLoading(false); return; }
    let cancelled = false;
    const key = `filtra:painel:${empresaId}`;
    let cached: PanelData | null = null;
    try { const raw = sessionStorage.getItem(key); cached = raw ? JSON.parse(raw) : null; } catch { /* cache opcional */ }
    if (cached && !cancelled) { setFallbackPanel(cached); setLoading(false); }
    (async () => {
      try {
        const res = await fetch(`${api}/api/empresa/${encodeURIComponent(empresaId)}/painel`, { credentials: 'include', headers: authHeaders(false), cache: 'no-store' });
        if (!res.ok) return;
        const fresh = await res.json();
        if (cancelled || !fresh || typeof fresh !== 'object') return;
        setFallbackPanel(fresh as PanelData); setLoading(false);
        try { sessionStorage.setItem(key, JSON.stringify(fresh)); } catch { /* */ }
      } catch { if (!cancelled && !cached) setLoading(false); }
    })();
    return () => { cancelled = true; };
    // authHeaders is recreated by parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, api, panelData]);

  const source = panelData ?? fallbackPanel;
  const empresa = source?.empresa ?? {};
  const metricas = source?.metricas ?? {};
  const reviews = useMemo(() => Array.isArray(source?.reviews) ? source!.reviews!.filter(r => r && r.is_test !== true && r.is_test !== 'true') : [], [source?.reviews]);
  const signup = empresa.criado_em ?? empresa.criadoEm ?? empresa.created_at ?? empresa.createdAt;

  const cycleOptions = useMemo(() => {
    const created = new Date(String(signup || ''));
    if (!Number.isFinite(created.getTime())) { const c = cycleFor(null); return [cycleKey(c.start, c.end)]; }
    const current = cycleFor(signup);
    const out: string[] = [];
    let start = current.start;
    for (let i = 0; i < 18; i++) { const end = addMonths(start, 1); out.push(cycleKey(start, end)); start = addMonths(start, -1); }
    return out;
  }, [signup]);

  const defaultCycle = cycleOptions[0] || '';
  const activeCycle = cycleOptions.includes(selectedCycle) ? selectedCycle : defaultCycle;
  useEffect(() => { if (defaultCycle && !cycleOptions.includes(selectedCycle)) setSelectedCycle(defaultCycle); }, [defaultCycle, cycleOptions, selectedCycle]);
  useEffect(() => { if (activeCycle) onMesChange(activeCycle); }, [activeCycle, onMesChange]);

  const { start, end } = parseCycle(activeCycle || defaultCycle || `${isoDay(new Date())}|${isoDay(addMonths(new Date(), 1))}`);
  const cycleReviews = useMemo(() => {
    const a = new Date(`${start}T00:00:00`).getTime(); const b = new Date(`${end}T00:00:00`).getTime();
    return reviews.filter(r => { const t = new Date(dateOf(r)).getTime(); return Number.isFinite(t) && t >= a && t < b; });
  }, [reviews, start, end]);

  const stats = useMemo(() => {
    let total = 0, positive = 0, critical = 0, sum = 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    const tagCounts: Record<string, number> = {};
    for (const r of cycleReviews) {
      const x = rating(r.rating);
      if (x !== null) { total++; sum += x; if (x >= 4) positive++; if (x <= 3) critical++; }
      const s = sentimentOf(r.sentiment); const fallback = x === null ? null : x >= 4 ? 'positivo' : x <= 2 ? 'negativo' : 'neutro';
      const finalS = s || fallback; if (finalS) sentiment[finalS]++;
      const tags = Array.isArray(r.ai_tags) ? r.ai_tags : [];
      for (const raw of tags) { const tag = String(raw || '').trim(); if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1; }
    }
    const themes = Object.entries(tagCounts).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,6).map(([name,count]) => ({name,count}));
    const dist = [0,0,0,0,0]; for (const r of cycleReviews) { const x = rating(r.rating); if (x !== null) dist[x-1]++; }
    return { total, positive, critical, average: total ? Math.round(sum / total * 10) / 10 : 0, sentiment, themes, dist };
  }, [cycleReviews]);

  const trend = useMemo(() => {
    const raw = Array.isArray(metricas.serie_14d) ? metricas.serie_14d : [];
    const points = raw.map((p:any) => n(p?.media, NaN)).filter(Number.isFinite);
    if (points.length < 2) return null; return Math.round((points[points.length-1] - points[0]) * 10) / 10;
  }, [metricas.serie_14d]);

  const recommendations = useMemo(() => {
    if (!stats.total) return ['Não há avaliações válidas neste ciclo para gerar recomendações específicas.'];
    const out: string[] = [];
    if (stats.critical > stats.positive) out.push('Priorize o tratamento das avaliações de até 3 estrelas e os motivos recorrentes.');
    if (stats.average < 4) out.push('Analise as causas das notas baixas e transforme os principais problemas em ações operacionais.');
    if (stats.sentiment.negativo > stats.sentiment.positivo) out.push('Acompanhe o sentimento negativo no próximo ciclo para verificar se o padrão persiste.');
    if (stats.themes.length) out.push(`Monitore o tema “${stats.themes[0].name}”, o mais recorrente no ciclo.`);
    if (!out.length) out.push('Mantenha os padrões que estão gerando avaliações positivas e continue acompanhando a evolução.');
    return out.slice(0,4);
  }, [stats]);

  const downloadPdf = async () => {
    if (downloading || !start || !end) return;
    setDownloading(true);
    try {
      const res = await fetch(`${api}/api/empresa/${encodeURIComponent(empresaId)}/relatorio-inteligente.pdf?inicio=${encodeURIComponent(start)}&fim=${encodeURIComponent(end)}&lang=${encodeURIComponent(langReport || language || 'pt')}`, { credentials: 'include', headers: authHeaders(false) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(String(data?.error || `Erro ${res.status}`)); }
      const blob = await res.blob(); if (!blob.size) throw new Error('O servidor retornou um PDF vazio.');
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `relatorio-inteligente-${safeName(empresa.nome_empresa)}-${start}.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: unknown) { console.error('[relatorio-inteligente] PDF:', e); window.alert(e instanceof Error ? e.message : 'Não foi possível gerar o PDF.'); }
    finally { setDownloading(false); }
  };

  if (loading && !source) return <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 text-sm text-zinc-500">Carregando Relatório Inteligente…</section>;
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'zh' ? 'zh-CN' : 'pt-BR';
  const cycleLabel = fmtCycle(activeCycle || defaultCycle, locale);
  const trendLabel = trend === null ? 'Estável' : trend > 0 ? 'Em melhora' : trend < 0 ? 'Em atenção' : 'Estável';

  return <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6" aria-labelledby="relatorio-inteligente-title">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div><div className="flex items-center gap-2"><FileText size={18} className="text-indigo-400"/><h2 id="relatorio-inteligente-title" className="text-base font-semibold text-zinc-100">Relatório Inteligente</h2></div><p className="text-xs text-zinc-500 mt-1 max-w-2xl">1 relatório por ciclo de assinatura, usando os dados e cache do próprio painel.</p></div>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={activeCycle} onChange={e => { setSelectedCycle(e.target.value); onMesChange(e.target.value); }} className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950" aria-label="Ciclo do relatório">{cycleOptions.map(k => <option key={k} value={k}>{fmtCycle(k, locale)}</option>)}</select>
        <select value={langReport} onChange={e => onLangChange(e.target.value)} className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950" aria-label="Idioma do relatório"><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option><option value="zh">ZH</option></select>
        <button type="button" onClick={downloadPdf} disabled={downloading} className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"><Download size={16}/>{downloading ? 'Gerando…' : 'Exportar PDF'}</button>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[["Nota média", stats.average ? stats.average.toFixed(1) : '—'], ["Avaliações", stats.total], ["Positivas", `${pct(stats.positive, stats.total)}%`], ["Críticas", `${pct(stats.critical, stats.total)}%`]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"><p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value}</p></div>)}</div>

    <div className="grid lg:grid-cols-2 gap-4"><div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-indigo-400"/><h3 className="text-sm font-semibold">Evolução</h3></div><p className="text-sm text-zinc-300"><strong>{trendLabel}</strong>{trend === null ? ' — dados insuficientes para comparar.' : ` — variação de ${trend > 0 ? '+' : ''}${trend.toFixed(1)} ponto(s).`}</p></div><div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><h3 className="text-sm font-semibold mb-3">Sentimento</h3><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-emerald-400">Positivo</p><p className="text-xl font-bold">{stats.sentiment.positivo}</p></div><div><p className="text-xs text-amber-300">Neutro</p><p className="text-xl font-bold">{stats.sentiment.neutro}</p></div><div><p className="text-xs text-red-400">Negativo</p><p className="text-xl font-bold">{stats.sentiment.negativo}</p></div></div></div></div>

    <div className="grid lg:grid-cols-2 gap-4"><div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><CheckCircle2 size={16} className="text-emerald-400"/><h3 className="text-sm font-semibold">Principais pontos positivos</h3></div>{stats.positive ? <ul className="space-y-2 text-sm text-zinc-300"><li>• {stats.positive} avaliação(ões) com 4 ou 5 estrelas.</li>{stats.themes.slice(0,3).map(x => <li key={x.name}>• Tema recorrente: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}</ul> : <p className="text-sm text-zinc-500">Nenhum ponto positivo identificado neste ciclo.</p>}</div><div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-400"/><h3 className="text-sm font-semibold">Principais pontos de atenção</h3></div>{stats.critical ? <ul className="space-y-2 text-sm text-zinc-300"><li>• {stats.critical} avaliação(ões) com até 3 estrelas.</li>{stats.themes.slice(0,3).map(x => <li key={x.name}>• Acompanhar: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}</ul> : <p className="text-sm text-zinc-500">Nenhuma avaliação crítica identificada neste ciclo.</p>}</div></div>

    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5"><div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-indigo-300"/><h3 className="text-sm font-semibold">Recomendações</h3></div><ul className="space-y-2 text-sm text-zinc-300">{recommendations.map(r => <li key={r}>• {r}</li>)}</ul></div>
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">Relatório referente ao ciclo <span className="text-zinc-300">{cycleLabel}</span>. O download do PDF é ilimitado e usa o PDF armazenado em cache após a primeira geração.</div>
  </section>;
}
