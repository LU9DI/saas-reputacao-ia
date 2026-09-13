'use client';

import { useEffect, useState } from 'react';
import { getEnv } from '../utils/env';
import { MpTransparentCheckout } from './MpTransparentCheckout';
import { useLanguage } from '../Contexts/LanguageContext';
import { Check, X, ShieldCheck, Loader2, Sparkles, MessageCircle, FileText, BarChart3, Headset, Rocket, Layers } from 'lucide-react';

export type PlanCard = {
  keyMensal: string;
  keyAnual: string;
  label: string;
  priceMensal: string;
  priceAnual: string;
  features: string[];
  missingFeatures?: string[];
  highlight?: boolean;
  reviewLimit?: number;
};

const OFFICIAL_LIMITS: Record<string, number> = {
  inicial: 100,
  pro: 300,
  ultra: 800,
  corporativo: 2500,
  rei: 8000,
};

const DEFAULT_PLANS: PlanCard[] = [
  { keyMensal: 'inicial', keyAnual: 'inicial-anual', label: 'Inicial', priceMensal: 'R$\u00a069,90', priceAnual: 'R$\u00a049,90', features: [], reviewLimit: 100 },
  { keyMensal: 'pro', keyAnual: 'pro-anual', label: 'Pro', priceMensal: 'R$\u00a0109,90', priceAnual: 'R$\u00a099,90', features: [], reviewLimit: 300 },
  { keyMensal: 'ultra', keyAnual: 'ultra-anual', label: 'Ultra', priceMensal: 'R$\u00a0199,90', priceAnual: 'R$\u00a0149,90', features: [], highlight: true, reviewLimit: 800 },
  { keyMensal: 'corporativo', keyAnual: 'corporativo-anual', label: 'Corporativo', priceMensal: 'R$\u00a0499,90', priceAnual: 'R$\u00a0429,90', features: [], reviewLimit: 2500 },
  { keyMensal: 'rei', keyAnual: 'rei-anual', label: 'REI', priceMensal: 'R$\u00a0999,90', priceAnual: 'R$\u00a0899,90', features: [], reviewLimit: 8000 },
];

type Props = {
  empresaId?: string | null;
  requireEmpresa?: boolean;
  showComoFunciona?: boolean;
  email?: string | null;
};

function formatPriceDisplay(price: string): string {
  return String(price || '').replace(/\u00a0/g, ' ').replace(/R\$\s+/g, 'R$\u00a0').trim();
}

function resolveLimit(plan: string, fromApi?: number): number {
  return OFFICIAL_LIMITS[plan] ?? (fromApi && fromApi > 0 ? fromApi : 100);
}

function textOrFallback(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

/**
 * Matriz de benefícios (produto):
 * - Inicial: feedbacks + WPP + dashboard — sem relatório e sem IA
 * - Pro: + relatório inteligente — ainda sem IA integrada
 * - Ultra+: + IA ativa + análises / multi-unidade conforme o plano
 */
function featuresForPlan(plan: string, limit: number, t: any) {
  const fb = textOrFallback(t.feat_feedbacks, '{n} feedbacks/mês').replace(
    '{n}',
    limit.toLocaleString(undefined)
  );
  const wpp = textOrFallback(t.feat_wpp, 'WhatsApp integrado');
  const dashboard = textOrFallback(t.feat_basic_charts, 'Dashboard');
  const ai = textOrFallback(t.feat_ai, 'IA integrada');
  const reportFallback =
    t.lang_name === 'English'
      ? 'Smart report'
      : t.lang_name === 'Español'
        ? 'Informe inteligente'
        : t.lang_name === '中文'
          ? '智能报告'
          : 'Relatório inteligente';
  const report = textOrFallback(t.feat_report, reportFallback);
  // NUNCA reutilizar o texto do relatório aqui — bug antigo gerava X duplicado no Pro
  const aiMissing = textOrFallback(t.feat_ai_missing, 'IA integrada');
  const analytics = textOrFallback(t.feat_dashboard, 'Dashboard com análises');
  const multi = textOrFallback(t.feat_multi, 'Dashboard Multi-unidades');
  const support = textOrFallback(t.feat_support, 'Suporte Prioritário');
  const early = textOrFallback(t.feat_early, 'Acesso antecipado a novas funções');

  const map: Record<string, { features: string[]; missing?: string[] }> = {
    inicial: { features: [fb, wpp, dashboard], missing: [report, aiMissing] },
    pro: { features: [fb, wpp, dashboard, report], missing: [aiMissing] },
    ultra: { features: [fb, wpp, ai, report, analytics] },
    corporativo: { features: [fb, wpp, ai, report, multi, support, early] },
    rei: { features: [fb, wpp, ai, report, multi, support, early] },
  };
  return map[plan] || { features: [fb] };
}

export function PlanCards({ empresaId, requireEmpresa = false, email }: Props) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<PlanCard[]>(DEFAULT_PLANS);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal');
  const [mpOpen, setMpOpen] = useState(false);
  const [mpPlano, setMpPlano] = useState<{ key: string; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiUrl = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');
    const carregar = async () => {
      try {
        const planosRes = await fetch(`${apiUrl}/api/planos`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (planosRes.ok) {
          const data = await planosRes.json();
          const list = Array.isArray(data.planos) ? data.planos : [];
          if (list.length && !cancelled) {
            setPlans(
              list.map((p: any) => {
                const plan = String(p.plan || p.keyMensal || '')
                  .replace(/-anual$/, '')
                  .toLowerCase();
                return {
                  keyMensal: p.keyMensal || plan,
                  keyAnual: p.keyAnual || `${plan}-anual`,
                  label: p.label || plan,
                  priceMensal: p.priceMensal,
                  priceAnual: p.priceAnual,
                  features: [],
                  missingFeatures: [],
                  highlight: Boolean(p.highlight),
                  reviewLimit: resolveLimit(plan, Number(p.review_limit)),
                };
              })
            );
          }
        }
      } catch {
        /* defaults */
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    };
    carregar();
    const id = window.setInterval(carregar, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const irParaPayPal = async (planoKey: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro(t.trial_title || 'Ative o trial antes de assinar.');
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
      if (!res.ok) throw new Error(data.error || `PayPal ${res.status}`);
      const url = data.approve_url || data.approveUrl;
      if (!url) throw new Error('PayPal URL missing');
      window.location.assign(url);
    } catch (e: any) {
      setErro(e.message || 'PayPal error');
      setLoading(null);
    }
  };

  const abrirMp = (planoKey: string, label: string) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro(t.trial_title || 'Ative o trial antes de assinar.');
      return;
    }
    setMpPlano({ key: planoKey, label });
    setMpOpen(true);
  };

  const formatarFeature = (text: string, isMissing = false) => {
    if (isMissing) {
      return (
        <span className="text-slate-400 line-through decoration-slate-400/60 font-normal mt-0.5">
          {text}
        </span>
      );
    }
    const lower = String(text).toLowerCase();
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
    if (lower.includes('wpp') || lower.includes('whatsapp')) {
      icon = MessageCircle;
      badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
    } else if (lower.includes('ia') || lower.includes('ai') || lower.includes('智能')) {
      icon = Sparkles;
    } else if (
      lower.includes('relatório') ||
      lower.includes('report') ||
      lower.includes('informe') ||
      lower.includes('报告')
    ) {
      icon = FileText;
    } else if (lower.includes('dashboard') || lower.includes('chart') || lower.includes('graf')) {
      icon = BarChart3;
    } else if (lower.includes('suporte') || lower.includes('support')) {
      icon = Headset;
    } else if (lower.includes('early') || lower.includes('antecip')) {
      icon = Rocket;
    } else if (lower.includes('feedback')) {
      icon = Layers;
    }
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
        <h2 className="text-2xl font-semibold text-white tracking-tight">{t.plans_title}</h2>
        <p className="text-sm text-white max-w-2xl mx-auto font-medium leading-relaxed">
          {[t.pay_paypal || 'PayPal', 'Mercado Pago'].join(' · ')}
          {loadingPrices ? ` · ${t.updating_prices}` : ''}
        </p>
        <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1 text-sm shadow-inner mt-4">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'mensal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.monthly}
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              ciclo === 'anual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.yearly}
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
          const period = ciclo === 'mensal' ? t.per_month : t.annual_billing;
          const planBase = String(p.keyMensal || '')
            .replace(/-anual$/, '')
            .toLowerCase();
          const localized = featuresForPlan(planBase, resolveLimit(planBase, p.reviewLimit), t);
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
                      {t.popular}
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
                  {localized.features.map((f, i) => (
                    <li key={i} className="text-[13px] leading-snug flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-1.5" strokeWidth={3} />
                      {formatarFeature(f, false)}
                    </li>
                  ))}
                  {(localized.missing || []).map((mf, i) => (
                    <li key={`m-${i}`} className="text-[13px] leading-snug flex items-start gap-2.5 opacity-75">
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
                  onClick={() => abrirMp(key, p.label)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 bg-[#009ee3] hover:bg-[#0088c6] text-white"
                >
                  Mercado Pago
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => irParaPayPal(key)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0070ba] hover:bg-[#005ea6] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === `paypal-${key}` ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading === `paypal-${key}` ? t.redirecting : t.pay_paypal || 'PayPal'}
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
          <strong className="font-bold text-white">
            {textOrFallback(t.cancel_anytime, 'Cancele a qualquer momento. Sem multas.')}
          </strong>{' '}
          {textOrFallback(t.cancel_detail, 'O acesso permanece até o fim do período já pago.')}
        </p>
      </div>
      <MpTransparentCheckout
        open={mpOpen}
        onClose={() => setMpOpen(false)}
        planoKey={mpPlano?.key || ''}
        planoLabel={mpPlano?.label}
        empresaId={empresaId}
        email={email}
      />
    </div>
  );
}
