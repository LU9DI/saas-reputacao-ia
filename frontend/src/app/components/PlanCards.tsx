'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFailover';
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

type PendingCheckout = {
  method: 'mp' | 'paypal';
  planoKey: string;
  planBase: string;
  label: string;
  price: string;
  reviewLimit: number;
};

const TERMOS_VERSAO = '2026-09-15';
const PRIV_VERSAO = '2026-09-15';

function formatPriceDisplay(price: string): string {
  return String(price || '').replace(/\u00a0/g, ' ').replace(/R\$\s+/g, 'R$\u00a0').trim();
}

function resolveLimit(plan: string, fromApi?: number): number {
  return OFFICIAL_LIMITS[plan] ?? (fromApi && fromApi > 0 ? fromApi : 100);
}

function textOrFallback(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim();
  // Nunca exibir chaves internas de tradução nos benefícios dos planos.
  // Isso também protege contra dicionários antigos/cacheados no cliente.
  if (!text || /^[a-z][a-z0-9]*_[a-z0-9_]+$/i.test(text) && text.startsWith('feat_')) {
    return fallback;
  }
  return text;
}

function featuresForPlan(plan: string, limit: number, t: any) {
  const fb = textOrFallback(t.feat_feedbacks, '{n} feedbacks/mês').replace(
    '{n}',
    // Locale fixo: garante o mesmo texto no SSR (build) e no cliente,
    // evitando mismatch de hidratação quando o runtime do build não é pt-BR.
    limit.toLocaleString('pt-BR')
  );
  const wpp = textOrFallback(t.feat_wpp, 'WhatsApp integrado');
  const dashboard = textOrFallback(t.feat_basic_charts, 'Dashboard');
  const ai = textOrFallback(t.feat_ai, 'IA integrada');
  const reportFallback =
    t.lang_name === 'English'
      ? '1 professional report per month'
      : t.lang_name === 'Español'
        ? '1 informe profesional al mes'
        : t.lang_name === '中文'
          ? '每月一份专业报告'
          : '1 relatório profissional por mês';
  const report = textOrFallback(t.feat_report, reportFallback);
  const aiMissing = textOrFallback(t.feat_ai_missing, 'IA integrada');
  const analytics = textOrFallback(t.feat_dashboard, 'Dashboard com análises');
  const unitManagement = textOrFallback(t.feat_unit_management, 'Gestão consolidada de múltiplas unidades com links exclusivos de avaliação');
  const unitPerformance = textOrFallback(t.feat_unit_performance, 'Ranking comparativo, análise de resultados e prioridades de ação por unidade');
  const support = textOrFallback(t.feat_support, 'Suporte Prioritário');
  const early = textOrFallback(t.feat_early, 'Acesso antecipado a novas funções');
  const strategicRadar = textOrFallback(t.feat_strategic_radar, 'Radar estratégico de riscos e tendências');
  const growth = textOrFallback(t.feat_growth, 'Oportunidades de crescimento priorizadas');
  const dotFallback =
    t.lang_name === 'English'
      ? 'Filtra Dot: AI reputation agent'
      : t.lang_name === 'Español'
        ? 'Filtra Dot: agente de reputación con IA'
        : t.lang_name === '中文'
          ? 'Filtra Dot：AI 声誉代理'
          : 'Filtra Dot: agente de reputação com IA';
  const dot = textOrFallback(t.feat_dot, dotFallback);

  const map: Record<string, { features: string[]; missing?: string[] }> = {
    inicial: { features: [fb, wpp, dashboard], missing: [report, aiMissing] },
    pro: { features: [fb, wpp, dashboard, report], missing: [aiMissing] },
    ultra: { features: [fb, wpp, ai, report, analytics] },
    corporativo: {
      features: [
        fb, wpp, ai, report, analytics, unitManagement, unitPerformance, dot, support, early,
      ],
    },
    rei: {
      features: [
        fb, wpp, ai, report, analytics, unitManagement, unitPerformance,
        strategicRadar, growth, dot, support, early,
      ],
    },
  };
  return map[plan] || { features: [fb] };
}

async function registrarAceite(payload: Record<string, unknown>) {
  try {
    await apiFetch('/api/legal/aceite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    /* não bloqueia checkout se log falhar */
  }
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
  const [pending, setPending] = useState<PendingCheckout | null>(null);
  const [aceite, setAceite] = useState(false);

  const labelMensal = textOrFallback(t.monthly, 'Mensal');
  const labelAnual = textOrFallback(t.yearly, 'Anual');
  const labelPopular = textOrFallback(t.popular, 'Popular');

  useEffect(() => {
    // A landing /preview é uma demonstração visual e precisa funcionar
    // completamente sem backend no localhost. Mantemos os planos oficiais
    // como fallback e só consultamos /api/planos fora do preview local.
    const isPreviewLocal =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/preview' ||
        window.location.pathname.startsWith('/preview/')) &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    if (isPreviewLocal) {
      setLoadingPrices(false);
      return;
    }

    let cancelled = false;
    const carregar = async () => {
      try {
        const planosRes = await apiFetch('/api/planos', {
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

  const fecharAceite = () => {
    setPending(null);
    setAceite(false);
  };

  const iniciarCheckout = (
    method: 'mp' | 'paypal',
    planoKey: string,
    planBase: string,
    label: string,
    price: string,
    reviewLimit: number
  ) => {
    setErro('');
    if (requireEmpresa && !empresaId) {
      setErro(t.trial_title || 'Ative o trial antes de assinar.');
      return;
    }
    setAceite(false);
    setPending({ method, planoKey, planBase, label, price, reviewLimit });
  };

  const irParaPayPal = async (planoKey: string) => {
    setErro('');
    setLoading(`paypal-${planoKey}`);
    try {
      const res = await apiFetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
          email: email || undefined,
          aceite_termos: true,
          versao_termos: TERMOS_VERSAO,
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
    setMpPlano({ key: planoKey, label });
    setMpOpen(true);
  };

  const confirmarCompra = async () => {
    if (!pending || !aceite) return;
    const { method, planoKey, label, price, planBase } = pending;
    await registrarAceite({
      aceito: true,
      contexto: 'checkout',
      plano: planoKey,
      preco_exibido: price,
      ciclo: ciclo,
      email: email || undefined,
      empresa_id: empresaId || undefined,
      metodo: method,
      versao_termos: TERMOS_VERSAO,
      versao_privacidade: PRIV_VERSAO,
      plan_base: planBase,
    });
    fecharAceite();
    if (method === 'mp') abrirMp(planoKey, label);
    else void irParaPayPal(planoKey);
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
    // Classifique pela chave semântica do dicionário, não pelo texto traduzido.
    // Assim todos os idiomas recebem os mesmos ícones, cores e sombreamento.
    const featureKey =
      Object.entries(t).find(([key, value]) => {
        if (!key.startsWith('feat_')) return false;
        const translated = String(value);
        if (translated === text) return true;
        // feat_feedbacks contém {n}; comparar o modelo traduzido preserva
        // a chave semântica depois de inserir o limite mensal em qualquer idioma.
        if (key === 'feat_feedbacks' && translated.includes('{n}')) {
          const [before, after] = translated.split('{n}');
          return text.startsWith(before) && text.endsWith(after);
        }
        return false;
      })?.[0] ?? '';
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
    if (featureKey === 'feat_wpp' || lower.includes('wpp') || lower.includes('whatsapp')) {
      icon = MessageCircle;
      badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
    } else if (
      [
        'feat_unit_ranking',
        'feat_unit_links',
        'feat_unit_management',
        'feat_unit_performance',
        'feat_unit_insights',
        'feat_priorities',
        'feat_strategic_radar',
        'feat_growth',
      ].includes(featureKey) ||
      lower.includes('ranking') ||
      lower.includes('unidade') ||
      lower.includes('ejecutivo') ||
      lower.includes('executivo') ||
      lower.includes('links de avaliação') ||
      lower.includes('temas por unidade') ||
      lower.includes('prioridades de ação') ||
      lower.includes('radar estratégico') ||
      lower.includes('oportunidades de crescimento') ||
      lower.includes('riscos e tendências')
    ) {
      icon = BarChart3;
      badgeClass = 'text-blue-700 bg-blue-50 border-blue-200/60';
    } else if (
      ['feat_ai', 'feat_ai_missing', 'feat_dot'].includes(featureKey) ||
      lower.includes('ia') ||
      lower.includes('ai') ||
      lower.includes('智能')
    ) {
      icon = Sparkles;
    } else if (
      featureKey === 'feat_report' ||
      lower.includes('relatório') ||
      lower.includes('report') ||
      lower.includes('informe') ||
      lower.includes('报告')
    ) {
      icon = FileText;
    } else if (
      ['feat_dashboard', 'feat_basic_charts', 'feat_multi'].includes(featureKey) ||
      lower.includes('dashboard') ||
      lower.includes('chart') ||
      lower.includes('graf')
    ) {
      icon = BarChart3;
    } else if (
      featureKey === 'feat_support' ||
      lower.includes('suporte') ||
      lower.includes('support')
    ) {
      icon = Headset;
    } else if (
      featureKey === 'feat_early' ||
      lower.includes('early') ||
      lower.includes('antecip')
    ) {
      icon = Rocket;
    } else if (featureKey === 'feat_feedbacks' || lower.includes('feedback')) {
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

  const periodLabel =
    ciclo === 'mensal'
      ? 'referente a 30 dias de acesso'
      : 'referente a 365 dias de acesso (pagamento anual antecipado)';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-white tracking-tight">{t.plans_title}</h2>
        <p className="text-sm text-white max-w-2xl mx-auto font-medium leading-relaxed">
          {[t.pay_paypal || 'PayPal', 'Mercado Pago'].join(' · ')}
        </p>
        <div
          className="inline-flex rounded-full border border-slate-600/80 bg-slate-800/80 p-1 text-sm shadow-inner mt-2 gap-0.5"
          role="group"
          aria-label="Ciclo de cobrança"
        >
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`min-w-[5.5rem] px-5 py-2 rounded-full font-semibold transition-colors ${
              ciclo === 'mensal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {labelMensal}
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`min-w-[5.5rem] px-5 py-2 rounded-full font-semibold transition-colors ${
              ciclo === 'anual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {labelAnual}
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
          const period =
            ciclo === 'mensal'
              ? textOrFallback(t.per_month, '/mês')
              : textOrFallback(t.annual_billing, 'cobrança anual');
          const planBase = String(p.keyMensal || '')
            .replace(/-anual$/, '')
            .toLowerCase();
          const limit = resolveLimit(planBase, p.reviewLimit);
          const localized = featuresForPlan(planBase, limit, t);
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
                <div className="flex items-center justify-between gap-2 mb-4 min-h-[1.5rem]">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.label}</p>
                  {p.highlight && labelPopular ? (
                    <span className="shrink-0 bg-indigo-600 text-white text-[10px] tracking-wide font-bold py-0.5 px-2 rounded-full uppercase shadow-sm leading-none">
                      {labelPopular}
                    </span>
                  ) : null}
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
                  onClick={() => iniciarCheckout('mp', key, planBase, p.label, price, limit)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 bg-[#009ee3] hover:bg-[#0088c6] text-white"
                >
                  Mercado Pago
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => iniciarCheckout('paypal', key, planBase, p.label, price, limit)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0070ba] hover:bg-[#005ea6] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === `paypal-${key}` ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading === `paypal-${key}`
                    ? textOrFallback(t.redirecting, 'Redirecionando…')
                    : textOrFallback(t.pay_paypal, 'PayPal')}
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

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="aceite-titulo"
            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-6"
          >
            <h3 id="aceite-titulo" className="text-lg font-bold text-zinc-50">
              Confirmar contratação
            </h3>

            <div className="text-sm text-zinc-300 space-y-2 leading-relaxed bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              <p>
                Ao continuar, você contratará o plano{' '}
                <strong className="text-white">{pending.label}</strong> por{' '}
                <strong className="text-white">{pending.price}</strong>, {periodLabel}.{' '}
                <strong className="text-white">Não há renovação automática</strong>: ao fim do período, é necessária
                nova contratação e novo pagamento.
              </p>
              <p>
                O plano inclui até{' '}
                <strong className="text-white">{pending.reviewLimit.toLocaleString('pt-BR')}</strong> feedbacks
                por ciclo e as funcionalidades do plano selecionado. Não há garantia de resultado comercial.
              </p>
              <p>
                Você poderá cancelar pelo painel. O acesso permanece até o fim do período já pago. Aplicam-se os{' '}
                <a href="/termos" className="underline text-zinc-200" target="_blank" rel="noreferrer">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" className="underline text-zinc-200" target="_blank" rel="noreferrer">
                  Política de Privacidade
                </a>
                .
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className="mt-1 rounded border-zinc-600"
              />
              <span>Li e aceito os Termos de Uso e a Política de Privacidade para esta contratação.</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={fecharAceite}
                className="flex-1 py-2.5 rounded-xl border border-zinc-600 text-zinc-200 text-sm font-semibold hover:bg-zinc-800"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!aceite}
                onClick={() => void confirmarCompra()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

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
