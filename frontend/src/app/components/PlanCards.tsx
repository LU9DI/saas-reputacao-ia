'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';
import { ComoFunciona } from './ComoFunciona';

export type PlanCard = {
  key: string;
  label: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  /** true = assinatura mensal (texto de cancelamento Netflix-style) */
  mensal?: boolean;
};

const DEFAULT_PLANS: PlanCard[] = [
  {
    key: 'pro',
    label: 'Pro',
    price: 'R$ 69,90',
    period: '/mês',
    features: ['150 avaliações/mês', 'WhatsApp integrado', 'Gráficos básicos'],
    mensal: true,
  },
  {
    key: 'pro-anual',
    label: 'Pro Anual',
    price: 'R$ 49,90',
    period: '/mês (cobrança anual)',
    features: ['150 avaliações/mês', 'Economia no anual', 'WhatsApp integrado'],
    mensal: false,
  },
  {
    key: 'ultra',
    label: 'Ultra',
    price: 'R$ 199,90',
    period: '/mês',
    features: ['1.000 avaliações/mês', 'Respostas com IA', '1 relatório PDF/mês'],
    highlight: true,
    mensal: true,
  },
  {
    key: 'corporate',
    label: 'Corporativo',
    price: 'R$ 499,90',
    period: '/mês',
    features: ['Avaliações ilimitadas', 'IA sem limites', 'Dashboard multi-unidades'],
    mensal: true,
  },
];

const TEXTO_CANCELAMENTO_MENSAL =
  'A assinatura mensal poderá ser cancelada a qualquer momento. Em caso de cancelamento antes do término do ciclo, o acesso permanece ativo até o último dia do período já pago — sem cobrança adicional no mês seguinte.';

type Props = {
  empresaId?: string | null;
  requireEmpresa?: boolean;
  /** Exibe o bloco "Como funciona" abaixo dos planos (padrão: sim) */
  showComoFunciona?: boolean;
};

export function PlanCards({ empresaId, requireEmpresa = false, showComoFunciona = true }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const irParaCheckout = async (planoKey: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro('Ative o período de testes acima antes de assinar um plano.');
      return;
    }
    setLoading(planoKey);
    try {
      const apiUrl = getEnv('NEXT_PUBLIC_API_URL');
      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      if (!data.checkout_url) throw new Error('URL de checkout ausente.');
      window.location.href = data.checkout_url;
    } catch (e: any) {
      setErro(e.message || 'Erro ao abrir checkout');
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-slate-900">Escolha o plano mais adequado</h2>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Ao selecionar um plano, você será direcionado à página segura do Stripe para cadastrar o
          meio de pagamento.
        </p>
        <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left sm:text-center">
          {TEXTO_CANCELAMENTO_MENSAL}
        </p>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
          {erro}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEFAULT_PLANS.map((p) => (
          <div
            key={p.key}
            className={`rounded-2xl border p-4 flex flex-col bg-white ${
              p.highlight ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : 'border-slate-200'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {p.price}
              <span className="text-xs font-normal text-slate-400">{p.period}</span>
            </p>
            <ul className="mt-3 space-y-1.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="text-xs text-slate-600 leading-snug">
                  • {f}
                </li>
              ))}
              {p.mensal && (
                <li className="text-xs text-slate-500 leading-snug pt-1">
                  • Cancelamento a qualquer momento, com uso até o fim do ciclo pago
                </li>
              )}
            </ul>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => irParaCheckout(p.key)}
              className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${\n                p.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {loading === p.key ? 'Abrindo Stripe…' : 'Assinar com cartão'}
            </button>
          </div>
        ))}
      </div>

      {showComoFunciona && <ComoFunciona />}
    </div>
  );
}
