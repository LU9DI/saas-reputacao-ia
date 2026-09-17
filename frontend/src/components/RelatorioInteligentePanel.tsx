'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';

type Review = {
  rating?: unknown;
  comment?: unknown;
  sentiment?: unknown;
  ai_tags?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  is_test?: unknown;
};

type PanelData = {
  empresa?: Record<string, unknown>;
  metricas?: Record<string, unknown>;
  reviews?: Review[];
};

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

function finiteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validRating(value: unknown): number | null {
  const n = finiteNumber(value, NaN);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

function reviewDate(r: Review): string {
  return String(r.createdAt ?? r.created_at ?? '').trim();
}

function normalizedSentiment(value: unknown): 'positivo' | 'neutro' | 'negativo' | null {
  const s = String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('pos')) return 'positivo';
  if (s.includes('neg')) return 'negativo';
  if (s.includes('neu')) return 'neutro';
  return null;
}

function safeFileName(value: unknown): string {
  const name = String(value ?? 'empresa').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return name || 'empresa';
}

function pct(v: number, total: number): number {
  return total > 0 ? Math.round((v / total) * 100) : 0;
}

export function RelatorioInteligentePanel({ empresaId, api, authHeaders, mesReport, langReport, mesesOpcoes, labelMes, onMesChange, onLangChange, language, panelData }: Props) {
  const [downloading, setDownloading] = useState(false);

  const empresa = panelData?.empresa ?? {};
  const metricas = panelData?.metricas ?? {};
  const reviews = useMemo(() => {
    if (!Array.isArray(panelData?.reviews)) return [];
    return panelData.reviews.filter((r) => r && r.is_test !== true && r.is_test !== 'true');
  }, [panelData?.reviews]);

  const monthReviews = useMemo(() => reviews.filter((r) => reviewDate(r).startsWith(mesReport)), [reviews, mesReport]);

  const stats = useMemo(() => {
    let total = 0;
    let positive = 0;
    let critical = 0;
    let ratingSum = 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    const tagCounts: Record<string, number> = {};

    for (const review of monthReviews) {
      const rating = validRating(review.rating);
      if (rating !== null) {
        total++;
        ratingSum += rating;
        if (rating >= 4) positive++;
        if (rating <= 3) critical++;
      }
      const s = normalizedSentiment(review.sentiment);
      if (s) sentiment[s]++;
      else if (rating !== null) {
        if (rating >= 4) sentiment.positivo++;
        else if (rating <= 2) sentiment.negativo++;
        else sentiment.neutro++;
      }
      const tags = Array.isArray(review.ai_tags) ? review.ai_tags : [];
      for (const rawTag of tags) {
        const tag = String(rawTag ?? '').trim();
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const themes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return { total, positive, critical, average: total ? Math.round((ratingSum / total) * 10) / 10 : 0, sentiment, themes };
  }, [monthReviews]);

  const trend = useMemo(() => {
    const raw = Array.isArray(metricas.serie_14d) ? metricas.serie_14d : [];
    const points = raw
      .map((p: any) => ({ total: finiteNumber(p?.total), media: finiteNumber(p?.media, NaN) }))
      .filter((p) => p.total > 0 && Number.isFinite(p.media));
    if (points.length < 2) return null;
    const first = points[0].media;
    const last = points[points.length - 1].media;
    return Math.round((last - first) * 10) / 10;
  }, [metricas.serie_14d]);

  const trendLabel = trend === null ? 'Estável' : trend > 0 ? 'Em melhora' : trend < 0 ? 'Em atenção' : 'Estável';

  const recommendations = useMemo(() => {
    const out: string[] = [];
    if (!stats.total) return ['Não há avaliações válidas neste período para gerar recomendações específicas.'];
    if (stats.critical > stats.positive) out.push('Priorize o tratamento das avaliações de até 3 estrelas e identifique os motivos recorrentes.');
    if (stats.average < 4) out.push('Analise as causas das notas baixas e transforme os principais motivos de reclamação em ações operacionais.');
    if (stats.positive >= stats.critical) out.push('Mantenha os pontos que geram avaliações positivas e use esses padrões como referência para o atendimento.');
    if (stats.sentiment.negativo > stats.sentiment.positivo) out.push('Acompanhe o sentimento negativo nas próximas avaliações para verificar se a tendência persiste.');
    if (stats.themes.length) out.push(`Monitore o tema “${stats.themes[0].name}”, identificado com maior frequência no período.`);
    if (!out.length) out.push('Continue acompanhando a evolução da reputação e os temas recorrentes nas próximas avaliações.');
    return out.slice(0, 4);
  }, [stats]);

  const downloadPdf = async () => {
    if (downloading || !empresaId || !api) return;
    setDownloading(true);
    try {
      const res = await fetch(`${api}/api/empresa/${encodeURIComponent(empresaId)}/relatorio.pdf?mes=${encodeURIComponent(mesReport)}&lang=${encodeURIComponent(langReport || language || 'pt')}`, {
        credentials: 'include',
        headers: authHeaders(false),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String(data?.error || `Erro ${res.status}`));
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error('O servidor retornou um PDF vazio.');
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${safeFileName(empresa.nome_empresa)}-${mesReport}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e: unknown) {
      console.error('[relatorio-inteligente] PDF:', e);
      window.alert(e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6" aria-labelledby="relatorio-inteligente-title">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><FileText size={18} className="text-indigo-400" /><h2 id="relatorio-inteligente-title" className="text-base font-semibold text-zinc-100">Relatório Inteligente</h2></div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">Visão executiva baseada nos dados e métricas já disponíveis no painel.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={mesReport} onChange={(e) => onMesChange(e.target.value)} className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950" aria-label="Período do relatório">
            {mesesOpcoes.map((m) => <option key={m} value={m}>{labelMes(m)}</option>)}
          </select>
          <select value={langReport} onChange={(e) => onLangChange(e.target.value)} className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950" aria-label="Idioma do relatório">
            <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option><option value="zh">ZH</option>
          </select>
          <button type="button" onClick={downloadPdf} disabled={downloading} className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50">
            <Download size={16} />{downloading ? 'Gerando…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[["Nota média", stats.average ? stats.average.toFixed(1) : '—'], ["Avaliações", stats.total], ["Positivas", `${pct(stats.positive, stats.total)}%`], ["Críticas", `${pct(stats.critical, stats.total)}%`]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"><p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value}</p></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-indigo-400" /><h3 className="text-sm font-semibold">Evolução</h3></div><p className="text-sm text-zinc-300"><strong>{trendLabel}</strong>{trend === null ? ' — dados insuficientes para comparar períodos.' : ` — variação de ${trend > 0 ? '+' : ''}${trend.toFixed(1)} ponto(s) na média acompanhada.`}</p></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><h3 className="text-sm font-semibold mb-3">Sentimento</h3><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-emerald-400">Positivo</p><p className="text-xl font-bold">{stats.sentiment.positivo}</p></div><div><p className="text-xs text-amber-300">Neutro</p><p className="text-xl font-bold">{stats.sentiment.neutro}</p></div><div><p className="text-xs text-red-400">Negativo</p><p className="text-xl font-bold">{stats.sentiment.negativo}</p></div></div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><CheckCircle2 size={16} className="text-emerald-400" /><h3 className="text-sm font-semibold">Principais pontos positivos</h3></div>{stats.positive === 0 ? <p className="text-sm text-zinc-500">Nenhum ponto positivo identificado neste período.</p> : <ul className="space-y-2 text-sm text-zinc-300"><li>• {stats.positive} avaliação(ões) com 4 ou 5 estrelas.</li>{stats.themes.slice(0, 3).map((x) => <li key={x.name}>• Tema recorrente: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}</ul>}</div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5"><div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-400" /><h3 className="text-sm font-semibold">Principais pontos de atenção</h3></div>{stats.critical === 0 ? <p className="text-sm text-zinc-500">Nenhuma avaliação crítica identificada neste período.</p> : <ul className="space-y-2 text-sm text-zinc-300"><li>• {stats.critical} avaliação(ões) com até 3 estrelas.</li>{stats.themes.slice(0, 3).map((x) => <li key={x.name}>• Acompanhar: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}</ul>}</div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5"><div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-indigo-300" /><h3 className="text-sm font-semibold">Recomendações</h3></div><ul className="space-y-2 text-sm text-zinc-300">{recommendations.map((r) => <li key={r}>• {r}</li>)}</ul></div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">Relatório referente a <span className="text-zinc-300">{labelMes(mesReport)}</span>. Os indicadores usam as avaliações disponíveis no painel do Filtra.AI.</div>
    </section>
  );
}
