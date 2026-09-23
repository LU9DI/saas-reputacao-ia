'use client';

import { ArrowRight, BarChart3, Bot, Check, ChevronDown, MessageSquare, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { PlanCards } from '../components/PlanCards';

function DashboardMockup() {
  return (
    <div className="relative rounded-[28px] border border-white/10 bg-zinc-950/90 shadow-2xl shadow-indigo-950/40 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-zinc-600">Painel Filtra.AI</span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Reputação geral</span>
              <span className="text-xs text-emerald-400">+18,4%</span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <strong className="text-4xl text-white">4,8</strong>
              <span className="pb-1 text-sm text-zinc-500">/ 5,0</span>
            </div>
            <div className="mt-4 h-20 rounded-xl bg-gradient-to-b from-indigo-500/20 to-transparent p-2">
              <svg viewBox="0 0 500 90" className="h-full w-full">
                <path d="M0 70 C80 58 95 65 145 48 S220 55 270 36 S350 42 400 22 S450 30 500 8" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-400" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['1.284', 'Feedbacks'],
              ['91%', 'Positivos'],
              ['37', 'Alertas'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-lg font-semibold text-white">{value}</div>
                <div className="mt-1 text-[10px] text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Bot size={16} className="text-indigo-300" /> IA encontrou 3 padrões</div>
          <div className="mt-4 space-y-3">
            {['Atendimento elogiado', 'Tempo de espera', 'Equipe bem avaliada'].map((item, i) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between text-xs text-zinc-300"><span>{item}</span><span className="text-indigo-300">{[82, 64, 91][i]}%</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-indigo-400" style={{ width: [82, 64, 91][i] + '%' }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-200">✓ Resumo semanal pronto para o gestor</div>
        </div>
      </div>
    </div>
  );
}

const features = [
  [Sparkles, 'IA para feedback', 'Transforme centenas de avaliações em sinais claros sobre atendimento, produto e experiência.'],
  [MessageSquare, 'Respostas mais rápidas', 'Identifique o que merece atenção e acelere a rotina de resposta com apoio da IA.'],
  [BarChart3, 'Visão da reputação', 'Acompanhe notas, tendências, temas e evolução em um único painel.'],
  [ShieldCheck, 'Alertas inteligentes', 'Saiba quando uma experiência ruim precisa de atenção antes que vire um problema maior.'],
];

export default function LandingPreview() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(79,70,229,.24),transparent_30%),radial-gradient(circle_at_15%_20%,rgba(14,165,233,.12),transparent_25%)]" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <BrandMark size="md" subtitle="Reputação" href="/" />
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
            <a href="#recursos" className="hover:text-white">Recursos</a>
            <a href="#planos" className="hover:text-white">Planos</a>
            <a href="/login" className="hover:text-white">Entrar</a>
          </div>
          <a href="/#trial" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">Começar grátis</a>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-32 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs text-indigo-200">
              <Zap size={13} /> Inteligência de reputação para empresas
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-6xl lg:text-7xl">
              Sua reputação pode trabalhar <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">por você.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Centralize feedbacks, entenda o que seus clientes estão dizendo e use IA para transformar avaliações em ações que melhoram a experiência.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/#trial" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400">Começar 7 dias grátis <ArrowRight size={17} /></a>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-medium text-zinc-200 hover:bg-white/[0.06]">Ver como funciona</a>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span>✓ Sem cartão</span><span>✓ Configuração rápida</span><span>✓ Cancele quando quiser</span>
            </div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:grid-cols-3 lg:px-8">
          {[
            ['Feedbacks centralizados', 'Pare de procurar informação em vários canais.'],
            ['IA que encontra padrões', 'Veja temas e sinais que passariam despercebidos.'],
            ['Ação mais rápida', 'Transforme feedback em decisões e respostas.'],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-3"><Check className="mt-0.5 text-indigo-400" size={18} /><div><div className="font-medium text-zinc-200">{title}</div><div className="mt-1 text-sm text-zinc-500">{text}</div></div></div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Como funciona</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Do feedback à ação em poucos passos.</h2><p className="mt-5 text-lg leading-8 text-zinc-400">O Filtra.AI organiza o ciclo completo da reputação para sua equipe gastar menos tempo procurando problemas e mais tempo resolvendo-os.</p></div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ['01', 'Colete', 'QR Code, link ou canais conectados levam o cliente ao fluxo de avaliação.'],
            ['02', 'Entenda', 'A IA identifica sentimento, temas recorrentes e pontos de atenção.'],
            ['03', 'Aja', 'Sua equipe recebe contexto para responder, corrigir e acompanhar a evolução.'],
          ].map(([n, title, text]) => (
            <div key={n} className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
              <div className="text-sm text-indigo-400">{n}</div><h3 className="mt-5 text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="recursos" className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Recursos</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Mais do que avaliações.</h2><p className="mt-5 text-lg leading-8 text-zinc-400">Uma camada de inteligência para entender a experiência do cliente e proteger a reputação da empresa.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map(([Icon, title, text]) => {
              const I = Icon as any;
              return <div key={title as string} className="rounded-3xl border border-white/10 bg-black/20 p-7"><I size={22} className="text-indigo-300" /><h3 className="mt-5 text-xl font-semibold">{title as string}</h3><p className="mt-2 leading-7 text-zinc-500">{text as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10 max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Planos</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Comece pequeno. Cresça quando precisar.</h2><p className="mt-5 text-zinc-400">Os planos atuais continuam aqui; esta versão apenas muda a forma como o visitante chega até eles.</p></div>
        <PlanCards />
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-white/[0.03] to-violet-500/10 p-8 text-center sm:p-14">
          <Star className="mx-auto text-indigo-300" size={26} fill="currentColor" />
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Comece a entender sua reputação hoje.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">Teste o Filtra.AI por 7 dias e veja como feedbacks podem virar informação útil para sua empresa.</p>
          <a href="/#trial" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-black hover:bg-zinc-200">Começar 7 dias grátis <ArrowRight size={17} /></a>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <BrandMark size="sm" subtitle="Reputação" href="/" />
          <div className="text-xs text-zinc-600">Filtra.AI · Preview de redesign · Não altera a landing atual</div>
        </div>
      </footer>
    </main>
  );
}
