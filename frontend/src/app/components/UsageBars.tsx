'use client';

type Props = {
  feedbackUsados?: number;
  feedbackLimite?: number;
  tokensUsados?: number;
  tokensLimite?: number;
  temIa?: boolean;
};

function Bar({
  label,
  used,
  limit,
  color,
  hint,
}: {
  label: string;
  used: number;
  limit: number;
  color: string;
  hint?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const warn = pct >= 85;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className={warn ? 'text-amber-400 font-medium' : 'text-zinc-300'}>
          {used.toLocaleString('pt-BR')} / {limit.toLocaleString('pt-BR')}
          {limit > 0 ? ` (${pct}%)` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${limit > 0 ? pct : 0}%` }}
        />
      </div>
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export function UsageBars({
  feedbackUsados = 0,
  feedbackLimite = 0,
  tokensUsados = 0,
  tokensLimite = 0,
  temIa = false,
}: Props) {
  if (feedbackLimite <= 0 && !temIa) return null;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 space-y-4">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Uso do mês</p>
      {feedbackLimite > 0 && (
        <Bar
          label="Avaliações (feedbacks)"
          used={feedbackUsados}
          limit={feedbackLimite}
          color={feedbackUsados / feedbackLimite >= 0.85 ? 'bg-amber-500' : 'bg-indigo-500'}
          hint="Limite mensal do plano. Inclui positivas e críticas."
        />
      )}
      {temIa && (
        <Bar
          label="Tokens de IA"
          used={tokensUsados}
          limit={tokensLimite}
          color={
            tokensLimite > 0 && tokensUsados / tokensLimite >= 0.85
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }
          hint={
            tokensLimite === 0
              ? 'Este plano não inclui IA.'
              : 'Respostas e tags de críticas. PDF não consome tokens.'
          }
        />
      )}
      {!temIa && (
        <p className="text-xs text-zinc-500">
          Plano sem IA (Inicial/Pro). Upgrade para Ultra+ libera respostas automáticas.
        </p>
      )}
    </section>
  );
}
