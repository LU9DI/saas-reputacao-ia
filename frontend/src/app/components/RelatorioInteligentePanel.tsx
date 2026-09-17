'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';
import { apiFetch } from '../utils/apiFailover';

type Review = {
  rating?: number | string | null;
  sentiment?: string | null;
  ai_tags?: unknown;
  is_test?: boolean | null;
};

type PanelData = {
  empresa?: { nome_empresa?: string | null; slug?: string | null; id?: string | null } | null;
  metricas?: { serie_14d?: unknown } | null;
  reviews?: unknown;
};

type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  panelData?: PanelData | null;
};

const REPORT_LANGS = new Set(['pt', 'en', 'es', 'zh']);

const REPORT_COPY: Record<string, Record<string, string>> = {
  pt: {
    subtitle: 'Análise baseada nos dados disponíveis no painel no momento.', export: 'Exportar PDF', avg: 'Nota média', volume: 'Avaliações', positive: 'Positivas', critical: 'Críticas', evolution: 'Evolução', evolutionEmpty: 'Ainda não há dados suficientes para calcular a tendência.', evolutionText: 'Variação da média recente:', sentiment: 'Sentimento', pos: 'Positivo', neu: 'Neutro', neg: 'Negativo', recommendations: 'Recomendações', empty: 'Ainda não há avaliações disponíveis.', defaultRec: 'Acompanhe críticas e temas recorrentes para orientar as próximas ações.', themes: 'Temas recorrentes', footer: 'Relatório atualizado conforme os dados disponíveis no painel.', invalid: 'Empresa inválida para exportação.', emptyPdf: 'O servidor retornou um PDF vazio.', pdfFail: 'Não foi possível gerar o PDF.'
  },
  en: {
    subtitle: 'Analysis based on the data currently available in the dashboard.', export: 'Export PDF', avg: 'Average rating', volume: 'Reviews', positive: 'Positive', critical: 'Critical', evolution: 'Trend', evolutionEmpty: 'There is not enough data to calculate the trend yet.', evolutionText: 'Recent average change:', sentiment: 'Sentiment', pos: 'Positive', neu: 'Neutral', neg: 'Negative', recommendations: 'Recommendations', empty: 'There are no reviews available yet.', defaultRec: 'Monitor critical reviews and recurring themes to guide the next actions.', themes: 'Recurring themes', footer: 'Report updated according to the data currently available in the dashboard.', invalid: 'Invalid company for PDF export.', emptyPdf: 'The server returned an empty PDF.', pdfFail: 'Could not generate the PDF.'
  },
  es: {
    subtitle: 'Análisis basado en los datos disponibles actualmente en el panel.', export: 'Exportar PDF', avg: 'Calificación media', volume: 'Reseñas', positive: 'Positivas', critical: 'Críticas', evolution: 'Evolución', evolutionEmpty: 'Aún no hay suficientes datos para calcular la tendencia.', evolutionText: 'Variación de la media reciente:', sentiment: 'Sentimiento', pos: 'Positivo', neu: 'Neutral', neg: 'Negativo', recommendations: 'Recomendaciones', empty: 'Aún no hay reseñas disponibles.', defaultRec: 'Supervisa las reseñas críticas y los temas recurrentes para orientar las próximas acciones.', themes: 'Temas recurrentes', footer: 'Informe actualizado según los datos disponibles actualmente en el panel.', invalid: 'Empresa no válida para exportar el PDF.', emptyPdf: 'El servidor devolvió un PDF vacío.', pdfFail: 'No se pudo generar el PDF.'
  },
  zh: {
    subtitle: '根据当前面板中可用的数据进行分析。', export: '导出 PDF', avg: '平均评分', volume: '评价', positive: '好评', critical: '需关注', evolution: '趋势', evolutionEmpty: '目前没有足够的数据来计算趋势。', evolutionText: '近期平均评分变化：', sentiment: '情绪', pos: '积极', neu: '中性', neg: '消极', recommendations: '建议', empty: '目前还没有可用的评价。', defaultRec: '关注差评和重复出现的主题，为下一步行动提供依据。', themes: '重复主题', footer: '报告根据当前面板中的可用数据更新。', invalid: '公司信息无效，无法导出 PDF。', emptyPdf: '服务器返回了空 PDF。', pdfFail: '无法生成 PDF。'
  },
};

function toNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function sentimentKey(value: unknown): 'positivo' | 'neutro' | 'negativo' | null {
  const s = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('pos')) return 'positivo';
  if (s.includes('neg')) return 'negativo';
  if (s.includes('neu')) return 'neutro';
  return null;
}

function tagsOf(review: Review): string[] {
  if (!Array.isArray(review.ai_tags)) return [];
  return review.ai_tags.map((tag) => String(tag ?? '').trim()).filter(Boolean).slice(0, 20);
}

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, panelData }: Props) {
  const { t, language } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const empresa = panelData?.empresa || {};
  const metricas = panelData?.metricas || {};
  const reportLanguage = REPORT_LANGS.has(language) ? language : 'pt';
  const copy = REPORT_COPY[reportLanguage];

  const reviews: Review[] = useMemo(() => {
    if (!Array.isArray(panelData?.reviews)) return [];
    return panelData.reviews.filter((item): item is Review => Boolean(item && typeof item === 'object' && (item as Review).is_test !== true));
  }, [panelData?.reviews]);

  const stats = useMemo(() => {
    let ratingSum = 0;
    let ratedCount = 0;
    let positive = 0;
    let critical = 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    const tagCounts: Record<string, number> = {};

    for (const review of reviews) {
      const rating = toNumber(review.rating);
      if (rating !== null && rating >= 1 && rating <= 5) {
        ratingSum += rating;
        ratedCount += 1;
        if (rating >= 4) positive += 1;
        if (rating <= 3) critical += 1;
      }
      let sentimentValue = sentimentKey(review.sentiment);
      if (!sentimentValue && rating !== null && rating >= 1 && rating <= 5) sentimentValue = rating >= 4 ? 'positivo' : rating <= 2 ? 'negativo' : 'neutro';
      if (sentimentValue) sentiment[sentimentValue] += 1;
      for (const tag of tagsOf(review)) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    const themes = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
    return { total: reviews.length, ratedCount, positive, critical, average: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : 0, sentiment, themes };
  }, [reviews]);

  const evolution = useMemo(() => {
    const raw = Array.isArray(metricas?.serie_14d) ? metricas.serie_14d : [];
    const points = raw.filter((point: any) => point && Number(point.total) > 0).map((point: any) => toNumber(point.media)).filter((value): value is number => value !== null);
    if (points.length < 2) return null;
    return Math.round((points[points.length - 1] - points[0]) * 10) / 10;
  }, [metricas?.serie_14d]);

  const downloadPdf = async () => {
    const ref = String(empresaId || empresa.slug || empresa.id || '').trim();
    if (!ref) {
      setDownloadError(copy.invalid);
      return;
    }
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await apiFetch(`/api/empresa/${encodeURIComponent(ref)}/relatorio-inteligente.pdf?lang=${encodeURIComponent(reportLanguage)}`, { credentials: 'include', headers: authHeaders(false), timeoutMs: 90_000 });
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok || contentType.includes('json')) {
        let message = `Error ${response.status}`;
        if (contentType.includes('json')) {
          const body = await response.json().catch(() => ({}));
          if (typeof body?.error === 'string') message = body.error;
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error(copy.emptyPdf);
      const slug = String(empresa.nome_empresa || 'empresa').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'empresa';
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `relatorio-inteligente-${slug}-${reportLanguage}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : copy.pdfFail);
    } finally {
      setDownloading(false);
    }
  };

  const percentage = (value: number) => stats.ratedCount ? Math.round((value / stats.ratedCount) * 100) : 0;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6" aria-labelledby="relatorio-inteligente-title">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            <h2 id="relatorio-inteligente-title" className="text-base font-semibold text-zinc-100">{t.panel_report_btn || 'Relatório Inteligente'}</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">{copy.subtitle}</p>
        </div>
        <button type="button" onClick={downloadPdf} disabled={downloading} className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50">
          <Download size={16} />
          {downloading ? (t.panel_report_loading || 'Gerando…') : copy.export}
        </button>
      </div>

      {downloadError && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{downloadError}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[[copy.avg, stats.average ? stats.average.toFixed(1) : '—'], [copy.volume, stats.total], [copy.positive, `${percentage(stats.positive)}%`], [copy.critical, `${percentage(stats.critical)}%`]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-indigo-400" /><h3 className="text-sm font-semibold">{copy.evolution}</h3></div>
          {evolution === null ? <p className="text-sm text-zinc-500">{copy.evolutionEmpty}</p> : <p className="text-sm text-zinc-300">{copy.evolutionText} <strong>{evolution > 0 ? '+' : ''}{evolution.toFixed(1)}</strong></p>}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <h3 className="text-sm font-semibold mb-3">{copy.sentiment}</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xs text-emerald-400">{copy.pos}</p><p className="text-xl font-bold">{stats.sentiment.positivo}</p></div>
            <div><p className="text-xs text-amber-300">{copy.neu}</p><p className="text-xl font-bold">{stats.sentiment.neutro}</p></div>
            <div><p className="text-xs text-red-400">{copy.neg}</p><p className="text-xl font-bold">{stats.sentiment.negativo}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-indigo-300" /><h3 className="text-sm font-semibold">{copy.recommendations}</h3></div>
        <div className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" /><p>{stats.total === 0 ? copy.empty : copy.defaultRec}</p></div>
        {stats.critical > 0 && <div className="flex items-start gap-2 text-sm text-zinc-300 mt-2"><AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" /><p>{stats.critical} {copy.critical} · {stats.positive} {copy.positive}</p></div>}
      </div>

      {stats.themes.length > 0 && <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-400"><span className="text-zinc-300 font-medium">{copy.themes}:</span>{' '}{stats.themes.map(([name, count], index) => <span key={name}>{index > 0 ? ' · ' : ''}{name} ({count})</span>)}</div>}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">{copy.footer}{' · '}<span className="text-zinc-300">{reportLanguage.toUpperCase()}</span></div>
    </section>
  );
}
