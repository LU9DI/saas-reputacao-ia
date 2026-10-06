'use client';

import { ArrowRight, Check, Sparkles, Zap } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { PreviewNavigator } from '../components/PreviewNavigator';
import { PlanCards } from '../components/PlanCards';
import { useLanguage, type Language } from '../Contexts/LanguageContext';

type Copy = {
  badge: string;
  heroTitle: string;
  heroAccent: string;
  heroText: string;
  start: string;
  howCta: string;
  noCard: string;
  quick: string;
  cancel: string;
  howEyebrow: string;
  howTitle: string;
  howText: string;
  steps: [string, string, string][];
  plansEyebrow: string;
  plansTitle: string;
  plansText: string;
  finalTitle: string;
  finalText: string;
  footer: string;
  privacy: string;
  terms: string;
};

const copy: Record<Language, Copy> = {
  pt: {
    badge: 'Inteligência de reputação para empresas',
    heroTitle: 'Sua reputação pode trabalhar',
    heroAccent: 'por você.',
    heroText:
      'Centralize feedbacks, entenda o que seus clientes estão dizendo e use IA para transformar avaliações em ações que melhoram a experiência.',
    start: 'Começar 7 dias grátis',
    howCta: 'Ver como funciona',
    noCard: 'Sem cartão',
    quick: 'Configuração rápida',
    cancel: 'Cancele quando quiser',
    howEyebrow: 'Como funciona',
    howTitle: 'Do feedback à ação em poucos passos.',
    howText:
      'O Filtra.AI organiza o ciclo completo da reputação para sua equipe gastar menos tempo procurando problemas e mais tempo resolvendo-os.',
    steps: [
      ['01', 'Colete', 'QR Code, link ou canais conectados levam o cliente ao fluxo de avaliação.'],
      ['02', 'Entenda', 'A IA identifica sentimento, temas recorrentes e pontos de atenção.'],
      ['03', 'Execute', 'Sua equipe recebe contexto para responder, corrigir e acompanhar a evolução.'],
    ],
    plansEyebrow: 'Planos',
    plansTitle: 'Comece pequeno. Cresça quando precisar.',
    plansText: 'Escolha o plano ideal para o momento da sua operação.',
    finalTitle: 'Comece a entender sua reputação hoje.',
    finalText: 'Teste o Filtra.AI por 7 dias e veja como feedbacks podem virar informação útil para sua empresa.',
    footer: 'Filtra.AI',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Uso',
  },
  en: {
    badge: 'Reputation intelligence for businesses',
    heroTitle: 'Your reputation can work',
    heroAccent: 'for you.',
    heroText:
      'Centralize feedback, understand what customers are saying, and use AI to turn reviews into actions that improve the experience.',
    start: 'Start 7-day free trial',
    howCta: 'See how it works',
    noCard: 'No credit card',
    quick: 'Fast setup',
    cancel: 'Cancel anytime',
    howEyebrow: 'How it works',
    howTitle: 'From feedback to action in a few steps.',
    howText:
      'Filtra.AI organizes the full reputation cycle so your team spends less time looking for problems and more time solving them.',
    steps: [
      ['01', 'Collect', 'QR Code, link, or connected channels take customers into the review flow.'],
      ['02', 'Understand', 'AI identifies sentiment, recurring themes, and points that need attention.'],
      ['03', 'Act', 'Your team gets context to respond, improve, and track progress.'],
    ],
    plansEyebrow: 'Plans',
    plansTitle: 'Start small. Grow when you need to.',
    plansText: 'Choose the plan that fits your operation right now.',
    finalTitle: 'Start understanding your reputation today.',
    finalText: 'Try Filtra.AI for 7 days and see how feedback can become useful information for your business.',
    footer: 'Filtra.AI',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
  },
  es: {
    badge: 'Inteligencia de reputación para empresas',
    heroTitle: 'Tu reputación puede trabajar',
    heroAccent: 'por ti.',
    heroText:
      'Centraliza los comentarios, entiende lo que dicen tus clientes y usa IA para convertir las reseñas en acciones que mejoren la experiencia.',
    start: 'Comenzar prueba gratis de 7 días',
    howCta: 'Ver cómo funciona',
    noCard: 'Sin tarjeta',
    quick: 'Configuración rápida',
    cancel: 'Cancela cuando quieras',
    howEyebrow: 'Cómo funciona',
    howTitle: 'Del comentario a la acción en pocos pasos.',
    howText:
      'Filtra.AI organiza todo el ciclo de reputación para que tu equipo dedique menos tiempo a buscar problemas y más a resolverlos.',
    steps: [
      ['01', 'Recopila', 'QR Code, enlace o canales conectados llevan al cliente al flujo de evaluación.'],
      ['02', 'Entiende', 'La IA identifica sentimiento, temas recurrentes y puntos de atención.'],
      ['03', 'Actúa', 'Tu equipo recibe contexto para responder, mejorar y seguir la evolución.'],
    ],
    plansEyebrow: 'Planes',
    plansTitle: 'Empieza pequeño. Crece cuando lo necesites.',
    plansText: 'Elige el plan ideal para tu operación.',
    finalTitle: 'Empieza a entender tu reputación hoy.',
    finalText: 'Prueba Filtra.AI durante 7 días y descubre cómo los comentarios pueden convertirse en información útil.',
    footer: 'Filtra.AI',
    privacy: 'Política de Privacidad',
    terms: 'Términos de Uso',
  },
  zh: {
    badge: '企业声誉智能',
    heroTitle: '让您的声誉真正',
    heroAccent: '为您工作。',
    heroText: '集中管理客户反馈，了解客户真正的声音，并利用 AI 将评价转化为改善体验的行动。',
    start: '免费试用 7 天',
    howCta: '了解工作方式',
    noCard: '无需信用卡',
    quick: '快速配置',
    cancel: '随时取消',
    howEyebrow: '工作方式',
    howTitle: '从反馈到行动，只需几步。',
    howText: 'Filtra.AI 管理完整的声誉流程，让团队减少寻找问题的时间，把更多时间用于解决问题。',
    steps: [
      ['01', '收集', '通过二维码、链接或已连接渠道进入评价流程。'],
      ['02', '理解', 'AI 识别情绪、重复主题和需要关注的事项。'],
      ['03', '行动', '团队获得上下文，用于回复、改进并跟踪变化。'],
    ],
    plansEyebrow: '方案',
    plansTitle: '从小开始，按需成长。',
    plansText: '选择适合当前业务的方案。',
    finalTitle: '今天就开始了解您的声誉。',
    finalText: '免费试用 Filtra.AI 7 天，看看客户反馈如何成为企业有价值的信息。',
    footer: 'Filtra.AI',
    privacy: '隐私政策',
    terms: '使用条款',
  },
};

export default function LandingPreview() {
  const { language } = useLanguage();
  const c = copy[language] || copy.pt;

  return (
    <>
      <PreviewNavigator />
      <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
          <BrandMark size="md" subtitle="Reputação" href="/" />
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
              <a href="#como-funciona" className="hover:text-white">
                {c.howEyebrow}
              </a>
              <a href="#planos" className="hover:text-white">
                {c.plansEyebrow}
              </a>
            </div>
            <a
              href="/login?trial=7"
              className="hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:inline-flex"
            >
              {c.start}
            </a>
          </div>
        </nav>

        <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs text-indigo-200">
            <Zap size={13} /> {c.badge}
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-6xl lg:text-7xl">
            {c.heroTitle}{' '}
            <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {c.heroAccent}
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">{c.heroText}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/login?trial=7"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              {c.start} <ArrowRight size={16} />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              {c.howCta}
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> {c.noCard}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> {c.quick}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> {c.cancel}
            </span>
          </div>
        </section>

        <section id="como-funciona" className="border-t border-white/10 bg-white/[0.02] py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{c.howEyebrow}</div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{c.howTitle}</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">{c.howText}</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {c.steps.map(([n, title, body]) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                  <div className="text-sm font-semibold text-indigo-300">{n}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{c.plansEyebrow}</div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{c.plansTitle}</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">{c.plansText}</p>
            <div className="mt-10">
              <PlanCards />
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <Sparkles className="mx-auto text-indigo-300" size={28} />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{c.finalTitle}</h2>
            <p className="mt-4 text-zinc-400">{c.finalText}</p>
            <a
              href="/login?trial=7"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              {c.start} <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row lg:px-8">
            <span>{c.footer}</span>
            <div className="flex gap-4">
              <a href="/privacidade" className="hover:text-zinc-300">
                {c.privacy}
              </a>
              <a href="/termos" className="hover:text-zinc-300">
                {c.terms}
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
