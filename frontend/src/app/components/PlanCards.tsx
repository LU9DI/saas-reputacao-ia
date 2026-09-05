'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';
import { ComoFunciona } from './ComoFunciona';
import { 
  Check, 
  X, 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  MessageCircle, 
  FileText, 
  BarChart3, 
  Headset, 
  Rocket,
  Layers
} from 'lucide-react';

export type PlanCard = {
  keyMensal: string;
  keyAnual: string;
  label: string;
  priceMensal: string;
  priceAnual: string;
  features: string[];
  missingFeatures?: string[];
  highlight?: boolean;
};

const DEFAULT_PLANS: PlanCard[] = [
  {
    keyMensal: 'inicial',
    keyAnual: 'inicial-anual',
    label: 'Inicial',
    priceMensal: 'R$ 69,90',
    priceAnual: 'R$ 49,90',
    features: ['150 feedbacks/mês', 'WPP Integrado', 'Gráficos básicos'],
    missingFeatures: ['Integrado com IA'],
  },
  {
    keyMensal: 'pro',
    keyAnual: 'pro-anual',
    label: 'Pro',
    priceMensal: 'R$ 109,90',
    priceAnual: 'R$ 99,90',
    features: ['400 feedbacks/mês', 'WPP Integrado', 'Gráficos básicos', '1 Relatório PDF/mês'],
    missingFeatures: ['Integrado com IA'],
  },
  {
    keyMensal: 'ultra',
    keyAnual: 'ultra-anual',
    label: 'Ultra',
    priceMensal: 'R$ 199,90',
    priceAnual: 'R$ 149,90',
    features: [
      '800 feedbacks/mês',
      'WPP Integrado',
      'Integrado com IA',
      '1 Relatório PDF/mês',
      'Dashboard com análises',
      'Acesso antecipado a novas funções',
    ],
    highlight: true,
  },
  {
    keyMensal: 'corporativo',
    keyAnual: 'corporativo-anual',
    label: 'Corporativo',
    priceMensal: 'R$ 499,90',
    priceAnual: 'R$ 429,90',
    features: [
      '2.500 feedbacks/mês',
      'WPP Integrado',
      'IA Ativa',
      '1 Relatório PDF/mês',
      'Dashboard Multi-unidades',
      'Suporte Prioritário',
      'Acesso antecipado a novas funções',
    ],
  },
  {
    keyMensal: 'rei',
    keyAnual: 'rei-anual',
    label: 'REI',
    priceMensal: 'R$ 999,90',
    priceAnual: 'R$ 899,90',
    features: [
      '8.000 feedbacks/mês',
      'WPP Integrado',
      'IA Ativa',
      '1 Relatório PDF/mês',
      'Dashboard Multi-unidades',
      'Suporte Prioritário',
      'Acesso antecipado a novas funções',
    ],
  },
];

type Props = {
  empresaId?: string | null;
  requireEmpresa?: boolean;
  showComoFunciona?: boolean;
};

export function PlanCards({ empresaId, requireEmpresa = false, showComoFunciona = true }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal');

  const irParaCheckout = async (planoKey: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro('Ative o período de testes acima antes de assinar um plano.');
      return;
    }
    setLoading(planoKey);
    try {
      const apiUrl = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`API respondeu sem JSON (${res.status}). Confira se o backend está em ${apiUrl}.`);
      }

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error(
            data.error ||
              'Stripe não configurado. No backend/.env defina STRIPE_SECRET_KEY=sk_test_... e reinicie a API.'
          );
        }
        throw new Error(data.error || `Não foi possível iniciar o pagamento (${res.status}).`);
      }

      const url = data.checkout_url || data.url;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL de checkout ausente ou inválida. Verifique STRIPE_SECRET_KEY no backend.');
      }

      window.location.assign(url);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setErro('Tempo esgotado ao falar com a API. Backend está rodando na porta 5000?');
      } else if (String(e?.message || '').includes('Failed to fetch')) {
        setErro(
          'Não conectou na API. Suba o backend (cd backend && npm run dev) e confira NEXT_PUBLIC_API_URL.'
        );
      } else {
        setErro(e.message || 'Erro ao abrir checkout');
      }
      setLoading(null);
    }
  };

  const formatarFeature = (text: string, isMissing: boolean = false) => {
    if (isMissing) {
      return (
        <span className="text-slate-400 line-through decoration-slate-400/60 font-normal mt-0.5">{text}</span>
      );
    }

    const lower = text.toLowerCase();

    const Badge = ({ className, icon: Icon, children }: any) => (
      <span className={`font-bold border shadow-sm px-2 py-0.5 rounded align-middle inline-flex items-center gap-1.5 mt-0.5 tracking-tight ${className}`}>
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {children}
      </span>
    );

    let icon = null;
    let badgeClass = "text-indigo-700 bg-indigo-50 border-indigo-200/60";

    if (lower.includes('wpp')) {
      icon = MessageCircle;
      badgeClass = "text-emerald-700 bg-emerald-50 border-emerald-200/60";
    } else if (lower.includes('ia')) {
      icon = Sparkles;
    } else if (lower.includes('pdf')) {
      icon = FileText;
    } else if (lower.includes('dashboard') || lower.includes('gráficos')) {
      icon = BarChart3;
    } else if (lower.includes('suporte')) {
      icon = Headset;
    } else if (lower.includes('acesso antecipado')) {
      icon = Rocket;
    } else if (lower.includes('feedbacks')) {
      icon = Layers;
    }

    if (icon) {
      return <Badge className={badgeClass} icon={icon}>{text}</Badge>;
    }

    return <span className="text-slate-600 font-medium mt-1">{text}</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deseja continuar depois do período de teste?</h2>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Escolha o plano ideal. O pagamento é processado com segurança pelo Stripe.
        </p>

        <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1 text-sm shadow-inner mt-4">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'mensal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'anual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center max-w-3xl mx-auto">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
        {DEFAULT_PLANS.map((p) => {
          const key = ciclo === 'mensal' ? p.keyMensal : p.keyAnual;
          const price = ciclo === 'mensal' ? p.priceMensal : p.priceAnual;
          const period = ciclo === 'mensal' ? '/mês' : 'cobrança anual';

          return (
            <div
              key={p.label}
              className={`rounded-2xl p-6 flex flex-col justify-between bg-white min-w-0 transition-all duration-300 ${
                p.highlight
                  ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-900/20 transform md:-translate-y-2'
                  : 'border border-slate-200 hover:border-indigo-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.label}</p>
                  {p.highlight && (
                    <span className="bg-indigo-600 text-white text-[9px] tracking-widest font-black py-1 px-2.5 rounded-full uppercase shadow-sm">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-3xl font-black text-slate-900 tracking-tight flex flex-col">
                  {price}
                  <span className="text-xs font-semibold text-slate-400 mt-1">{period}</span>
                </p>

                <ul className="mt-6 space-y-3.5 border-t border-slate-100 pt-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-[13px] leading-snug flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-1.5" strokeWidth={3} />
                      {formatarFeature(f, false)}
                    </li>
                  ))}
                  {p.missingFeatures?.map((mf, i) => (
                    <li key={`missing-${i}`} className="text-[13px] leading-snug flex items-start gap-2.5 opacity-75">
                      <X size={16} className="text-red-400 shrink-0 mt-1" strokeWidth={2.5} />
                      {formatarFeature(mf, true)}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={!!loading}
                onClick={() => irParaCheckout(key)}
                className={`mt-8 w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  p.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900'
                }`}
              >
                {loading === key ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading === key ? 'Redirecionando…' : 'Assinar plano'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-sm">
        <div className="bg-emerald-500/20 p-2.5 rounded-full shrink-0">
          <ShieldCheck className="text-emerald-400" size={26} strokeWidth={2.5} />
        </div>
        <p className="text-sm text-emerald-900 text-center sm:text-left leading-relaxed">
          <strong className="font-bold text-emerald-950">Cancele a qualquer momento.</strong> Sem multas. O acesso
          permanece até o fim do período já pago.
        </p>
      </div>

      {showComoFunciona && (
        <div className="pt-10">
          <ComoFunciona />
        </div>
      )}
    </div>
  );
}