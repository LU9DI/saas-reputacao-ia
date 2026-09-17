'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, Lightbulb, TrendingUp } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';

type Review = {
  rating: number;
  comment?: string | null;
  sentiment?: string | null;
  ai_tags?: string[];
  createdAt?: string;
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
  empresa: { nome_empresa?: string; plan?: string };
  metricas: any;
  reviews: Review[];
};

function safeDate(v?: string) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function pct(v: number, total: number) {
  return total ? Math.round((v / total) * 100) : 0;
}

export function RelatorioInteligentePanel({
  empresaId,
  api,
  authHeaders,
  mesReport,
  langReport,
  mesesOpcoes,
  labelMes,
  onMesChange,
  onLangChange,
  language,
  empresa,
  metricas,
  reviews,
}: Props) {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);

  const monthReviews = useMemo(() => {
    return reviews.filter((r) => String(r.createdAt || '').startsWith(mesReport));
  }, [reviews, mesReport]);

  const stats = useMemo(() => {
    const total = monthReviews.length;
    const positive = monthReviews.filter((r) => Number(r.rating) >= 4).length;
    const critical = monthReviews.filter((r) => Number(r.rating) <= 3).length;
    const average = total
      ? Math.round((monthReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total) * 10) / 10
      : 0;
    const sentiment = { positivo: 0, neutro: 0, negativo: 0 };
    for (const r of monthReviews) {
      const s = String(r.sentiment || '').toLowerCase();
      if (s.includes('pos')) sentiment.positivo++;
      else if (s.includes('neg')) sentiment.negativo++;
      else if (s.includes('neu')) sentiment.neutro++;
      else if (Number(r.rating) >= 4) sentiment.positivo++;
      else if (Number(r.rating) <= 2) sentiment.negativo++;
      else sentiment.neutro++;
    }
    const tagCounts: Record<string, number> = {};
    for (const r of monthReviews) {
      for (const tag of r.ai_tags || []) {
        const key = String(tag).trim();
        if (key) tagCounts[key] = (tagCounts[key] || 0) + 1;
      }
    }
    const themes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
    return { total, positive, critical, average, sentiment, themes };
  }, [monthReviews]);

  const trend = useMemo(() => {
    const points = (metricas?.serie_14d || []).filter((p: any) => Number(p.total) > 0);
    if (points.length < 2) return null;
    const first = Number(points[0].media || 0);
    const last = Number(points[points.length - 1].media || 0);
    if (!first || !last) return null;
    return Math.round((last - first) * 10) / 10;
  }, [metricas]);

  const recommendations = useMemo(() => {
    const out: string[] = [];
    if (!stats.total) {
      out.push('Ainda não há avaliações registradas neste período. Concentre-se em gerar novas avaliações para obter uma leitura confiável.');
    } else {
      if (stats.critical > stats.positive) {
        out.push('Priorize o tratamento das avaliações críticas e identifique os problemas recorrentes antes de buscar novas avaliações.');
      }
      if (stats.average < 4) {
        out.push('Analise as causas das notas baixas e transforme os principais motivos de reclamação em ações operacionais concretas.');
      }
      if (stats.positive >= stats.critical) {
        out.push('Mantenha os pontos que geram avaliações positivas e use esses padrões como referência para o atendimento.');
      }
      if (stats.sentiment.negativo > stats.sentiment.positivo) {
        out.push('O sentimento negativo merece atenção imediata: acompanhe as próximas avaliações para verificar se o cenário está se repetindo.');
      }
      if (stats.themes.length) {
        out.push(`Monitore o tema “${stats.themes[0].name}”, que aparece com maior frequência entre os temas identificados.`);
      }
    }
    return out.slice(0, 4);
  }, [stats]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `${api}/api/empresa/${empresaId}/relatorio.pdf?mes=${encodeURIComponent(mesReport)}&lang=${encodeURIComponent(langReport || language || 'pt')}`,
        { credentials: 'include', headers: authHeaders(false) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${String(empresa.nome_empresa || 'empresa').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${mesReport}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      window.alert(e?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">Relatório de Reputação</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Visão executiva do desempenho da reputação no período selecionado, com pontos positivos, pontos de atenção e próximos passos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={mesReport} onChange={(e) => onMesChange(e.target.value)} className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950">
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
        {[
          ['Nota média', stats.average ? stats.average.toFixed(1) : '—'],
          ['Avaliações', stats.total],
          ['Positivas', `${pct(stats.positive, stats.total)}%`],
          ['Críticas', `${pct(stats.critical, stats.total)}%`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-indigo-400" /><h3 className="text-sm font-semibold">Evolução</h3></div>
          {trend === null ? (
            <p className="text-sm text-zinc-500">Ainda não há dados suficientes para calcular a tendência.</p>
          ) : (
            <p className="text-sm text-zinc-300">A média das avaliações recentes variou <strong>{trend > 0 ? '+' : ''}{trend.toFixed(1)}</strong> ponto(s) no período acompanhado.</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <h3 className="text-sm font-semibold mb-3">Sentimento</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xs text-emerald-400">Positivo</p><p className="text-xl font-bold">{stats.sentiment.positivo}</p></div>
            <div><p className="text-xs text-amber-300">Neutro</p><p className="text-xl font-bold">{stats.sentiment.neutro}</p></div>
            <div><p className="text-xs text-red-400">Negativo</p><p className="text-xl font-bold">{stats.sentiment.negativo}</p></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={16} className="text-emerald-400" /><h3 className="text-sm font-semibold">Principais pontos positivos</h3></div>
          {stats.positive === 0 ? <p className="text-sm text-zinc-500">Nenhum ponto positivo identificado neste período.</p> : (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• {stats.positive} avaliação(ões) com 4 ou 5 estrelas.</li>
              {stats.themes.slice(0, 3).map((x) => <li key={x.name}>• Tema recorrente: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-400" /><h3 className="text-sm font-semibold">Principais pontos de atenção</h3></div>
          {stats.critical === 0 ? <p className="text-sm text-zinc-500">Nenhuma avaliação crítica identificada neste período.</p> : (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• {stats.critical} avaliação(ões) com até 3 estrelas.</li>
              {stats.themes.slice(0, 3).map((x) => <li key={x.name}>• Acompanhar: <span className="text-zinc-100">{x.name}</span> ({x.count})</li>)}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-indigo-300" /><h3 className="text-sm font-semibold">Recomendações</h3></div>
        <ul className="space-y-2 text-sm text-zinc-300">
          {recommendations.map((r) => <li key={r}>• {r}</li>)}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
        Relatório referente a <span className="text-zinc-300">{labelMes(mesReport)}</span>. Os indicadores são calculados a partir das avaliações disponíveis no Filtra.AI; o PDF é uma exportação separada do relatório mensal.
      </div>
    </section>
  );
}
