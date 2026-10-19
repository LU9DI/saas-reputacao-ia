'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';
import { apiFetch } from '../utils/apiFailover';

const PLANOS = [
  { key: 'trial', label: 'Trial' },
  { key: 'inicial', label: 'Inicial' },
  { key: 'pro', label: 'Pro' },
  { key: 'ultra', label: 'Ultra' },
  { key: 'corporativo', label: 'Corporativo' },
  { key: 'rei', label: 'REI' },
] as const;

type Props = {
  empresaRef: string;
  planAtual?: string;
  enabled?: boolean;
  onChanged?: () => void;
};

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const t = localStorage.getItem('filtra_token');
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

export function PlanSwitcher({ empresaRef, planAtual, enabled, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [plan, setPlan] = useState(String(planAtual || 'trial').toLowerCase());
  const api = getEnv('NEXT_PUBLIC_API_URL');

  if (!enabled) return null;

  const aplicar = async (novo: string) => {
    setLoading(true);
    setMsg('');
    setPlan(novo);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('filtra_token') : null;
      if (!token) {
        throw new Error('Faça login em /login antes de trocar o plano (token ausente).');
      }
      const res = await apiFetch(`/api/empresa/${empresaRef}/plano`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ plan: novo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          data.error ||
            'Sessão inválida. Entre em /login com e-mail e senha da empresa e tente de novo.'
        );
      }
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
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
          Modo teste — alternar plano
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          Sem cobrança Stripe. Use para validar os recursos de cada plano. É preciso estar logado.
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
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-amber-500/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {msg && (
        <p
          className={`text-xs ${
            msg.includes('ativo') || msg.includes('teste') ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {msg}
        </p>
      )}
    </section>
  );
}
