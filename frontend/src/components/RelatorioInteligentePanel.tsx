'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import { useLanguage } from '../app/Contexts/LanguageContext';

type Review = { rating?: unknown; comment?: unknown; sentiment?: unknown; ai_tags?: unknown; createdAt?: unknown; created_at?: unknown; is_test?: unknown };
type PanelData = { empresa?: Record<string, unknown>; metricas?: Record<string, unknown>; reviews?: Review[] };
type Props = { empresaId: string; api: string; authHeaders: (json?: boolean) => HeadersInit; panelData?: PanelData | null };
type Lang = 'pt' | 'en' | 'es' | 'zh';

const TEXT: Record<Lang, Record<string, string>> = {
  pt: { title:'Relatório Inteligente', desc:'Análise atualizada automaticamente conforme novas avaliações entram no painel.', avg:'Nota média', reviews:'Avaliações', positive:'Positivas', critical:'Críticas', evolution:'Evolução', improving:'Em melhora', attention:'Em atenção', stable:'Estável', insufficient:'dados insuficientes para comparar.', sentiment:'Sentimento', pos:'Positivo', neu:'Neutro', neg:'Negativo', good:'Principais pontos positivos', issues:'Principais pontos de atenção', recommendations:'Recomendações', noData:'Ainda não há avaliações válidas para analisar.', updated:'Atualizado com os dados do painel' },
  en: { title:'Intelligent Report', desc:'Analysis updates automatically as new reviews enter the dashboard.', avg:'Average rating', reviews:'Reviews', positive:'Positive', critical:'Critical', evolution:'Evolution', improving:'Improving', attention:'Needs attention', stable:'Stable', insufficient:'insufficient data for comparison.', sentiment:'Sentiment', pos:'Positive', neu:'Neutral', neg:'Negative', good:'Main positive points', issues:'Main points of attention', recommendations:'Recommendations', noData:'There are no valid reviews to analyze yet.', updated:'Updated with dashboard data' },
  es: { title:'Informe Inteligente', desc:'El análisis se actualiza automáticamente cuando entran nuevas reseñas.', avg:'Calificación media', reviews:'Reseñas', positive:'Positivas', critical:'Críticas', evolution:'Evolución', improving:'En mejora', attention:'En atención', stable:'Estable', insufficient:'datos insuficientes para comparar.', sentiment:'Sentimiento', pos:'Positivo', neu:'Neutral', neg:'Negativo', good:'Principales puntos positivos', issues:'Principales puntos de atención', recommendations:'Recomendaciones', noData:'Todavía no hay reseñas válidas para analizar.', updated:'Actualizado con los datos del panel' },
  zh: { title:'智能报告', desc:'随着新评价进入面板，分析会自动更新。', avg:'平均评分', reviews:'评价', positive:'好评', critical:'需关注', evolution:'趋势', improving:'改善中', attention:'需关注', stable:'稳定', insufficient:'数据不足，无法比较。', sentiment:'情绪', pos:'积极', neu:'中性', neg:'消极', good:'主要积极点', issues:'主要关注点', recommendations:'建议', noData:'目前没有可分析的有效评价。', updated:'已根据面板数据更新' },
};

function langOf(v: string): Lang { return v === 'en' || v === 'es' || v === 'zh' || v === 'pt' ? v : 'pt'; }
function num(v: unknown) { const x = Number(v); return Number.isFinite(x) ? x : null; }
function reviewSentiment(v: unknown): 'pos'|'neu'|'neg'|null { const s = String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); if (s.includes('pos')) return 'pos'; if (s.includes('neg')) return 'neg'; if (s.includes('neu')) return 'neu'; return null; }
function tagsOf(v: unknown) { let x = v; if (typeof x === 'string') { try { x = JSON.parse(x || '[]'); } catch { x = []; } } return Array.isArray(x) ? x.map(String).map(s => s.trim()).filter(Boolean) : []; }

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, panelData }: Props) {
  const { language } = useLanguage();
  const [fallback, setFallback] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(!panelData);

  useEffect(() => {
    if (panelData) { setFallback(null); setLoading(false); return; }
    let cancelled = false;
    fetch(`${api}/api/empresa/${encodeURIComponent(empresaId)}/painel`, { credentials: 'include', headers: authHeaders(false), cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(f => { if (!cancelled && f && typeof f === 'object') { setFallback(f); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [empresaId, api, panelData, authHeaders]);

  const source = panelData ?? fallback;
  const empresa = source?.empresa ?? {};
  const metricas = source?.metricas ?? {};
  const reviews = useMemo(() => Array.isArray(source?.reviews) ? source.reviews.filter(r => r && r.is_test !== true && r.is_test !== 'true') : [], [source?.reviews]);
  const l = langOf(language);
  const t = TEXT[l];

  const stats = useMemo(() => {
    let total = 0, sum = 0, positive = 0, critical = 0;
    const sentiment = { pos: 0, neu: 0, neg: 0 };
    const goodTags: Record<string, number> = {}, issueTags: Record<string, number> = {};
    for (const r of reviews) {
      const x = num(r.rating);
      if (x !== null && x >= 1 && x <= 5) { total++; sum += x; if (x >= 4) positive++; if (x <= 3) critical++; }
      const s = reviewSentiment(r.sentiment) || (x === null ? null : x >= 4 ? 'pos' : x <= 2 ? 'neg' : 'neu');
      if (s) sentiment[s]++;
      const target = x !== null && x >= 4 ? goodTags : x !== null && x <= 3 ? issueTags : null;
      if (target) for (const tag of tagsOf(r.ai_tags)) target[tag] = (target[tag] || 0) + 1;
    }
    const top = (x: Record<string, number>) => Object.entries(x).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
    return { total, average: total ? Math.round(sum / total * 10) / 10 : 0, positive, critical, sentiment, goodThemes: top(goodTags), issueThemes: top(issueTags) };
  }, [reviews]);

  const trend = useMemo(() => {
    const raw = Array.isArray(metricas.serie_14d) ? metricas.serie_14d : [];
    const p = raw.map((x:any) => num(x?.media)).filter((x): x is number => x !== null);
    return p.length > 1 ? Math.round((p[p.length - 1] - p[0]) * 10) / 10 : null;
  }, [metricas.serie_14d]);

  const recommendations = stats.total ? [
    ...(stats.critical > stats.positive ? [l === 'en' ? 'Prioritize reviews of 3 stars or less.' : l === 'es' ? 'Prioriza las reseñas de 3 estrellas o menos.' : l === 'zh' ? '优先处理三星及以下评价。' : 'Priorize as avaliações de até 3 estrelas.'] : []),
    ...(stats.average < 4 ? [l === 'en' ? 'Identify the causes of low ratings and turn them into actions.' : l === 'es' ? 'Identifica las causas de las bajas calificaciones y conviértelas en acciones.' : l === 'zh' ? '找出低评分原因并转化为行动。' : 'Identifique as causas das notas baixas e transforme-as em ações.'] : []),
    ...(stats.sentiment.neg > stats.sentiment.pos ? [l === 'en' ? 'Monitor negative sentiment.' : l === 'es' ? 'Acompaña el sentimiento negativo.' : l === 'zh' ? '继续监测负面情绪。' : 'Acompanhe o sentimento negativo.'] : []),
    ...(stats.issueThemes.length ? [l === 'en' ? `Investigate recurring issue: “${stats.issueThemes[0][0]}”.` : l === 'es' ? `Investiga el problema recurrente: “${stats.issueThemes[0][0]}”.` : l === 'zh' ? `调查反复出现的问题：“${stats.issueThemes[0][0]}”。` : `Investigue o problema recorrente: “${stats.issueThemes[0][0]}”.`] : [])
  ].slice(0, 4) : [t.noData];

  if (loading && !source) return <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 text-sm text-zinc-500">{t.title}…</section>;
  return <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6" aria-labelledby="relatorio-inteligente-title">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div><div className="flex items-center gap-2"><FileText size={18} className="text-indigo-400"/><h2 id="relatorio-inteligente-title" className="text-base font-semibold text-zinc-100">{t.title}</h2></div><p className="text-xs text-zinc-500 mt-1 max-w-2xl">{t.desc}</p></div></div>
    {stats.total === 0 ? <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">{t.noData}</div> : <><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[[t.avg, stats.average.toFixed(1)], [t.reviews, String(stats.total)], [t.positive, String(stats.positive)], [t.critical, String(stats.critical)]].map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"><div className="text-xs text-zinc-500">{label}</div><div className="text-2xl font-semibold text-zinc-100 mt-1">{value}</div></div>)}</div><div className="grid lg:grid-cols-2 gap-4"><div className="rounded-xl border border-zinc-800 p-4"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><TrendingUp size={16}/>{t.evolution}</div><div className="mt-3 text-sm text-zinc-400">{trend === null ? t.insufficient : trend > 0 ? `${t.improving} (+${trend.toFixed(1)})` : trend < 0 ? `${t.attention} (${trend.toFixed(1)})` : t.stable}</div></div><div className="rounded-xl border border-zinc-800 p-4"><div className="text-sm font-medium text-zinc-200">{t.sentiment}</div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><div>{t.pos}: <b>{stats.sentiment.pos}</b></div><div>{t.neu}: <b>{stats.sentiment.neu}</b></div><div>{t.neg}: <b>{stats.sentiment.neg}</b></div></div></div></div><div className="grid lg:grid-cols-2 gap-4"><div className="rounded-xl border border-zinc-800 p-4"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><CheckCircle2 size={16}/>{t.good}</div><div className="mt-3 space-y-2">{stats.goodThemes.length ? stats.goodThemes.map(([x,n]) => <div key={x} className="flex justify-between text-sm text-zinc-400"><span>{x}</span><span>{n}</span></div>) : <span className="text-sm text-zinc-500">—</span>}</div></div><div className="rounded-xl border border-zinc-800 p-4"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><AlertTriangle size={16}/>{t.issues}</div><div className="mt-3 space-y-2">{stats.issueThemes.length ? stats.issueThemes.map(([x,n]) => <div key={x} className="flex justify-between text-sm text-zinc-400"><span>{x}</span><span>{n}</span></div>) : <span className="text-sm text-zinc-500">—</span>}</div></div></div><div className="rounded-xl border border-zinc-800 p-4"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Lightbulb size={16}/>{t.recommendations}</div><ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-zinc-400">{recommendations.map((x,i) => <li key={`${i}-${x}`}>{x}</li>)}</ul></div></>}
    <div className="text-[11px] text-zinc-600">{t.updated}</div>
  </section>;
}
