'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, FileText, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Review = {
  id?: string | number;
  rating?: unknown;
  comment?: unknown;
  sentiment?: unknown;
  ai_tags?: unknown;
  unidade_id?: string | null;
  createdAt?: unknown;
  created_at?: unknown;
  createdat?: unknown;
  is_test?: unknown;
};
type Unit = { id?: string; nome?: string; nome_unidade?: string; nome_empresa?: string };
type Props = {
  empresa: { id?: string; nome_empresa?: string; plan?: string };
  reviews: Review[];
  monthlyReports?: any[];
  unidades?: Unit[];
  lang?: string;
};

const COPY: Record<string, Record<string, string>> = {
  pt: { title: 'Relatório profissional mensal', subtitle: 'Histórico mensal previamente gerado, exibido sem chamadas de rede próprias da seção.', period: 'Mês de referência', noData: 'Não há avaliações válidas neste período.', noHistory: 'Não há meses com avaliações disponíveis nos dados carregados.', reviews: 'Avaliações', average: 'Nota média', positive: 'Positivas', critical: 'Críticas (1–3 estrelas)', summary: 'Resumo executivo', strengths: 'Principais pontos positivos', attention: 'Pontos de atenção', action: 'Plano de ação recomendado', units: 'Desempenho por unidade', themes: 'Temas recorrentes', sentiment: 'Sentimento', neutral: 'Neutras', negative: 'Negativas', positiveThemes: 'Temas positivos', criticalThemes: 'Temas críticos', strategicRadar: 'Radar estratégico', noTags: 'Sem temas identificados nos dados deste período.', proSummary: 'O período foi avaliado com base nas avaliações válidas já disponíveis no painel.', criticalAction: 'Priorizar o tratamento das avaliações de 1 a 3 estrelas e acompanhar a evolução no próximo ciclo.', positiveAction: 'Manter as práticas associadas às avaliações positivas e comparar os resultados no próximo ciclo.', noCritical: 'Não foram registradas avaliações críticas no período.' },
  en: { title: 'Monthly professional report', subtitle: 'Pre-generated monthly history, displayed without section-specific network requests.', period: 'Reporting month', noData: 'No valid reviews for this period.', noHistory: 'No months with reviews are available in the loaded data.', reviews: 'Reviews', average: 'Average rating', positive: 'Positive', critical: 'Critical (1–3 stars)', summary: 'Executive summary', strengths: 'Main strengths', attention: 'Points to address', action: 'Recommended action plan', units: 'Performance by location', themes: 'Recurring themes', sentiment: 'Sentiment', neutral: 'Neutral', negative: 'Negative', positiveThemes: 'Positive themes', criticalThemes: 'Critical themes', strategicRadar: 'Strategic radar', noTags: 'No themes were identified in this period.', proSummary: 'This period is assessed from valid reviews already available in the dashboard.', criticalAction: 'Prioritize 1–3 star reviews and monitor progress in the next cycle.', positiveAction: 'Maintain practices associated with positive reviews and compare results next cycle.', noCritical: 'No critical reviews were recorded for this period.' },
  es: { title: 'Informe profesional mensual', subtitle: 'Historial mensual generado previamente, mostrado sin llamadas de red propias de la sección.', period: 'Mes de referencia', noData: 'No hay reseñas válidas en este período.', noHistory: 'No hay meses con reseñas disponibles en los datos cargados.', reviews: 'Reseñas', average: 'Calificación media', positive: 'Positivas', critical: 'Críticas (1–3 estrellas)', summary: 'Resumen ejecutivo', strengths: 'Principales fortalezas', attention: 'Puntos de atención', action: 'Plan de acción recomendado', units: 'Rendimiento por unidad', themes: 'Temas recurrentes', sentiment: 'Sentimiento', neutral: 'Neutras', positiveThemes: 'Temas positivos', criticalThemes: 'Temas críticos', strategicRadar: 'Radar estratégico', noTags: 'No se identificaron temas en este período.', proSummary: 'El período se evalúa con las reseñas válidas ya disponibles en el panel.', criticalAction: 'Priorizar las reseñas de 1 a 3 estrellas y seguir la evolución en el próximo ciclo.', positiveAction: 'Mantener las prácticas asociadas a reseñas positivas y comparar los resultados en el próximo ciclo.', noCritical: 'No se registraron reseñas críticas en este período.' },
  zh: { title: '月度专业报告', subtitle: '展示预先生成的月度历史记录；此区域不会单独发起网络请求。', period: '报告月份', noData: '此期间没有有效评价。', noHistory: '已加载的数据中没有可用的评价月份。', reviews: '评价数', average: '平均评分', positive: '好评', critical: '需关注（1–3 星）', summary: '执行摘要', strengths: '主要优势', attention: '关注事项', action: '建议行动计划', units: '各门店表现', themes: '重复主题', sentiment: '情绪', neutral: '中性', negative: '消极', positiveThemes: '积极主题', criticalThemes: '关键问题', strategicRadar: '战略雷达', noTags: '此期间未识别到主题。', proSummary: '本期间分析基于面板中已加载的有效评价。', criticalAction: '优先处理 1–3 星评价，并在下个周期跟踪进展。', positiveAction: '保持与好评相关的做法，并在下个周期比较结果。', noCritical: '此期间没有记录需关注的评价。' },
};

function reviewDate(review: Review): string {
  const raw = String(review.createdAt ?? review.createdat ?? review.created_at ?? '').trim();
  if (!raw) return '';
  const month = raw.match(/^(\d{4})-(\d{2})/);
  if (month) return month[1] + '-' + month[2];
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 7);
}
function isTest(review: Review): boolean {
  return review.is_test === true || Number(review.is_test) === 1 || String(review.is_test).toLowerCase() === 'true';
}
function sentimentOf(review: Review): 'positive' | 'neutral' | 'negative' {
  const raw = String(review.sentiment || '').toLowerCase();
  if (raw.includes('pos')) return 'positive';
  if (raw.includes('neg')) return 'negative';
  if (raw.includes('neu')) return 'neutral';
  const rating = Number(review.rating);
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}
function parseTags(value: unknown): string[] {
  let raw = value;
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
  return Array.isArray(raw) ? raw.map(String).map((x) => x.trim()).filter(Boolean) : [];
}
function languageOf(name: unknown): string {
  const value = String(name || '').toLowerCase();
  if (value.includes('english') || value === 'en') return 'en';
  if (value.includes('español') || value.includes('espanol') || value === 'es') return 'es';
  if (value.includes('中文') || value.includes('chinese') || value === 'zh') return 'zh';
  return 'pt';
}

export function RelatorioProfissionalMensalPanel({ empresa, reviews, monthlyReports = [], unidades = [], lang: languageName }: Props) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const lang = languageOf(languageName);
  const t = COPY[lang] || COPY.pt;
  const validReviews = useMemo(() => reviews.filter((r) => !isTest(r) && Number(r.rating) >= 1 && Number(r.rating) <= 5 && reviewDate(r)), [reviews]);
  const months = useMemo(() => [...new Set(validReviews.map(reviewDate))].sort().reverse(), [validReviews]);
  const savedReports = useMemo(() => monthlyReports.filter((r) => typeof r?.periodo === 'string' && r?.kpis && r?.empresa?.id === String(empresa.id || '')).sort((a, b) => b.periodo.localeCompare(a.periodo)), [monthlyReports, empresa.id]);
  const availableMonths = savedReports.length ? savedReports.map((r) => r.periodo) : months;
  const activeMonth = selectedMonth && availableMonths.includes(selectedMonth) ? selectedMonth : (availableMonths[0] || '');
  const activeReport = savedReports.find((r) => r.periodo === activeMonth) || null;
  const rows = useMemo(() => validReviews.filter((r) => reviewDate(r) === activeMonth), [validReviews, activeMonth]);
  const stats = useMemo(() => {
    const total = rows.length;
    const average = total ? rows.reduce((sum, r) => sum + Number(r.rating), 0) / total : 0;
    const positive = rows.filter((r) => Number(r.rating) >= 4).length;
    const critical = rows.filter((r) => Number(r.rating) <= 3).length;
    const tags = new Map<string, number>();
    const criticalTags = new Map<string, number>();
    const positiveTags = new Map<string, number>();
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const units = new Map<string, { name: string; count: number; total: number }>();
    for (const row of rows) {
      const sentiment = sentimentOf(row);
      sentimentCounts[sentiment] += 1;
      for (const tag of parseTags(row.ai_tags)) {
        tags.set(tag, (tags.get(tag) || 0) + 1);
        if (Number(row.rating) <= 3) criticalTags.set(tag, (criticalTags.get(tag) || 0) + 1);
        if (Number(row.rating) >= 4) positiveTags.set(tag, (positiveTags.get(tag) || 0) + 1);
      }
      const id = String(row.unidade_id || '');
      if (id) {
        const unit = unidades.find((u) => String(u.id || '') === id);
        const name = String(unit?.nome || unit?.nome_unidade || unit?.nome_empresa || id);
        const current = units.get(id) || { name, count: 0, total: 0 };
        current.count += 1;
        current.total += Number(row.rating);
        units.set(id, current);
      }
    }
    return {
      total, average, positive, critical,
      positivePct: total ? Math.round(positive / total * 100) : 0,
      themes: [...tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8),
      criticalThemes: [...criticalTags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5),
      positiveThemes: [...positiveTags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5),
      sentimentCounts,
      units: [...units.values()].map((u) => ({ ...u, average: u.total / u.count })).sort((a, b) => a.average - b.average),
    };
  }, [rows, unidades]);
  const plan = String(empresa.plan || 'pro').toLowerCase();
  const advanced = ['ultra', 'corporativo', 'corporate', 'corp', 'rei'].includes(plan);
  const multiUnit = ['corporativo', 'corporate', 'corp', 'rei'].includes(plan);
  const rei = plan === 'rei';

  return (
    <section id="professional-report" className="scroll-mt-28 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] via-zinc-950 to-zinc-950 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-indigo-300/20 bg-indigo-400/10 p-3 text-indigo-200"><FileText size={22} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-300">Filtra.AI</p>
            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{t.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {availableMonths.length > 0 && <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300"><CalendarDays size={15} /><span className="sr-only">{t.period}</span><select aria-label={t.period} value={activeMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="max-w-40 bg-transparent text-sm outline-none">{availableMonths.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}</select></label>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 px-3 py-1.5">{empresa.nome_empresa || 'Empresa'}</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">{String(empresa.plan || 'pro').toUpperCase()}</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">{activeMonth || '—'}</span>
      </div>
      {activeReport ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-xs text-emerald-200">
            <span>Snapshot mensal gerado previamente · fonte: avaliações reais do período</span>
            <span>{activeReport.geracao?.modo === 'ia' ? 'Análise assistida por IA' : 'Análise determinística'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[[String(activeReport.kpis.avaliacoes || 0), t.reviews], [activeReport.kpis.avaliacoes ? Number(activeReport.kpis.nota_media).toFixed(1) + '/5' : '—', t.average], [String(activeReport.kpis.percentual_positivas || 0) + '%', t.positive], [String(activeReport.kpis.criticas || 0), t.critical]].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-zinc-500">{label}</div></div>)}
          </div>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold text-white">{t.summary}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{activeReport.resumo_executivo || 'Sem resumo disponível para este período.'}</p>
            {activeReport.narrativa?.por_que_importa && <p className="mt-3 text-sm leading-6 text-zinc-400">{activeReport.narrativa.por_que_importa}</p>}
          </article>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.sentiment}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">{[[t.positive, activeReport.sentimento?.positivo || 0], [t.neutral, activeReport.sentimento?.neutro || 0], [t.negative, activeReport.sentimento?.negativo || 0]].map(([name, count]) => <div key={String(name)} className="rounded-xl border border-white/5 px-3 py-2"><div className="text-lg font-semibold text-white">{count}</div><div className="text-xs text-zinc-500">{name}</div></div>)}</div>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.themes}</h4>
              {[...(activeReport.temas?.atencao || []), ...(activeReport.temas?.positivos || [])].slice(0, 8).length ? <ul className="mt-2 space-y-2">{[...(activeReport.temas?.atencao || []), ...(activeReport.temas?.positivos || [])].slice(0, 8).map((theme: any, index: number) => <li key={String(theme.tema) + index} className="flex justify-between gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm"><span className="text-zinc-300">{theme.tema}</span><span className="text-zinc-500">{theme.volume}</span></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.action}</h3>
              {activeReport.recomendacoes?.length ? <ul className="mt-3 space-y-2">{activeReport.recomendacoes.map((item: string, index: number) => <li key={index} className="rounded-xl border border-white/5 px-3 py-2 text-sm leading-5 text-zinc-300">{item}</li>)}</ul> : <p className="mt-3 text-sm text-zinc-400">Sem recomendações registradas.</p>}
              {(activeReport.riscos?.length || 0) > 0 && <><h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-amber-300">{t.attention}</h4><ul className="mt-2 space-y-2">{activeReport.riscos.map((item: any, index: number) => <li key={index} className="rounded-xl border border-amber-400/10 px-3 py-2 text-sm text-zinc-300"><span className="font-medium">{item.titulo}</span><p className="mt-1 text-zinc-400">{item.evidencias}</p></li>)}</ul></>}
            </article>
          </div>
          {(multiUnit && (activeReport.ranking_unidades?.length || 0) > 0) && <article className="rounded-2xl border border-white/10 bg-black/20 p-5"><h3 className="text-sm font-semibold text-white">{t.units}</h3><div className="mt-3 space-y-2">{activeReport.ranking_unidades.map((unit: any) => <div key={String(unit.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-3"><span className="text-sm text-zinc-300">{unit.posicao}. {unit.nome}</span><span className="text-xs text-zinc-500">{unit.avaliacoes} · {t.reviews}</span><span className="text-sm font-semibold text-white">{Number(unit.nota_media).toFixed(1)}/5</span></div>)}</div></article>}
          {rei && <article className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.03] p-5"><h3 className="text-sm font-semibold text-white">{t.strategicRadar}</h3>{activeReport.radar_estrategico?.length ? <div className="mt-3 space-y-3">{activeReport.radar_estrategico.map((item: any, index: number) => <div key={index} className="rounded-xl border border-white/5 p-3"><div className="text-sm font-semibold text-white">{item.sinal}</div><p className="mt-1 text-sm text-zinc-400">{item.evidencia}</p><p className="mt-2 text-sm text-violet-100">{item.acao}</p></div>)}</div> : <p className="mt-2 text-sm text-zinc-400">Sem sinais estratégicos adicionais neste ciclo.</p>}
            {(activeReport.oportunidades_crescimento?.length || 0) > 0 && <><h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-300">Oportunidades de crescimento</h4><div className="mt-2 space-y-2">{activeReport.oportunidades_crescimento.map((item: any, index: number) => <div key={index} className="rounded-xl border border-white/5 p-3"><div className="text-sm font-medium text-white">{item.titulo}</div><p className="mt-1 text-sm text-zinc-400">{item.evidencias}</p><p className="mt-2 text-sm text-zinc-300">{item.acao_recomendada}</p></div>)}</div></>}
          </article>}
        </div>
      ) : !availableMonths.length ? <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">{t.noHistory}</p> : !stats.total ? <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">{t.noData}</p> : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[[String(stats.total), t.reviews], [stats.average.toFixed(1) + '/5', t.average], [stats.positivePct + '%', t.positive], [String(stats.critical), t.critical]].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-zinc-500">{label}</div></div>)}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><TrendingUp size={16} className="text-emerald-300" />{t.summary}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{t.proSummary} {stats.total} {t.reviews.toLowerCase()}; {t.average.toLowerCase()}: {stats.average.toFixed(1)}/5; {t.positive.toLowerCase()}: {stats.positivePct}%.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><AlertTriangle size={16} className="text-amber-300" />{t.attention}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{stats.critical ? t.criticalAction : t.noCritical}</p>
              {advanced && <div className="mt-4 space-y-4">
                <div><h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.sentiment}</h4><div className="mt-2 grid grid-cols-3 gap-2">{[[t.positive, stats.sentimentCounts.positive], [t.neutral, stats.sentimentCounts.neutral], [t.negative, stats.sentimentCounts.negative]].map(([name, count]) => <div key={String(name)} className="rounded-xl border border-white/5 px-3 py-2"><div className="text-lg font-semibold text-white">{count}</div><div className="text-xs text-zinc-500">{name}</div></div>)}</div></div>
                <div><h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.themes}</h4>{stats.themes.length ? <ul className="mt-2 space-y-2">{stats.themes.map(([theme, count]) => <li key={theme} className="flex justify-between gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm"><span className="text-zinc-300">{theme}</span><span className="text-zinc-500">{count}</span></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}</div>
              </div>}
            </article>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 size={16} className="text-emerald-300" />{t.strengths}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{stats.positive ? t.positiveAction : t.noCritical}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.action}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{stats.critical ? t.criticalAction : t.positiveAction}</p>
              {rei && <p className="mt-3 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-3 text-sm text-violet-100">REI: consolide os sinais por unidade, acompanhe riscos e transforme temas recorrentes em iniciativas mensuráveis.</p>}
            </article>
          </div>
          {rei && <article className="mt-4 rounded-2xl border border-violet-400/15 bg-violet-400/[0.03] p-5"><h3 className="text-sm font-semibold text-white">{t.strategicRadar}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.criticalThemes}</h4>{stats.criticalThemes.length ? <ul className="mt-2 space-y-2">{stats.criticalThemes.map(([theme, count]) => <li key={theme} className="flex justify-between rounded-xl border border-white/5 px-3 py-2 text-sm"><span className="text-zinc-300">{theme}</span><span className="text-amber-300">{count}</span></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}</div><div><h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.positiveThemes}</h4>{stats.positiveThemes.length ? <ul className="mt-2 space-y-2">{stats.positiveThemes.map(([theme, count]) => <li key={theme} className="flex justify-between rounded-xl border border-white/5 px-3 py-2 text-sm"><span className="text-zinc-300">{theme}</span><span className="text-emerald-300">{count}</span></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}</div></div></article>}
          {multiUnit && <article className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5"><h3 className="text-sm font-semibold text-white">{t.units}</h3>{stats.units.length ? <div className="mt-3 space-y-2">{stats.units.map((u) => <div key={u.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-3"><span className="text-sm text-zinc-300">{u.name}</span><span className="text-xs text-zinc-500">{u.count} · {t.reviews}</span><span className="text-sm font-semibold text-white">{u.average.toFixed(1)}/5</span></div>)}</div> : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}</article>}
        </>
      )}

    </section>
  );
}
