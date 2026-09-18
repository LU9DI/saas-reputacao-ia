'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';
import { exportReportClient } from '../utils/reportPdfClient';

type Review = {
  rating?: number | string | null;
  comment?: string | null;
  sentiment?: string | null;
  ai_tags?: unknown;
  createdAt?: string | null;
  created_at?: string | null;
  is_test?: boolean | null;
};

type PanelData = {
  empresa?: { nome_empresa?: string | null; slug?: string | null; id?: string | null; plan?: string | null } | null;
  metricas?: { serie_14d?: unknown } | null;
  reviews?: unknown;
};

type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  panelData?: PanelData | null;
};

const PDF_LANGS = new Set(['pt', 'en', 'es', 'zh']);
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthOptions(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 12; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function labelMes(m: string, lang: string): string {
  if (!MONTH_RE.test(m)) return m;
  const [y, mo] = m.split('-');
  const namesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const namesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const names = lang === 'en' ? namesEn : namesPt;
  return `${names[Number(mo) - 1]}/${y}`;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function reviewDate(review: Review): string {
  const value = review.createdAt || review.created_at || '';
  return typeof value === 'string' ? value : '';
}

function reviewRating(review: Review): number | null {
  const n = toFiniteNumber(review.rating);
  return n !== null && n >= 1 && n <= 5 ? n : null;
}

function reviewTags(review: Review): string[] {
  if (!Array.isArray(review.ai_tags)) return [];
  return review.ai_tags.map((tag) => String(tag ?? '').trim()).filter(Boolean).slice(0, 20);
}

function sentimentKey(value: unknown): 'positivo' | 'neutro' | 'negativo' | null {
  const s = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s.includes('pos') ? 'positivo' : s.includes('neg') ? 'negativo' : s.includes('neu') ? 'neutro' : null;
}

function uiCopy(lang: string) {
  if (lang === 'en') {
    return {
      title: 'Intelligent Report', subtitle: 'Based on data available right now. Click Export PDF — a new tab opens to view and download.',
      month: 'Period', pdfLang: 'PDF language', exportPdf: 'Export PDF', generating: 'Opening…',
      avg: 'Average', reviews: 'Reviews', positive: 'Positive', critical: 'Critical', evolution: 'Trend',
      evolutionEmpty: 'Not enough data yet to calculate the trend.', evolutionText: 'Recent average change:',
      sentiment: 'Sentiment', sentPos: 'Positive', sentNeu: 'Neutral', sentNeg: 'Negative',
      pointsPos: 'Main positive points', pointsPosEmpty: 'No positive points identified in this period.',
      pointsPosLine: (n: number) => `${n} review(s) with 4 or 5 stars.`,
      themeLine: (name: string, count: number) => `Recurring theme: ${name} (${count})`,
      pointsCrit: 'Main attention points', pointsCritEmpty: 'No critical reviews identified in this period.',
      pointsCritLine: (n: number) => `${n} review(s) with up to 3 stars.`,
      followTheme: (name: string, count: number) => `Watch: ${name} (${count})`,
      recommendations: 'Recommendations',
      recEmpty: 'There are no reviews in this period yet. Collect more feedback for a clearer reading.',
      recCritical: 'Prioritize reviews of 3 stars or below and identify recurring problems before seeking new reviews.',
      recLowAvg: 'Analyze the causes of low ratings and turn the main complaints into operational actions.',
      recKeepPositive: 'Keep the patterns that generate positive reviews and use them as a reference for service.',
      recNegSentiment: 'Watch negative sentiment in the next reviews to see if the pattern continues.',
      recTheme: (name: string) => `Monitor the theme “${name}”, seen most often in this period.`,
      footer: 'Report based on available data.', errPeriod: 'Invalid period for export.',
      errFail: 'Could not open the report. Allow pop-ups for this site and try again.',
      brand: 'Filtra.AI', themes: 'Themes', rights: '© Filtra.AI — All rights reserved.', plan: 'Plan',
    };
  }
  if (lang === 'es') {
    return {
      title: 'Informe Inteligente', subtitle: 'Según los datos disponibles. Pulse Exportar PDF — se abre una pestaña para ver y descargar.',
      month: 'Período', pdfLang: 'Idioma del PDF', exportPdf: 'Exportar PDF', generating: 'Abriendo…',
      avg: 'Media', reviews: 'Reseñas', positive: 'Positivas', critical: 'Críticas', evolution: 'Evolución',
      evolutionEmpty: 'Aún no hay datos suficientes para calcular la tendencia.', evolutionText: 'Variación de la media reciente:',
      sentiment: 'Sentimiento', sentPos: 'Positivo', sentNeu: 'Neutral', sentNeg: 'Negativo',
      pointsPos: 'Principales puntos positivos', pointsPosEmpty: 'Ningún punto positivo identificado en este período.',
      pointsPosLine: (n: number) => `${n} reseña(s) con 4 o 5 estrellas.`,
      themeLine: (name: string, count: number) => `Tema recurrente: ${name} (${count})`,
      pointsCrit: 'Principales puntos de atención', pointsCritEmpty: 'Ninguna reseña crítica identificada en este período.',
      pointsCritLine: (n: number) => `${n} reseña(s) con hasta 3 estrellas.`,
      followTheme: (name: string, count: number) => `Seguir: ${name} (${count})`,
      recommendations: 'Recomendaciones',
      recEmpty: 'Aún no hay reseñas en este período. Genere más evaluaciones para una lectura más representativa.',
      recCritical: 'Priorice el tratamiento de reseñas de hasta 3 estrellas e identifique problemas recurrentes.',
      recLowAvg: 'Analice las causas de las notas bajas y convierta los principales motivos en acciones operativas.',
      recKeepPositive: 'Mantenga los puntos que generan reseñas positivas y úselos como referencia de atención.',
      recNegSentiment: 'Siga de cerca el sentimiento negativo en las próximas reseñas para ver si el patrón se repite.',
      recTheme: (name: string) => `Monitoree el tema “${name}”, el más frecuente del período.`,
      footer: 'Informe según los datos disponibles.', errPeriod: 'Período no válido para exportación.',
      errFail: 'No se pudo abrir el informe. Permita ventanas emergentes e inténtelo de nuevo.',
      brand: 'Filtra.AI', themes: 'Temas', rights: '© Filtra.AI — Todos los derechos reservados.', plan: 'Plan',
    };
  }
  if (lang === 'zh') {
    return {
      title: '智能报告', subtitle: '基于当前数据。点击导出 PDF — 将打开新标签页查看和下载。',
      month: '周期', pdfLang: 'PDF 语言', exportPdf: '导出 PDF', generating: '打开中…',
      avg: '平均分', reviews: '评价', positive: '好评', critical: '需关注', evolution: '趋势',
      evolutionEmpty: '数据不足，暂无法计算趋势。', evolutionText: '近期平均分变化：',
      sentiment: '情绪', sentPos: '积极', sentNeu: '中性', sentNeg: '消极',
      pointsPos: '主要优点', pointsPosEmpty: '本周期未发现明显优点。', pointsPosLine: (n: number) => `${n} 条 4–5 星评价。`,
      themeLine: (name: string, count: number) => `常见主题：${name}（${count}）`,
      pointsCrit: '主要关注点', pointsCritEmpty: '本周期未发现差评。', pointsCritLine: (n: number) => `${n} 条不超过 3 星的评价。`,
      followTheme: (name: string, count: number) => `关注：${name}（${count}）`,
      recommendations: '建议', recEmpty: '本周期尚无评价，请先收集更多反馈。',
      recCritical: '优先处理 3 星及以下评价，并识别重复问题。',
      recLowAvg: '分析低分原因，将主要投诉转化为运营改进。',
      recKeepPositive: '保持带来好评的服务标准，并作为参考。',
      recNegSentiment: '持续关注负面情绪，确认是否形成趋势。',
      recTheme: (name: string) => `关注本周期出现最多的主题「${name}」。`,
      footer: '报告基于当前数据。', errPeriod: '导出周期无效。',
      errFail: '无法打开报告。请允许弹出窗口后重试。',
      brand: 'Filtra.AI', themes: '主题', rights: '© Filtra.AI — 保留所有权利。', plan: '套餐',
    };
  }
  return {
    title: 'Relatório Inteligente',
    subtitle: 'Conforme os dados disponíveis no momento. Clique em Exportar PDF — abre uma nova aba para visualizar e baixar.',
    month: 'Período', pdfLang: 'Idioma do PDF', exportPdf: 'Exportar PDF', generating: 'Abrindo…',
    avg: 'Nota média', reviews: 'Avaliações', positive: 'Positivas', critical: 'Críticas', evolution: 'Evolução',
    evolutionEmpty: 'Ainda não há dados suficientes para calcular a tendência.', evolutionText: 'Variação da média recente:',
    sentiment: 'Sentimento', sentPos: 'Positivo', sentNeu: 'Neutro', sentNeg: 'Negativo',
    pointsPos: 'Principais pontos positivos', pointsPosEmpty: 'Nenhum ponto positivo identificado neste período.',
    pointsPosLine: (n: number) => `${n} avaliação(ões) com 4 ou 5 estrelas.`,
    themeLine: (name: string, count: number) => `Tema recorrente: ${name} (${count})`,
    pointsCrit: 'Principais pontos de atenção', pointsCritEmpty: 'Nenhuma avaliação crítica identificada neste período.',
    pointsCritLine: (n: number) => `${n} avaliação(ões) com até 3 estrelas.`,
    followTheme: (name: string, count: number) => `Acompanhar: ${name} (${count})`,
    recommendations: 'Recomendações',
    recEmpty: 'Ainda não há avaliações neste período. Gere novas avaliações para uma leitura mais representativa.',
    recCritical: 'Priorize o tratamento das avaliações de até 3 estrelas e identifique os problemas recorrentes antes de buscar novas avaliações.',
    recLowAvg: 'Analise as causas das notas baixas e transforme os principais motivos de reclamação em ações operacionais.',
    recKeepPositive: 'Mantenha os pontos que geram avaliações positivas e use esses padrões como referência para o atendimento.',
    recNegSentiment: 'Acompanhe de perto o sentimento negativo nas próximas avaliações para verificar se o cenário está se repetindo.',
    recTheme: (name: string) => `Monitore o tema “${name}”, identificado com maior frequência no período.`,
    footer: 'Relatório conforme os dados disponíveis no momento.',
    errPeriod: 'Período inválido para exportação.',
    errFail: 'Não foi possível abrir o relatório. Permita pop-ups neste site e tente novamente.',
    brand: 'Filtra.AI', themes: 'Temas', rights: '© Filtra.AI — Todos os direitos reservados.', plan: 'Plano',
  };
}

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, panelData }: Props) {
  const { language } = useLanguage();
  const copy = uiCopy(language);
  const mesesOpcoes = useMemo(() => buildMonthOptions(), []);
  const [mesReport, setMesReport] = useState(currentMonth);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [reportMetrics, setReportMetrics] = useState<{
    total?: number; media?: number; positivas?: number; negativas?: number; criticas?: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReportMetrics = async () => {
      if (!MONTH_RE.test(mesReport)) { setReportMetrics(null); return; }
      try {
        const base = String(api || '').replace(/\/+$/, '');
        const response = await fetch(
          base + '/api/empresa/' + encodeURIComponent(empresaId) + '/relatorio/inteligente?mes=' + encodeURIComponent(mesReport),
          { method: 'GET', headers: authHeaders(false), credentials: 'include' }
        );
        if (!response.ok) { if (!cancelled) setReportMetrics(null); return; }
        const data = await response.json();
        if (!cancelled) setReportMetrics(data?.metricas || null);
      } catch {
        if (!cancelled) setReportMetrics(null);
      }
    };
    void loadReportMetrics();
    return () => { cancelled = true; };
  }, [api, empresaId, mesReport, authHeaders]);

  const empresa = panelData?.empresa || {};
  const metricas = panelData?.metricas || {};

  const reviews: Review[] = useMemo(() => {
    if (!Array.isArray(panelData?.reviews)) return [];
    return panelData.reviews.filter((item): item is Review => {
      if (!item || typeof item !== 'object') return false;
      return (item as Review).is_test !== true;
    });
  }, [panelData?.reviews]);

  const selectedMonth = MONTH_RE.test(mesReport) ? mesReport : '';

  const monthReviews = useMemo(() => {
    if (!selectedMonth) return reviews;
    return reviews.filter((review) => reviewDate(review).slice(0, 7) === selectedMonth);
  }, [reviews, selectedMonth]);

  const stats = useMemo(() => {
    const total = monthReviews.length;
    let ratingSum = 0, ratedCount = 0, positive = 0, critical = 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    const tagCounts: Record<string, number> = {};
    const distribution = [0, 0, 0, 0, 0];

    for (const review of monthReviews) {
      const rating = reviewRating(review);
      if (rating !== null) {
        ratingSum += rating;
        ratedCount++;
        if (rating >= 4) positive++;
        else if (rating <= 3) critical++;
        distribution[rating - 1] += 1;
      }
      let s = sentimentKey(review.sentiment);
      if (!s && rating !== null) s = rating >= 4 ? 'positivo' : rating <= 2 ? 'negativo' : 'neutro';
      if (s) sentiment[s]++;
      for (const tag of reviewTags(review)) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    const themes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const authoritativeTotal = toFiniteNumber(reportMetrics?.total);
    const authoritativeAverage = toFiniteNumber(reportMetrics?.media);
    const authoritativePositive = toFiniteNumber(reportMetrics?.positivas);
    const authoritativeCritical = toFiniteNumber(reportMetrics?.negativas);

    return {
      total: authoritativeTotal ?? total,
      ratedCount: authoritativeTotal ?? ratedCount,
      positive: authoritativePositive ?? positive,
      critical: authoritativeCritical ?? critical,
      average: authoritativeAverage ?? (ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : 0),
      sentiment,
      themes,
      distribution,
    };
  }, [monthReviews, reportMetrics]);

  const evolution = useMemo(() => {
    const raw = Array.isArray(metricas?.serie_14d) ? metricas.serie_14d : [];
    const points = raw
      .filter((point: any) => point && Number(point.total) > 0)
      .map((point: any) => toFiniteNumber(point.media))
      .filter((v): v is number => v !== null);
    if (points.length < 2) return null;
    return Math.round((points[points.length - 1] - points[0]) * 10) / 10;
  }, [metricas?.serie_14d]);

  const recommendations = useMemo(() => {
    const out: string[] = [];
    if (!stats.total) out.push(copy.recEmpty);
    else {
      if (stats.critical > stats.positive) out.push(copy.recCritical);
      if (stats.average > 0 && stats.average < 4) out.push(copy.recLowAvg);
      if (stats.positive >= stats.critical) out.push(copy.recKeepPositive);
      if (stats.sentiment.negativo > stats.sentiment.positivo) out.push(copy.recNegSentiment);
      if (stats.themes.length) out.push(copy.recTheme(stats.themes[0].name));
    }
    return out.slice(0, 4);
  }, [stats, copy]);

  /** PDF client-side: nova aba, layout profissional por plano */
  const downloadPdf = async () => {
    if (!MONTH_RE.test(mesReport)) {
      setDownloadError(copy.errPeriod);
      return;
    }
    setDownloading(true);
    setDownloadError('');
    try {
      const lang = PDF_LANGS.has(language) ? language : 'pt';
      const result = exportReportClient({
        companyName: String(empresa?.nome_empresa || 'Empresa'),
        periodLabel: labelMes(mesReport, language),
        lang,
        plan: String(empresa?.plan || 'trial'),
        stats: {
          total: stats.total,
          ratedCount: stats.ratedCount,
          positive: stats.positive,
          critical: stats.critical,
          average: stats.average,
          sentiment: stats.sentiment,
          themes: stats.themes,
          distribution: stats.distribution,
        },
        evolution,
        recommendations,
        labels: {
          title: copy.title, avg: copy.avg, reviews: copy.reviews, positive: copy.positive, critical: copy.critical,
          evolution: copy.evolution, evolutionEmpty: copy.evolutionEmpty, evolutionText: copy.evolutionText,
          sentiment: copy.sentiment, sentPos: copy.sentPos, sentNeu: copy.sentNeu, sentNeg: copy.sentNeg,
          pointsPos: copy.pointsPos, pointsCrit: copy.pointsCrit, recommendations: copy.recommendations,
          themes: copy.themes, footer: copy.footer, brand: copy.brand, rights: copy.rights,
        },
      });
      if (!result.ok) setDownloadError(copy.errFail);
    } catch {
      setDownloadError(copy.errFail);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" />
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600">
            {copy.month}
            <select
              className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              value={mesReport}
              onChange={(e) => setMesReport(e.target.value)}
            >
              {mesesOpcoes.map((m) => (
                <option key={m} value={m}>{labelMes(m, language)}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? copy.generating : copy.exportPdf}
          </button>
        </div>
      </div>

      {downloadError ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {downloadError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.avg}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.average ? stats.average.toFixed(1) : '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.reviews}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.positive}</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.positive}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.critical}</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.critical}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            {copy.evolution}
          </h3>
          {evolution === null ? (
            <p className="text-sm text-slate-500">{copy.evolutionEmpty}</p>
          ) : (
            <p className="text-sm text-slate-700">
              {copy.evolutionText}{' '}
              <span className={evolution >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                {evolution > 0 ? '+' : ''}{evolution}
              </span>
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">{copy.sentiment}</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-emerald-700">{copy.sentPos}: <b>{stats.sentiment.positivo}</b></span>
            <span className="text-amber-700">{copy.sentNeu}: <b>{stats.sentiment.neutro}</b></span>
            <span className="text-red-700">{copy.sentNeg}: <b>{stats.sentiment.negativo}</b></span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {copy.pointsPos}
          </h3>
          {stats.positive === 0 ? (
            <p className="text-sm text-slate-500">{copy.pointsPosEmpty}</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              <li>{copy.pointsPosLine(stats.positive)}</li>
              {stats.themes.slice(0, 2).map((t) => (
                <li key={t.name}>{copy.themeLine(t.name, t.count)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {copy.pointsCrit}
          </h3>
          {stats.critical === 0 ? (
            <p className="text-sm text-slate-500">{copy.pointsCritEmpty}</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              <li>{copy.pointsCritLine(stats.critical)}</li>
              {stats.themes.slice(0, 2).map((t) => (
                <li key={'c-' + t.name}>{copy.followTheme(t.name, t.count)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          {copy.recommendations}
        </h3>
        <ul className="space-y-1 text-sm text-slate-700">
          {recommendations.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs text-slate-400">
        {copy.brand}
        {empresa?.plan ? (
          <>
            {' · '}{copy.plan}: <span className="font-medium text-slate-500">{String(empresa.plan)}</span>
          </>
        ) : null}
      </div>
    </section>
  );
}
