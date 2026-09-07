'use client';

import { useEffect, useState } from 'react';
import { getEnv } from '../utils/env';
import { ComoFunciona } from './ComoFunciona';
import { PixCheckoutModal } from './PixCheckoutModal';
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
  Layers,
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
    features: ['100 feedbacks/mês', 'WPP Integrado', 'Gráficos básicos'],
    missingFeatures: ['Integrado com IA'],
  },
  {
    keyMensal: 'pro',
    keyAnual: 'pro-anual',
    label: 'Pro',
    priceMensal: 'R$ 109,90',
    priceAnual: 'R$ 99,90',
    features: ['300 feedbacks/mês', 'WPP Integrado', 'Gráficos básicos', '1 Relatório PDF/mês'],
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
      'IA Ativa',
      '1 Relatório PDF/mês',
      'Dashboard com análises',
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
  email?: string | null;
};

function formatPriceDisplay(price: string): string {
  return String(price || '')
    .replace(/\u00a0/g, ' ')
    .replace(/R\$\s+/g, 'R$\u00a0')
    .trim();
}

export function PlanCards({
  empresaId,
  requireEmpresa = false,
  showComoFunciona = true,
  email,
}: Props) {
  const [plans, setPlans] = useState<PlanCard[]>(DEFAULT_PLANS);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal');
  const [pixOpen, setPixOpen] = useState(false);
  const [pixPlano, setPixPlano] = useState<{ key: string; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiUrl = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

    const carregar = async () => {
      try {
        const planosRes = await fetch(`${apiUrl}/api/planos`, { cache: 'no-store' });
        if (planosRes.ok) {
          const data = await planosRes.json();
          const list = Array.isArray(data.planos) ? data.planos : [];
          if (list.length && !cancelled) {
            setPlans(
              list.map((p: any) => ({
                keyMensal: p.keyMensal || p.plan,
                keyAnual: p.keyAnual || `${p.plan}-anual`,
                label: p.label || p.plan,
                priceMensal: p.priceMensal,
                priceAnual: p.priceAnual,
                features: Array.isArray(p.features) ? p.features : [],
                missingFeatures: Array.isArray(p.missingFeatures) ? p.missingFeatures : [],
                highlight: Boolean(p.highlight),
              }))
            );
          }
        }
      } catch {
        /* mantém defaults */
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    };

    carregar();
    const id = window.setInterval(carregar, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
        body: JSON.stringify({ plano: planoKey, empresa_id: empresaId || undefined }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`API respondeu sem JSON (${res.status}).`);
      }
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error(
            data.error || 'Stripe não configurado. Defina STRIPE_SECRET_KEY no backend/.env.'
          );
        }
        throw new Error(data.error || `Não foi possível iniciar o pagamento (${res.status}).`);
      }
      const url = data.checkout_url || data.url;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL de checkout inválida.');
      }
      window.location.assign(url);
    } catch (e: any) {
      if (e?.name === 'AbortError') setErro('Tempo esgotado. Backend na porta 5000?');
      else if (String(e?.message || '').includes('Failed to fetch'))
        setErro('Não conectou na API. Suba o backend.');
      else setErro(e.message || 'Erro ao abrir checkout');
      setLoading(null);
    }
  };

  const irParaPayPal = async (planoKey: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro('Ative o período de testes acima antes de assinar um plano.');
      return;
    }
    setLoading(`paypal-${planoKey}`);
    try {
      const apiUrl = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
          email: email || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 503
              ? 'PayPal não configurado (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).'
              : `Erro PayPal ${res.status}`)
        );
      }
      const url = data.approve_url || data.approveUrl;
      if (!url) throw new Error('PayPal não retornou link de pagamento.');
      window.location.assign(url);
    } catch (e: any) {
      setErro(e.message || 'Erro no PayPal');
      setLoading(null);
    }
  };

  const abrirPix = (planoKey: string, label: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro('Ative o período de testes acima antes de assinar um plano.');
      return;
    }
    setPixPlano({ key: planoKey, label });
    setPixOpen(true);
  };

  const irParaRecorrente = async (planoKey: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro('Ative o período de testes acima antes de assinar um plano.');
      return;
    }
    if (!email) {
      setErro('Informe o e-mail no cadastro do trial para Pix recorrente.');
      return;
    }
    setLoading(`pix-rec-${planoKey}`);
    try {
      const apiUrl = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/pix/recorrente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
          email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 503
              ? 'Pix não configurado. No backend/.env defina MP_ACCESS_TOKEN (Mercado Pago).'
              : `Erro ${res.status}`)
        );
      }
      const url = data.init_point || data.authorize_url;
      if (!url) throw new Error('Link de assinatura Pix ausente');
      window.location.assign(url);
    } catch (e: any) {
      setErro(e.message || 'Erro no Pix recorrente');
      setLoading(null);
    }
  };

  const formatarFeature = (text: string, isMissing: boolean = false) => {
    if (isMissing) {
      return (
        <span className="text-slate-400 line-through decoration-slate-400/60 font-normal mt-0.5">
          {text}
        </span>
      );
    }
    const lower = text.toLowerCase();
    const Badge = ({ className, icon: Icon, children }: any) => (
      <span
        className={`font-bold border shadow-sm px-2 py-0.5 rounded align-middle inline-flex items-center gap-1.5 mt-0.5 tracking-tight ${className}`}
      >
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {children}
      </span>
    );
    let icon = null;
    let badgeClass = 'text-indigo-700 bg-indigo-50 border-indigo-200/60';
    if (lower.includes('wpp')) {
      icon = MessageCircle;
      badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
    } else if (lower.includes('ia')) icon = Sparkles;
    else if (lower.includes('pdf')) icon = FileText;
    else if (lower.includes('dashboard') || lower.includes('gráficos') || lower.includes('graficos'))
      icon = BarChart3;
    else if (lower.includes('suporte')) icon = Headset;
    else if (lower.includes('acesso antecipado')) icon = Rocket;
    else if (lower.includes('feedbacks')) icon = Layers;
    if (icon) {
      return (
        <Badge className={badgeClass} icon={icon}>
          {text}
        </Badge>
      );
    }
    return <span className="text-slate-600 font-medium mt-1">{text}</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-whir text-white tracking-tight">
          Deseja continuar depois do período de teste?
        </h2>
        <p className="text-sm text-white max-w-2xl mx-auto font-medium leading-relaxed">
          {['Cartão (Stripe)', 'PayPal', 'Pix'].join(' · ')}
          {loadingPrices ? ' · atualizando preços…' : ''}
        </p>

        <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1 text-sm shadow-inner mt-4">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'mensal'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'anual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
        {plans.map((p) => {
          const key = ciclo === 'mensal' ? p.keyMensal : p.keyAnual;
          const price = formatPriceDisplay(ciclo === 'mensal' ? p.priceMensal : p.priceAnual);
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

                <div className="mb-1">
                  <p className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                    {price}
                  </p>
                  <span className="text-xs font-semibold text-slate-400 mt-1.5 block">{period}</span>
                </div>

                <ul className="mt-6 space-y-3.5 border-t border-slate-100 pt-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-[13px] leading-snug flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-1.5" strokeWidth={3} />
                      {formatarFeature(f, false)}
                    </li>
                  ))}
                  {p.missingFeatures?.map((mf, i) => (
                    <li
                      key={`missing-${i}`}
                      className="text-[13px] leading-snug flex items-start gap-2.5 opacity-75"
                    >
                      <X size={16} className="text-red-400 shrink-0 mt-1" strokeWidth={2.5} />
                      {formatarFeature(mf, true)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => irParaCheckout(key)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
                    p.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900'
                  }`}
                >
                  {loading === key ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading === key ? 'Redirecionando…' : 'Cartão (Stripe)'}
                </button>

                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => irParaPayPal(key)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0070ba] hover:bg-[#005ea6] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === `paypal-${key}` ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading === `paypal-${key}` ? 'Abrindo PayPal…' : 'PayPal'}
                </button>

                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => abrirPix(key, p.label)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  Pix (QR / copia e cola)
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => irParaRecorrente(key)}
                  className="w-full py-2 rounded-xl text-xs font-medium border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {loading === `pix-rec-${key}` ? 'Abrindo…' : 'Pix recorrente'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-sm">
        <div className="bg-emerald-500/20 p-2.5 rounded-full shrink-0">
          <ShieldCheck className="text-emerald-400" size={26} strokeWidth={2.5} />
        </div>
        <p className="text-sm text-white text-center sm:text-left leading-relaxed">
          <strong className="font-bold text-white">Cancele a qualquer momento.</strong> Sem multas. O
          acesso permanece até o fim do período já pago.
        </p>
      </div>

      {showComoFunciona && (
        <div className="pt-10">
          <ComoFunciona />
        </div>
      )}

      <PixCheckoutModal
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        planoKey={pixPlano?.key || ''}
        planoLabel={pixPlano?.label}
        empresaId={empresaId}
        email={email}
      />
    </div>
  );
}
