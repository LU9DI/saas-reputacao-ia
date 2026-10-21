"use client";

import { useMemo, useState } from 'react';

function numeric(value: string, fallback: number, min: number, max: number, integer = false) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const bounded = Math.min(max, Math.max(min, parsed));
  return integer ? Math.floor(bounded) : bounded;
}

export function RatingCalculator() {
  const [currentRating, setCurrentRating] = useState('4.2');
  const [reviewCount, setReviewCount] = useState('100');
  const [targetRating, setTargetRating] = useState('4.7');
  const [futureAverage, setFutureAverage] = useState('5');

  const result = useMemo(() => {
    const current = numeric(currentRating, 4.2, 1, 5);
    const count = numeric(reviewCount, 100, 1, 100000000, true);
    const target = numeric(targetRating, 4.7, 1, 5);
    const expected = numeric(futureAverage, 5, 1, 5);
    if (target <= current) return { kind: 'already', count: 0, current, target, expected };
    if (expected <= target) return { kind: 'impossible', count: null, current, target, expected };
    const needed = Math.max(0, Math.ceil((count * (target - current)) / (expected - target)));
    return { kind: 'estimate', count: needed, current, target, expected };
  }, [currentRating, reviewCount, targetRating, futureAverage]);

  const number = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
  const fieldClass = 'mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-base text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20';
  const labelClass = 'block text-sm font-medium text-zinc-200';

  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 sm:p-6" aria-labelledby="calculadora-title">
      <h2 id="calculadora-title" className="text-xl font-semibold text-zinc-50">Calcule sua meta de avaliações</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Informe a nota atual, o total de avaliações e a nota que deseja alcançar. O cálculo considera uma média para as próximas avaliações.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="current-rating">Nota atual (1 a 5)</label>
          <input id="current-rating" className={fieldClass} type="number" min="1" max="5" step="0.1" inputMode="decimal" value={currentRating} onChange={(event) => setCurrentRating(event.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="review-count">Total de avaliações atuais</label>
          <input id="review-count" className={fieldClass} type="number" min="1" max="100000000" step="1" inputMode="numeric" value={reviewCount} onChange={(event) => setReviewCount(event.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="target-rating">Nota desejada (1 a 5)</label>
          <input id="target-rating" className={fieldClass} type="number" min="1" max="5" step="0.1" inputMode="decimal" value={targetRating} onChange={(event) => setTargetRating(event.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="future-average">Média esperada das novas avaliações</label>
          <input id="future-average" className={fieldClass} type="number" min="1" max="5" step="0.1" inputMode="decimal" value={futureAverage} onChange={(event) => setFutureAverage(event.target.value)} />
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5" aria-live="polite">
        {result.kind === 'already' ? (
          <>
            <p className="text-sm font-medium text-indigo-200">Sua nota informada já alcança a meta</p>
            <p className="mt-1 text-2xl font-bold text-white">0 avaliações adicionais para a meta matemática</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">Continue solicitando feedback de forma neutra e acompanhe a experiência dos clientes; a nota pode variar com novas avaliações.</p>
          </>
        ) : result.kind === 'impossible' ? (
          <>
            <p className="text-sm font-medium text-amber-200">Meta incompatível com a média informada</p>
            <p className="mt-1 text-lg font-semibold text-white">A média das novas avaliações precisa ser maior que {number(result.target)}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">Com a média esperada atual, a nota acumulada não alcançará a meta matemática. Ajuste a meta ou a média esperada para simular outro cenário.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-indigo-200">Estimativa de avaliações adicionais</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-white">{number(result.count ?? 0)}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Com nota atual de {number(result.current)}, {number(numeric(reviewCount, 100, 1, 100000000, true))} avaliações e média {number(result.expected)} nas novas avaliações, seriam necessárias aproximadamente {number(result.count ?? 0)} avaliações para atingir {number(result.target)} pela fórmula de média.
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Estimativa matemática, não previsão do Google. A nota exibida pode ser arredondada, o histórico real pode diferir do valor informado e avaliações podem levar tempo para atualizar. Nunca condicione benefícios a avaliações positivas nem selecione apenas clientes satisfeitos para pedir avaliações.
      </p>
    </section>
  );
}
