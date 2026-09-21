'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';
import { exportReportClient } from '../utils/reportPdfClient';
import { pdfReleaseStatus } from '../utils/pdfReleaseGate';
import { uiCopy } from '../utils/relatorioUiCopy';

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
  empresa?: {
    nome_empresa?: string | null;
    slug?: string | null;
    id?: string | null;
    plan?: string | null;
    status?: string | null;
    expira_em?: string | null;
  } | null;
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

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, panelData }: Props) {
  const { language } = useLanguage();
  const copy = useMemo(() => uiCopy(language), [language]);
  const mesesOpcoes = useMemo(() => buildMonthOptions(), []);
  const [mesReport, setMesReport] = useState(currentMonth);
  const [pdfLang, setPdfLang] = useState<string>(() => (PDF_LANGS.has(language) ? String(language) : 'pt'));

  useEffect(() => {
    if (PDF_LANGS.has(language)) setPdfLang(String(language));
  }, [language]);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [reportMetrics, setReportMetrics] = useState<{
    total?: number;
    media?: number;
    positivas?: number;
    negativas?: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReportMetrics = async () => {
      if (!MONTH_RE.test(mesReport)) {
        setReportMetrics(null);
        return;
      }
      try {
        const base = String(api || '').replace(/\/+$/, '');
        const response = await fetch(
          base +
            '/api/empresa/' +
            encodeURIComponent(empresaId) +
            '/relatorio/inteligente?mes=' +
            encodeURIComponent(mesReport),
          { method: 'GET', headers: authHeaders(false), credentials: 'include' }
        );
        if (!response.ok) {
          if (!cancelled) setReportMetrics(null);
          return;
        }
        const data = await response.json();
        if (!cancelled) setReportMetrics(data?.metricas || null);
      } catch {
        if (!cancelled) setReportMetrics(null);
      }
    };
    void loadReportMetrics();
    return () => {
      cancelled = true;
    };
  }, [api, empresaId, mesReport, authHeaders]);

  const empresa = panelData?.empresa || {};
  const metricas = panelData?.metricas || {};
  const pdfGate = pdfReleaseStatus(empresa);

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
    let ratingSum = 0,
      ratedCount = 0,
      positive = 0,
      critical = 0;
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

  const downloadPdf = async () => {
    if (!pdfGate.released) {
      setDownloadError(
        pdfGate.unlockLabel
          ? `${copy.pdfUnlock}: ${pdfGate.unlockLabel}`
          : copy.pdfLocked
      );
      return;
    }
    if (!MONTH_RE.test(mesReport)) {
      setDownloadError(copy.errPeriod);
      return;
    }
    setDownloading(true);
    setDownloadError('');
    try {
      const lang = PDF_LANGS.has(pdfLang) ? pdfLang : 'pt';
      const pdfCopy = uiCopy(lang);
      const result = exportReportClient({
        companyName: String(empresa?.nome_empresa || 'Empresa'),
        periodLabel: labelMes(mesReport, lang),
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
          title: pdfCopy.title,
          avg: pdfCopy.avg,
          reviews: pdfCopy.reviews,
          positive: pdfCopy.positive,
          critical: pdfCopy.critical,
          evolution: pdfCopy.evolution,
          evolutionEmpty: pdfCopy.evolutionEmpty,
          evolutionText: pdfCopy.evolutionText,
          sentiment: pdfCopy.sentiment,
          sentPos: pdfCopy.sentPos,
          sentNeu: pdfCopy.sentNeu,
          sentNeg: pdfCopy.sentNeg,
          pointsPos: pdfCopy.pointsPos,
          pointsCrit: pdfCopy.pointsCrit,
          recommendations: pdfCopy.recommendations,
          themes: pdfCopy.themes,
          footer: pdfCopy.footer,
          brand: pdfCopy.brand,
          rights: pdfCopy.rights,
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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <FileText className="h-5 w-5 text-blue-600" />
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-zinc-400">
            {copy.month}
            <select
              className="ml-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
              value={mesReport}
              onChange={(e) => setMesReport(e.target.value)}
            >
              {mesesOpcoes.map((m) => (
                <option key={m} value={m}>
                  {labelMes(m, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-400">
            {copy.pdfLang}
            <select
              className="ml-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
              value={pdfLang}
              onChange={(e) => setPdfLang(e.target.value)}
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={downloading || !pdfGate.released}
            title={
              !pdfGate.released && pdfGate.unlockLabel
                ? `${copy.pdfUnlock}: ${pdfGate.unlockLabel}`
                : undefined
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? copy.generating : copy.exportPdf}
          </button>
        </div>
      </div>

      {!pdfGate.released && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {copy.pdfLocked}
          {pdfGate.unlockLabel ? (
            <>
              {' '}
              ({copy.pdfUnlock}: <strong className="text-amber-50">{pdfGate.unlockLabel}</strong>).
            </>
          ) : (
            '.'
          )}
        </div>
      )}

      {downloadError ? <p className="mb-4 text-sm text-red-400">{downloadError}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{copy.avg}</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">{stats.average || '—'}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{copy.reviews}</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{copy.positive}</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{stats.positive}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{copy.critical}</p>
          <p className="mt-1 text-xl font-bold text-red-400">{stats.critical}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            {copy.evolution}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {evolution === null ? copy.evolutionEmpty : `${copy.evolutionText} ${evolution > 0 ? '+' : ''}${evolution}`}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">{copy.sentiment}</h3>
          <p className="mt-2 text-sm text-zinc-400">
            {copy.sentPos}: {stats.sentiment.positivo} · {copy.sentNeu}: {stats.sentiment.neutro} · {copy.sentNeg}:{' '}
            {stats.sentiment.negativo}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {copy.pointsPos}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {stats.positive ? copy.pointsPosLine(stats.positive) : copy.pointsPosEmpty}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {copy.pointsCrit}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {stats.critical ? copy.pointsCritLine(stats.critical) : copy.pointsCritEmpty}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          {copy.recommendations}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {recommendations.map((r, i) => (
            <li key={i} className="text-sm text-zinc-400">
              • {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        {copy.brand}
        {empresa?.plan ? (
          <>
            {' · '}
            {copy.plan}: <span className="font-medium text-zinc-400">{String(empresa.plan)}</span>
          </>
        ) : null}
      </div>
    </section>
  );
}
