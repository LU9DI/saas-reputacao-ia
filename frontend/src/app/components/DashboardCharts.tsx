'use client';

import { useMemo, useState } from 'react';

const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export type SerieDia = {
  dia: string; // YYYY-MM-DD
  total: number;
  positivas: number;
  negativas: number;
  media: number;
};

type Props = {
  distribuicao: number[];
  positivas: number;
  negativas: number;
  serie?: SerieDia[];
  topTags?: { tag: string; count: number }[];
  nivel: string;
  crises24h?: number;
  alertaCrise?: boolean;
};

function formatDia(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Barras 1–5★ com hover */
function BarDist({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const labels = ['1★', '2★', '3★', '4★', '5★'];
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="flex items-end gap-2 sm:gap-3 h-44 px-1">
        {values.map((v, i) => {
          const h = Math.max((v / max) * 100, v > 0 ? 8 : 2);
          return (
            <button
              key={i}
              type="button"
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end group focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <span
                className={`text-[11px] font-semibold tabular-nums transition-opacity ${
                  hover === i ? 'opacity-100 text-slate-800' : 'opacity-70 text-slate-500'
                }`}
              >
                {v}
              </span>
              <div
                className="w-full max-w-[48px] rounded-t-md transition-all duration-300 ease-out group-hover:brightness-110"
                style={{
                  height: `${h}%`,
                  backgroundColor: STAR_COLORS[i],
                  minHeight: v > 0 ? 10 : 3,
                  boxShadow: hover === i ? `0 0 0 2px ${STAR_COLORS[i]}33` : undefined,
                }}
              />
              <span className="text-[10px] text-slate-400">{labels[i]}</span>
            </button>
          );
        })}
      </div>
      {hover != null && (
        <p className="mt-2 text-center text-xs text-slate-500">
          {labels[hover]}: <strong className="text-slate-800">{values[hover]}</strong> avaliações
        </p>
      )}
    </div>
  );
}

/** Donut interativo */
function DonutMix({ positive, negative }: { positive: number; negative: number }) {
  const total = Math.max(positive + negative, 1);
  const pct = Math.round((positive / total) * 100);
  const r = 38;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const [tip, setTip] = useState<'pos' | 'neg' | null>(null);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="110" height="110" viewBox="0 0 100 100" className="shrink-0">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#fecaca"
          strokeWidth="14"
          className="cursor-pointer"
          onMouseEnter={() => setTip('neg')}
          onMouseLeave={() => setTip(null)}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="cursor-pointer transition-all"
          onMouseEnter={() => setTip('pos')}
          onMouseLeave={() => setTip(null)}
        />
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#0f172a"
          style={{ fontSize: 15, fontWeight: 700 }}
        >
          {pct}%
        </text>
      </svg>
      <div className="text-sm space-y-2">
        <p className={`flex items-center gap-2 ${tip === 'pos' ? 'font-semibold' : ''}`}>
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Positivas (4–5): <strong>{positive}</strong>
        </p>
        <p className={`flex items-center gap-2 ${tip === 'neg' ? 'font-semibold' : ''}`}>
          <span className="w-3 h-3 rounded-full bg-red-300" />
          Críticas (1–3): <strong>{negative}</strong>
        </p>
        {tip && (
          <p className="text-xs text-slate-500">
            {tip === 'pos'
              ? `${pct}% do volume é nota alta`
              : `${100 - pct}% do volume é crítica retida`}
          </p>
        )}
      </div>
    </div>
  );
}

/** Linha de tendência (14 dias) */
function TrendLine({ serie }: { serie: SerieDia[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 320;
  const h = 120;
  const pad = 8;

  const { points, maxY } = useMemo(() => {
    const maxY = Math.max(...serie.map((s) => s.total), 1);
    const points = serie.map((s, i) => {
      const x = pad + (i / Math.max(serie.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (s.total / maxY) * (h - pad * 2);
      return { x, y, ...s };
    });
    return { points, maxY };
  }, [serie]);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area =
    points.length > 0
      ? `${path} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`
      : '';

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full max-w-full h-auto" role="img">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#trendFill)" />}
        {path && (
          <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <g key={p.dia}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5 : 3}
              fill={hover === i ? '#312e81' : '#6366f1'}
              className="cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {(i === 0 || i === points.length - 1 || i % 3 === 0) && (
              <text x={p.x} y={h + 14} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 9 }}>
                {formatDia(p.dia)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hover != null && points[hover] && (
        <p className="text-xs text-slate-600 text-center mt-1">
          {formatDia(points[hover].dia)}: <strong>{points[hover].total}</strong> eval · média{' '}
          <strong>{points[hover].media || '—'}</strong> · +{points[hover].positivas} / −
          {points[hover].negativas}
        </p>
      )}
      {!serie.some((s) => s.total > 0) && (
        <p className="text-xs text-slate-400 text-center">Sem avaliações nos últimos 14 dias.</p>
      )}
      <p className="text-[10px] text-slate-400 text-center mt-1">Escala máx. no período: {maxY}</p>
    </div>
  );
}

/** Barras horizontais de tags */
function TagBars({ tags }: { tags: { tag: string; count: number }[] }) {
  const max = Math.max(...tags.map((t) => t.count), 1);
  return (
    <ul className="space-y-2.5">
      {tags.map((t) => (
        <li key={t.tag} className="flex items-center gap-3 text-sm">
          <span className="w-28 sm:w-36 truncate text-slate-600 text-xs" title={t.tag}>
            {t.tag}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 tabular-nums w-6 text-right">
            {t.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardCharts({
  distribuicao,
  positivas,
  negativas,
  serie = [],
  topTags = [],
  nivel,
  crises24h = 0,
  alertaCrise = false,
}: Props) {
  const showTrend = nivel === 'pro' || nivel === 'ultra' || nivel === 'executivo';
  const showTags = (nivel === 'ultra' || nivel === 'executivo') && topTags.length > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-3">
            Distribuição de notas
          </p>
          <BarDist values={distribuicao} />
        </div>

        <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-3">
            Positivas vs críticas
          </p>
          <DonutMix positive={positivas} negative={negativas} />
          {alertaCrise && (
            <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Alerta: {crises24h} notas ≤2★ nas últimas 24h
            </p>
          )}
        </div>
      </div>

      {showTrend && (
        <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">
            Tendência · últimos 14 dias
          </p>
          <p className="text-xs text-slate-400 mb-3">Volume diário de avaliações (hover nos pontos)</p>
          <TrendLine serie={serie} />
        </div>
      )}

      {showTags && (
        <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4">
            Temas mais citados (IA)
          </p>
          <TagBars tags={topTags} />
        </div>
      )}

      {nivel === 'basico' && (
        <p className="text-xs text-slate-400 text-center">
          Plano Pro+ libera tendência de 14 dias e relatório PDF. Ultra+ mostra tags da IA.
        </p>
      )}
    </div>
  );
}
