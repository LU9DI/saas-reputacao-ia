'use client';

import { useState } from 'react';
import { getEnv } from '../utils/env';
import { ComoFunciona } from './ComoFunciona';

export type PlanCard = {
  keyMensal: string;
  keyAnual: string;
  label: string;
  priceMensal: string;
  priceAnual: string;
  features: string[];
  highlight?: boolean;
};

<<<<<<< Updated upstream
/**
 * Tabela oficial (limites informados pelo produto):
 * Inicial      R$ 69,90 / 49,90  — 150 feedbacks/mês
 * Pro         R$ 109,90 / 99,90  — 400 feedbacks/mês
 * Ultra       R$ 199,90 / 149,90 — 800 feedbacks/mês
 * Corporativo R$ 499,90 / 429,90 — 3.500 feedbacks/mês
 * Rei         R$ 999,90 / 899,90 — 10.000 feedbacks/mês
 *
 * Ordem: Inicial | Pro | Ultra | Rei | Corporativo
 */
const DEFAULT_PLANS: PlanCard[] = [
  {
    keyMensal: 'inicial',
    keyAnual: 'inicial-anual',
    label: 'Inicial',
    priceMensal: 'R$ 69,90',
    priceAnual: 'R$ 49,90',
    features: ['150 feedbacks/mês', 'WhatsApp integrado', 'Gráficos básicos'],
  },
  {
    keyMensal: 'pro',
    keyAnual: 'pro-anual',
    label: 'Pro',
    priceMensal: 'R$ 109,90',
    priceAnual: 'R$ 99,90',
    features: ['400 feedbacks/mês', 'WhatsApp integrado', 'Gráficos avançados'],
  },
  {
    keyMensal: 'ultra',
    keyAnual: 'ultra-anual',
    label: 'Ultra',
    priceMensal: 'R$ 199,90',
    priceAnual: 'R$ 149,90',
    features: ['800 feedbacks/mês', 'Respostas com IA', '1 relatório PDF/mês'],
  },
  {
    keyMensal: 'rei',
    keyAnual: 'rei-anual',
    label: 'Rei',
    priceMensal: 'R$ 999,90',
    priceAnual: 'R$ 899,90',
    features: [
      '10.000 feedbacks/mês',
      'IA prioritária e respostas ilimitadas',
      'Relatórios PDF avançados',
      'Suporte prioritário',
    ],
    highlight: true,
  },
  {
    keyMensal: 'corporate',
    keyAnual: 'corporate-anual',
    label: 'Corporativo',
    priceMensal: 'R$ 499,90',
    priceAnual: 'R$ 429,90',
    features: ['3.500 feedbacks/mês', 'IA sem limites de resposta', 'Dashboard multi-unidades'],
  },
];

const TEXTO_CANCELAMENTO_MENSAL =
  'A assinatura mensal poderá ser cancelada a qualquer momento. Em caso de cancelamento antes do término do ciclo, o acesso permanece ativo até o último dia do período já pago — sem cobrança adicional no mês seguinte.';

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
=======
  const linksCheckout = {
    Inicial: isAnual ? 'https://stripe.com' : 'https://stripe.com',
    Pro: isAnual ? 'https://stripe.com' : 'https://stripe.com',
    Ultra: isAnual ? 'https://stripe.com' : 'https://stripe.com',
    Corporativo: isAnual ? 'https://stripe.com' : 'https://stripe.com',
    REI: isAnual ? 'https://stripe.com' : 'https://stripe.com',
>>>>>>> Stashed changes
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Escolha o plano mais adequado</h2>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Ao selecionar um plano, você será direcionado à página segura do Stripe para cadastrar o
          meio de pagamento.
        </p>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${\n              ciclo === 'mensal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${\n              ciclo === 'anual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
          {erro}
        </p>
      )}
=======
      {/* Grade com os 5 Planos Oficiais do Filtra.ia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch pt-4">
      
        {/* 1. PLANO Inicial */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 transition">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Plano Inicial</h3>
              <p className="text-xs text-slate-400 mt-1">O escudo essencial de ouvidoria para comércios locais, lojas e oficinas.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-slate-900">R$ {isAnual ? '49,90' : '69,90'}</span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAnual ? 'Assinatura anual recorrente. Sem fidelidade, cancelamento livre a qualquer momento.' : 'Assinatura mensal recorrente. Sem fidelidade, cancelamento livre a qualquer momento.'}
            </p>
>>>>>>> Stashed changes

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-stretch">
        {DEFAULT_PLANS.map((p) => {
          const key = ciclo === 'mensal' ? p.keyMensal : p.keyAnual;
          const price = ciclo === 'mensal' ? p.priceMensal : p.priceAnual;
          const period = ciclo === 'mensal' ? '/mês' : '/mês (cobrança anual)';

          return (
            <div
              key={p.label}
              className={`rounded-2xl border p-4 flex flex-col bg-white min-w-0 ${\n                p.highlight
                  ? 'border-amber-300 shadow-md ring-1 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {price}
                <span className="text-xs font-normal text-slate-400">{period}</span>
              </p>
              <ul className="mt-3 space-y-1.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-slate-600 leading-snug">
                    • {f}
                  </li>
                ))}
                {ciclo === 'mensal' && (
                  <li className="text-xs text-slate-500 leading-snug pt-1">
                    • Cancelamento a qualquer momento, com uso até o fim do ciclo pago
                  </li>
                )}
              </ul>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => irParaCheckout(key)}
                className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${\n                  p.highlight
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {loading === key ? 'Abrindo Stripe…' : 'Assinar com cartão'}
              </button>
            </div>
<<<<<<< Updated upstream
          );
        })}
=======
            
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-slate-900">R$ {isAnual ? '99,90' : '109,90'}</span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAnual ? 'Assinatura anual recorrente. Sem fidelidade, cancelamento livre a qualquer momento.' : 'Assinatura mensal recorrente. Sem fidelidade, cancelamento livre a qualquer momento.'}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-start gap-2">✔ <span><strong>Até 400 Feedbacks</strong> por mês</span></li>
              <li className="flex items-start gap-2 text-slate-900 font-medium">✔ <span className="text-green-600">WhatsApp Integrado (Botão de Crise)</span></li>
              <li className="flex items-start gap-2">✔ <span>Dashboard Simples com Gráficos</span></li>
              <li className="flex items-start gap-2">✔ <span>Identificação Universal (Mesa/Link)</span></li>
              <li className="flex items-start gap-2">✔ <span><strong>Relatórios Automatizados</strong></span></li>
              <li className="flex items-start gap-2 text-slate-300 line-through">× <span>IA</span></li>
            </ul>
          </div>
          <a href={linksCheckout.Pro} className="mt-6 block w-full text-center bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-xl transition text-xs">
            Assinar Plano PRO
          </a>
        </div>

        {/* 2. PLANO ULTRA (Destaque Comercial) */}
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 flex flex-col justify-between shadow-md relative transform md:-translate-y-2">
          <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-[9px] tracking-wider font-black py-0.5 px-3 rounded-full uppercase">
            Mais Recomendado
          </div>
          <div className="space-y-4">
            <div className="pt-2">
              <h3 className="text-lg font-bold text-slate-900">Plano Ultra</h3>
              <p className="text-xs text-slate-400 mt-1">Pós-venda inteligente operado por Inteligência Artificial ativa.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-slate-900">R$ {isAnual ? 'R$ 149,90' : 'R$ 199,90'}</span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAnual ? 'Assinatura anual recorrente. Sem fidelidade, cancelamento livre a qualquer momento.' : 'Assinatura mensal recorrente. Sem fidelidade, cancelamento livre a qualquer momento.'}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-start gap-2">✔ <span><strong>Até 800 Feedbacks</strong> por mês</span></li>
              <li className="flex items-start gap-2 text-slate-900 font-medium">✔ <span className="text-green-600">WhatsApp Integrado (Botão de Crise)</span></li>
              <li className="flex items-start gap-2 text-purple-700 font-semibold">✔ <span>Dashboard Analítico de Gráficos</span></li>
              <li className="flex items-start gap-2 text-purple-700 font-semibold">✔ <span>IA Avançada + 1 Relatório Mensal em PDF</span></li>
              <li className="flex items-start gap-2">✔ <span>Análise de Sentimento & Sugestão de Respostas</span></li>
            </ul>
          </div>
          <a href={linksCheckout.Pro} className="mt-6 block w-full text-center bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-xl transition text-xs">
            Assinar Plano Ultra com IA
          </a>
        </div>

        {/* 3. PLANO CORPORATIVO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 transition">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Corporativo</h3>
              <p className="text-xs text-slate-400 mt-1">O plano para empresas maiores e grandes marcas.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-slate-900">R$ {isAnual ? '429,90' : '499,90'}</span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAnual ? 'Assinatura anual recorrente. Sem fidelidade, cancelamento livre a qualquer momento.' : 'Assinatura mensal recorrente. Sem fidelidade, cancelamento livre a qualquer momento.'}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-start gap-2">✔ <span><strong>Até 3.500 Feedbacks por mês</strong></span></li>
              <li className="flex items-start gap-2 text-slate-900 font-medium">✔ <span className="text-green-600">WhatsApp Integrado (Botão de Crise)</span></li>
              <li className="flex items-start gap-2 text-blue-600 font-bold">✔ <span>Dashboard Completo Multi-Unidades (Filiais)</span></li>
              <li className="flex items-start gap-2 text-purple-700 font-semibold">✔ <span>IA Avançada + 1 Relatório Mensal em PDF</span></li>
              <li className="flex items-start gap-2">✔ <span>Suporte Prioritário via WhatsApp</span></li>
              <li className="flex items-start gap-2">✔ <span>Acesso antecipado a novas funcionalidades</span></li>
            </ul>
          </div>
          <a href={linksCheckout.Pro} className="mt-6 block w-full text-center bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-xl transition text-xs">
            Assinar Plano Corporativo com IA
          </a>
        </div>

        {/* 3. PLANO REI */} 
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 transition">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Plano REI</h3>
              <p className="text-xs text-slate-400 mt-1">Estrutura robusta sob medida para franquias, redes e grandes marcas.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-slate-900">R$ {isAnual ? '899,90' : '999,90'}</span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
          <p className="text-[10px] text-slate-400 leading-normal">
              {isAnual ? 'Assinatura anual recorrente. Sem fidelidade, cancelamento livre a qualquer momento.' : 'Assinatura mensal recorrente. Sem fidelidade, cancelamento livre a qualquer momento.'}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-start gap-2">✔ <span><strong>Até 10.000 Feedbacks por mês</strong></span></li>
              <li className="flex items-start gap-2 text-slate-900 font-medium">✔ <span className="text-green-600">WhatsApp Integrado (Botão de Crise)</span></li>
              <li className="flex items-start gap-2 text-blue-600 font-bold">✔ <span>Dashboard Completo Multi-Unidades (Filiais)</span></li>
              <li className="flex items-start gap-2 text-purple-700 font-semibold">✔ <span>IA Avançada + 1 Relatório Mensal em PDF</span></li>
              <li className="flex items-start gap-2">✔ <span>Suporte Prioritário via WhatsApp</span></li>
              <li className="flex items-start gap-2">✔ <span>Acesso antecipado a novas funcionalidades</span></li>
            </ul>
          </div>
          <a href={linksCheckout.Pro} className="mt-6 block w-full text-center bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-xl transition text-xs">
            Assinar Plano REI com IA
          </a>
        </div>
>>>>>>> Stashed changes
      </div>

      <p className="text-xs text-slate-600 max-w-3xl mx-auto leading-relaxed bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left sm:text-center">
        {TEXTO_CANCELAMENTO_MENSAL}
      </p>

      {showComoFunciona && <ComoFunciona />}
    </div>
  );
}
