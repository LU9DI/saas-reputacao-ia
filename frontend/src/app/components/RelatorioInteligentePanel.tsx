'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';

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
  empresa?: { nome_empresa?: string | null; slug?: string | null; id?: string | null } | null;
  metricas?: {
    serie_14d?: unknown;
  } | null;
  reviews?: unknown;
};

type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  panelData?: PanelData | null;
};

const REPORT_LANGS = new Set(['pt', 'en', 'es', 'zh']);
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

function labelMes(m: string): string {
  if (!MONTH_RE.test(m)) return m;
  const [y, mo] = m.split('-');
  const names = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  return `${names[Number(mo) - 1]}/${y}`;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function pct(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((value / total) * 100);
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
  return review.ai_tags
    .map((tag) => String(tag ?? '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

function sentimentKey(value: unknown): 'positivo' | 'neutro' | 'negativo' | null {
  const s = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('pos')) return 'positivo';
  if (s.includes('neg')) return 'negativo';
  if (s.includes('neu')) return 'neutro';
  return null;
}

function apiBase(api: string): string {
  return String(api || '').replace(/\/$/, '');
}

export function RelatorioInteligentePanel({
  empresaId,
  api,
  authHeaders,
  panelData,
}: Props) {
  const mesesOpcoes = useMemo(() => buildMonthOptions(), []);
  const [mesReport, setMesReport] = useState(currentMonth);
  /** Idioma do PDF apenas — não altera o idioma do painel. */
  const [langPdf, setLangPdf] = useState('pt');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const empresa = panelData?.empresa || {};
  const metricas = panelData?.metricas || {};
  const ref =
    String(empresaId || empresa.slug || empresa.id || '').trim() || empresaId;

  const reviews: Review[] = useMemo(() => {
    if (!Array.isArray(panelData?.reviews)) return [];
    return panelData.reviews.filter((item): item is Review => {
      if (!item || typeof item !== 'object') return false;
      const review = item as Review;
      return review.is_test !== true;
    });
  }, [panelData?.reviews]);

  const selectedMonth = MONTH_RE.test(mesReport) ? mesReport : '';

  const monthReviews = useMemo(() => {
    if (!selectedMonth) return reviews;
    return reviews.filter((review) => reviewDate(review).slice(0, 7) === selectedMonth);
  }, [reviews, selectedMonth]);

  const stats = useMemo(() => {
    const total = monthReviews.length;
    let ratingSum = 0;
    let ratedCount = 0;
    let positive = 0;
    let critical = 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    const tagCounts: Record<string, number> = {};

    for (const review of monthReviews) {
      const rating = reviewRating(review);
      if (rating !== null) {
        ratingSum += rating;
        ratedCount++;
        if (rating >= 4) positive++;
        else if (rating <= 3) critical++;
      }

      let s = sentimentKey(review.sentiment);
      if (!s && rating !== null) {
        s = rating >= 4 ? 'positivo' : rating <= 2 ? 'negativo' : 'neutro';
      }
      if (s) sentiment[s]++;

      for (const tag of reviewTags(review)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const themes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      ratedCount,
      positive,
      critical,
      average: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : 0,
      sentiment,
      themes,
    };
  }, [monthReviews]);

  const evolution = useMemo(() => {
    const raw = Array.isArray(metricas?.serie_14d) ? metricas.serie_14d : [];
    const points = raw
      .filter((point: any) => point && Number(point.total) > 0)
      .map((point: any) => ({
        total: Number(point.total),
        average: toFiniteNumber(point.media),
        date: String(point.data || point.date || point.dia || ''),
      }))
      .filter((point) => point.average !== null);

    if (points.length < 2) return null;
    const first = points[0].average as number;
    const last = points[points.length - 1].average as number;
    const delta = Math.round((last - first) * 10) / 10;
    return {
      delta,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
      firstDate: points[0].date,
      lastDate: points[points.length - 1].date,
    } as const;
  }, [metricas?.serie_14d]);

  const recommendations = useMemo(() => {
    const out: string[] = [];
    if (!stats.total) {
      out.push(
        'Ainda não há avaliações neste período. Gere novas avaliações para construir uma leitura mais representativa.'
      );
    } else {
      if (stats.critical > stats.positive) {
        out.push(
          'Priorize o tratamento das avaliações de até 3 estrelas e identifique os problemas recorrentes antes de buscar novas avaliações.'
        );
      }
      if (stats.average > 0 && stats.average < 4) {
        out.push(
          'Analise as causas das notas baixas e transforme os principais motivos de reclamação em ações operacionais.'
        );
      }
      if (stats.positive >= stats.critical) {
        out.push(
          'Mantenha os pontos que geram avaliações positivas e use esses padrões como referência para o atendimento.'
        );
      }
      if (stats.sentiment.negativo > stats.sentiment.positivo) {
        out.push(
          'Acompanhe de perto o sentimento negativo nas próximas avaliações para verificar se o cenário está se repetindo.'
        );
      }
      if (stats.themes.length) {
        out.push(`Monitore o tema “${stats.themes[0].name}”, identificado com maior frequência no período.`);
      }
    }
    return out.slice(0, 4);
  }, [stats]);

  const downloadPdf = async () => {
    if (!ref) {
      setDownloadError('Empresa inválida para exportação.');
      return;
    }
    if (!MONTH_RE.test(mesReport)) {
      setDownloadError('Período inválido para exportação.');
      return;
    }
    setDownloading(true);
    setDownloadError('');
    const lang = REPORT_LANGS.has(langPdf) ? langPdf : 'pt';
    const base = apiBase(api);
    const headers = authHeaders(false);

    // 1) PDF mensal com i18n completo  2) fallback inteligente
    const urls = [
      `${base}/api/empresa/${encodeURIComponent(ref)}/relatorio.pdf?mes=${encodeURIComponent(mesReport)}&lang=${encodeURIComponent(lang)}`,
      `${base}/api/empresa/${encodeURIComponent(ref)}/relatorio-inteligente.pdf?lang=${encodeURIComponent(lang)}`,
    ];

    let lastError = 'Não foi possível gerar o PDF.';
    try {
      for (const url of urls) {
        try {
          const res = await fetch(url, { credentials: 'include', headers });
          const ctype = String(res.headers.get('content-type') || '').toLowerCase();

          if (!res.ok) {
            if (ctype.includes('json')) {
              const body = await res.json().catch(() => ({}));
              lastError =
                typeof body?.error === 'string'
                  ? body.error
                  : `Erro ${res.status} ao gerar PDF.`;
            } else {
              lastError = `Erro ${res.status} ao gerar PDF.`;
            }
            // tenta a próxima URL se for 404/403 de rota alternativa
            if (res.status === 404 || res.status === 403) continue;
            throw new Error(lastError);
          }

          if (ctype.includes('json')) {
            const body = await res.json().catch(() => ({}));
            lastError =
              typeof body?.error === 'string' ? body.error : 'Resposta inválida do servidor.';
            continue;
          }

          const blob = await res.blob();
          if (!blob.size) {
            lastError = 'O servidor retornou um PDF vazio.';
            continue;
          }

          const objectUrl = URL.createObjectURL(blob);
          try {
            const a = document.createElement('a');
            const slug =
              String(empresa.nome_empresa || 'empresa')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase() || 'empresa';
            a.href = objectUrl;
            a.download = `relatorio-${slug}-${mesReport}-${lang}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } finally {
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
          }
          setDownloadError('');
          return;
        } catch (inner: unknown) {
          lastError = inner instanceof Error ? inner.message : lastError;
        }
      }
      throw new Error(lastError);
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : 'Não foi possível gerar o PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6"
      aria-labelledby="relatorio-inteligente-title"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            <h2 id="relatorio-inteligente-title" className="text-base font-semibold text-zinc-100">
              Relatório Inteligente
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Conforme os dados disponíveis no momento. O seletor de idioma abaixo vale apenas para o
            PDF exportado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={mesReport}
            onChange={(event) => setMesReport(event.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950"
            aria-label="Período do relatório"
          >
            {mesesOpcoes.map((month) => (
              <option key={month} value={month}>
                {labelMes(month)}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="hidden sm:inline">Idioma do PDF</span>
            <select
              value={REPORT_LANGS.has(langPdf) ? langPdf : 'pt'}
              onChange={(event) => setLangPdf(event.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100"
              aria-label="Idioma do PDF"
            >
              <option value="pt">PDF · PT</option>
              <option value="en">PDF · EN</option>
              <option value="es">PDF · ES</option>
              <option value="zh">PDF · ZH</option>
            </select>
          </label>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
          >
            <Download size={16} />
            {downloading ? 'Gerando…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {downloadError && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {downloadError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Nota média', stats.average ? stats.average.toFixed(1) : '—'],
          ['Avaliações', stats.total],
          ['Positivas', `${pct(stats.positive, stats.ratedCount)}%`],
          ['Críticas', `${pct(stats.critical, stats.ratedCount)}%`],
        ].map(([itemLabel, value]) => (
          <div key={String(itemLabel)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{itemLabel}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold">Evolução</h3>
          </div>
          {evolution === null ? (
            <p className="text-sm text-zinc-500">Ainda não há dados suficientes para calcular a tendência.</p>
          ) : (
            <p className="text-sm text-zinc-300">
              A média das avaliações recentes variou{' '}
              <strong>
                {evolution.delta > 0 ? '+' : ''}
                {evolution.delta.toFixed(1)}
              </strong>{' '}
              ponto(s) no período acompanhado.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <h3 className="text-sm font-semibold mb-3">Sentimento</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-emerald-400">Positivo</p>
              <p className="text-xl font-bold">{stats.sentiment.positivo}</p>
            </div>
            <div>
              <p className="text-xs text-amber-300">Neutro</p>
              <p className="text-xl font-bold">{stats.sentiment.neutro}</p>
            </div>
            <div>
              <p className="text-xs text-red-400">Negativo</p>
              <p className="text-xl font-bold">{stats.sentiment.negativo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold">Principais pontos positivos</h3>
          </div>
          {stats.positive === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum ponto positivo identificado neste período.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• {stats.positive} avaliação(ões) com 4 ou 5 estrelas.</li>
              {stats.themes.slice(0, 3).map((theme) => (
                <li key={theme.name}>
                  • Tema recorrente: <span className="text-zinc-100">{theme.name}</span> ({theme.count})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold">Principais pontos de atenção</h3>
          </div>
          {stats.critical === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma avaliação crítica identificada neste período.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• {stats.critical} avaliação(ões) com até 3 estrelas.</li>
              {stats.themes.slice(0, 3).map((theme) => (
                <li key={theme.name}>
                  • Acompanhar: <span className="text-zinc-100">{theme.name}</span> ({theme.count})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-indigo-300" />
          <h3 className="text-sm font-semibold">Recomendações</h3>
        </div>
        {recommendations.length ? (
          <ul className="space-y-2 text-sm text-zinc-300">
            {recommendations.map((recommendation) => (
              <li key={recommendation}>• {recommendation}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Sem recomendações suficientes para este período.</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
        Relatório conforme os dados disponíveis no momento
        {selectedMonth ? (
          <>
            {' '}(
            <span className="text-zinc-300">{labelMes(selectedMonth)}</span>)
          </>
        ) : null}
        . Os indicadores reutilizam as avaliações do painel. O idioma do seletor aplica-se somente ao
        arquivo PDF.
      </div>
    </section>
  );
}
