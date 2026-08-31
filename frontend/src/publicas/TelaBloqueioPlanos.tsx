"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Globe, CreditCard, Sparkles, Building } from 'lucide-react';

// 🌐 Dicionário de Idiomas com Preços Locais/Convertidos e Gatilhos de Desconto
const traducoes = {
  pt: {
    alerta: "Período de Testes Encerrado",
    subtitulo: "Os 7 dias gratuitos da sua empresa expiraram. Escolha um dos planos abaixo para reativar seu QR Code e não perder nenhuma avaliação de cliente.",
    moeda: "R$",
    periodoMensal: "/mês",
    periodoAnual: "/ano",
    economia: "Economize R$ 374 por ano",
    popular: "Mais Vendido",
    botaoAssinar: "Assinar Agora",
    avisoCartao: "Pagamento seguro via Stripe / Mercado Pago. Cancele quando quiser.",
    todosIncluem: "Todos os planos incluem",
    
    plano1: { nome: "Starter", preco: "97", desc: "Perfeito para 1 estabelecimento local." },
    plano2: { nome: "Pro Anual", preco: "790", desc: "O melhor custo-benefício. Equivalente a R$ 65/mês." },
    plano3: { nome: "Agency / Multi-lojas", preco: "297", desc: "Para redes de lojas ou franquias (até 5 filiais)." },
    
    beneficios: [
      "Monitoramento contínuo de avaliações",
      "Respostas automáticas com IA (Groq)",
      "Alertas críticos imediatos no WhatsApp",
      "Relatórios semanais por e-mail",
      "Suporte multilíngue nativo"
    ]
  },
  en: {
    alerta: "Trial Period Ended",
    subtitulo: "Your company's 7-day free trial has expired. Choose one of the plans below to reactivate your QR Code and keep capturing customer reviews.",
    moeda: "$",
    periodoMensal: "/mo",
    periodoAnual: "/yr",
    economia: "Save $80 per year",
    popular: "Most Popular",
    botaoAssinar: "Subscribe Now",
    avisoCartao: "Secure payment via Stripe. Cancel anytime.",
    todosIncluem: "All plans include",
    
    plano1: { nome: "Starter Monthly", preco: "19", desc: "Perfect for 1 local business establishment." },
    plano2: { nome: "Pro Annual", preco: "149", desc: "Best value. Equivalent to just $12/month." },
    plano3: { nome: "Agency / Multi-location", preco: "49", desc: "For business chains or franchises (up to 5 branches)." },
    
    beneficios: [
      "Continuous review monitoring",
      "Automated AI responses (Groq)",
      "Instant critical alerts on WhatsApp",
      "Weekly email reports",
      "Native multilingual support"
    ]
  },
  es: {
    alerta: "Período de Prueba Terminado",
    subtitulo: "Los 7 días gratuitos de tu empresa han expirado. Elige uno de los planes a continuación para reactivar tu código QR y seguir capturando opiniones.",
    moeda: "€",
    periodoMensal: "/mes",
    periodoAnual: "/año",
    economia: "Ahorra €70 al año",
    popular: "Más Vendido",
    botaoAssinar: "Suscribirse Ahora",
    avisoCartao: "Pago seguro vía Stripe. Cancela cuando quieras.",
    todosIncluem: "Todos los planes incluyen",
    
    plano1: { nome: "Starter Mensal", preco: "19", desc: "Perfecto para 1 establecimiento local." },
    plano2: { nome: "Pro Anual", preco: "159", desc: "La mejor opción. Equivalente a €13/mes." },
    plano3: { nome: "Agency / Multi-tiendas", preco: "49", desc: "Para redes de tiendas o franquicias (hasta 5 sucursales)." },
    
    beneficios: [
      "Monitoreo continuo de opiniones",
      "Respuestas automáticas con IA (Groq)",
      "Alertas críticas de inmediato en WhatsApp",
      "Informes semanales por correo",
      "Soporte multilingüe nativo"
    ]
  }
} as const;

type Idioma = 'pt' | 'en' | 'es';

export default function TelaBloqueioPlanos() {
  const [idioma, setIdioma] = useState<Idioma>('pt');

  // 🌍 Ajusta o idioma conforme o navegador do cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const langs = navigator.languages || [navigator.language || (navigator as any).userLanguage];
      const lang = langs.find(l => l.startsWith('en') || l.startsWith('es') || l.startsWith('pt'));
      if (lang?.startsWith('en')) setIdioma('en');
      else if (lang?.startsWith('es')) setIdioma('es');
      else setIdioma('pt');
    }
  }, []);

  const t = traducoes[idioma];

  const handleAssinar = (plano: string) => {
    console.log(`Assinando plano: ${plano}`);
    // TODO: integrar com Stripe/Mercado Pago
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Seletor manual de idioma no topo direito */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg shadow-md border border-slate-700">
        <Globe size={16} className="text-slate-400" aria-hidden="true" />
        <select 
          value={idioma} 
          onChange={(e) => setIdioma(e.target.value as Idioma)}
          aria-label="Selecionar idioma"
          className="bg-transparent text-sm font-medium outline-none cursor-pointer text-slate-200"
        >
          <option value="pt" className="bg-slate-800 text-white">Português (BR)</option>
          <option value="en" className="bg-slate-800 text-white">English (US)</option>
          <option value="es" className="bg-slate-800 text-white">Español</option>
        </select>
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center space-y-12">
        {/* Cabeçalho de Alerta */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <ShieldAlert size={32} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{t.alerta}</h1>
          <p className="text-base text-slate-400 leading-relaxed">{t.subtitulo}</p>
        </div>

        {/* Grade de 3 Planos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
          
          {/* PLANO 1: STARTER */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/60 flex flex-col justify-between transition-all hover:border-slate-600">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                <Building size={16} /> {t.plano1.nome}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{t.plano1.desc}</p>
              <div className="flex items-baseline gap-1 py-2">
                <span className="text-2xl font-bold text-slate-300">{t.moeda}</span>
                <span className="text-5xl font-black text-white tracking-tight">{t.plano1.preco}</span>
                <span className="text-sm text-slate-400 font-medium">{t.periodoMensal}</span>
              </div>
            </div>
            
            <button 
              onClick={() => handleAssinar('starter')}
              className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer"
            >
              {t.botaoAssinar}
            </button>
          </div>

          {/* PLANO 2: PRO ANUAL (O destaque com desconto agressivo) */}
          <div className="bg-gradient-to-b from-indigo-950/60 to-slate-800/80 rounded-2xl p-8 border-2 border-indigo-500 relative flex flex-col justify-between shadow-xl shadow-indigo-500/5 transition-all transform hover:-translate-y-1">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-md shadow-indigo-500/20">
              <Sparkles size={12} /> {t.popular}
            </span>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <Sparkles size={16} /> {t.plano2.nome}
              </div>
              <p className="text-sm text-indigo-200/70 leading-relaxed">{t.plano2.desc}</p>
              <div className="flex items-baseline gap-1 py-2">
                <span className="text-2xl font-bold text-indigo-300">{t.moeda}</span>
                <span className="text-5xl font-black text-white tracking-tight">{t.plano2.preco}</span>
                <span className="text-sm text-indigo-200/60 font-medium">{t.periodoAnual}</span>
              </div>
              <div className="bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/20 inline-block">
                {t.economia}
              </div>
            </div>
            
            <button 
              onClick={() => handleAssinar('pro-anual')}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {t.botaoAssinar}
            </button>
          </div>

          {/* PLANO 3: AGENCY / MULTI-LOJAS */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/60 flex flex-col justify-between transition-all hover:border-slate-600">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                <Building size={16} /> {t.plano3.nome}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{t.plano3.desc}</p>
              <div className="flex items-baseline gap-1 py-2">
                <span className="text-2xl font-bold text-slate-300">{t.moeda}</span>
                <span className="text-5xl font-black text-white tracking-tight">{t.plano3.preco}</span>
                <span className="text-sm text-slate-400 font-medium">{t.periodoMensal}</span>
              </div>
            </div>
            
            <button 
              onClick={() => handleAssinar('agency')}
              className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer"
            >
              {t.botaoAssinar}
            </button>
          </div>

        </div>

        {/* Lista de Benefícios Inclusos e Rodapé */}
        <div className="w-full max-w-3xl bg-slate-800/30 rounded-2xl p-8 border border-slate-800 flex flex-col items-center space-y-6">
          <h2 className="text-xl font-semibold text-white text-center mb-4">{t.todosIncluem}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
            {t.beneficios.map((beneficio, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                <Check size={18} className="text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{beneficio}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-4">
            <CreditCard size={14} /> {t.avisoCartao}
          </p>
        </div>
      </div>
    </div>
  );
}