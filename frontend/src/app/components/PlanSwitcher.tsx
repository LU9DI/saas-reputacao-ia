'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';

const PLANOS = [
  { key: 'inicial', label: 'Inicial' },
  { key: 'pro', label: 'Pro' },
  { key: 'ultra', label: 'Ultra' },
  { key: 'corporativo', label: 'Corporativo' },
  { key: 'rei', label: 'Rei' },
] as const;

type Props = {
  empresaRef: string;
  planAtual?: string;
  enabled?: boolean;
  onChanged?: () => void;
};

export function PlanSwitcher({ empresaRef, planAtual, enabled, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [plan, setPlan] = useState(String(planAtual || 'inicial').toLowerCase());
  const api = getEnv('NEXT_PUBLIC_API_URL');

  if (!enabled) return null;

  const aplicar = async (novo: string) => {
    setLoading(true);
    setMsg('');
    setPlan(novo);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaRef}/plano`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: novo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setMsg(data.mensagem || `Plano ${novo} ativo (teste).`);
      onChanged?.();
    } catch (e: any) {
      setMsg(e.message || 'Falha ao trocar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
          Modo teste — alternar plano
        </p>
        <p className="text-sm text-amber-900/80 mt-1">
          Sem cobrança Stripe. Use para validar PDF e recursos de cada plano.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLANOS.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={loading}
            onClick={() => aplicar(p.key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 ${
              plan === p.key
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {msg && <p className="text-xs text-amber-900">{msg}</p>}
    </section>
  );
}
