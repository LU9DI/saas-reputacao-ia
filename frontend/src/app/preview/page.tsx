'use client';

import { ArrowRight, BarChart3, Bot, Check, MessageSquare, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
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
  reputation: string;
  feedbacks: string;
  positives: string;
  alerts: string;
  patterns: string;
  weekly: string;
  strip: [string, string][];
  howEyebrow: string;
  howTitle: string;
  howText: string;
  steps: [string, string, string][];
  featuresEyebrow: string;
  featuresTitle: string;
  featuresText: string;
  features: [string, string][];
  plansEyebrow: string;
  plansTitle: string;
  plansText: string;
  finalTitle: string;
  finalText: string;
  footer: string;
};

const copy: Record<Language, Copy> = {
  pt: {
    badge: 'Inteligência de reputação para empresas',
    heroTitle: 'Sua reputação pode trabalhar',
    heroAccent: 'por você.',
    heroText: 'Centralize feedbacks, entenda o que seus clientes estão dizendo e use IA para transformar avaliações em ações que melhoram a experiência.',
    start: 'Começar 7 dias grátis',
    howCta: 'Ver como funciona',
    noCard: 'Sem cartão',
    quick: 'Configuração rápida',
    cancel: 'Cancele quando quiser',
    reputation: 'Reputação geral',
    feedbacks: 'Feedbacks',
    positives: 'Positivos',
    alerts: 'Alertas',
    patterns: 'IA encontrou 3 padrões',
    weekly: 'Resumo semanal pronto para o gestor',
    strip: [['Feedbacks centralizados', 'Pare de procurar informação em vários canais.'], ['IA que encontra padrões', 'Veja temas e sinais que passariam despercebidos.'], ['Ação mais rápida', 'Transforme feedback em decisões e respostas.']],
    howEyebrow: 'Como funciona',
    howTitle: 'Do feedback à ação em poucos passos.',
    howText: 'O Filtra.AI organiza o ciclo completo da reputação para sua equipe gastar menos tempo procurando problemas e mais tempo resolvendo-os.',
    steps: [['01', 'Colete', 'QR Code, link ou canais conectados levam o cliente ao fluxo de avaliação.'], ['02', 'Entenda', 'A IA identifica sentimento, temas recorrentes e pontos de atenção.'], ['03', 'Aja', 'Sua equipe recebe contexto para responder, corrigir e acompanhar a evolução.']],
    featuresEyebrow: 'Recursos',
    featuresTitle: 'Mais do que avaliações.',
    featuresText: 'Uma camada de inteligência para entender a experiência do cliente e proteger a reputação da empresa.',
    features: [['IA para feedback', 'Transforme centenas de avaliações em sinais claros sobre atendimento, produto e experiência.'], ['Respostas mais rápidas', 'Identifique o que merece atenção e acelere a rotina de resposta com apoio da IA.'], ['Visão da reputação', 'Acompanhe notas, tendências, temas e evolução em um único painel.'], ['Alertas inteligentes', 'Saiba quando uma experiência ruim precisa de atenção antes que vire um problema maior.']],
    plansEyebrow: 'Planos',
    plansTitle: 'Comece pequeno. Cresça quando precisar.',
    plansText: 'Os planos atuais continuam aqui; esta versão apenas muda a forma como o visitante chega até eles.',
    finalTitle: 'Comece a entender sua reputação hoje.',
    finalText: 'Teste o Filtra.AI por 7 dias e veja como feedbacks podem virar informação útil para sua empresa.',
    footer: 'Filtra.AI · Preview de redesign · Não altera a landing atual',
  },
  en: {
    badge: 'Reputation intelligence for businesses',
    heroTitle: 'Your reputation can work',
    heroAccent: 'for you.',
    heroText: 'Centralize feedback, understand what customers are saying, and use AI to turn reviews into actions that improve the experience.',
    start: 'Start 7-day free trial',
    howCta: 'See how it works',
    noCard: 'No credit card',
    quick: 'Fast setup',
    cancel: 'Cancel anytime',
    reputation: 'Overall reputation',
    feedbacks: 'Feedback',
    positives: 'Positive',
    alerts: 'Alerts',
    patterns: 'AI found 3 patterns',
    weekly: 'Weekly summary ready for the manager',
    strip: [['Centralized feedback', 'Stop searching for information across multiple channels.'], ['AI that finds patterns', 'See themes and signals that could go unnoticed.'], ['Faster action', 'Turn feedback into decisions and responses.']],
    howEyebrow: 'How it works',
    howTitle: 'From feedback to action in a few steps.',
    howText: 'Filtra.AI organizes the full reputation cycle so your team spends less time looking for problems and more time solving them.',
    steps: [['01', 'Collect', 'QR Code, link, or connected channels take customers into the review flow.'], ['02', 'Understand', 'AI identifies sentiment, recurring themes, and points that need attention.'], ['03', 'Act', 'Your team gets context to respond, improve, and track progress.']],
    featuresEyebrow: 'Features',
    featuresTitle: 'More than reviews.',
    featuresText: 'An intelligence layer to understand customer experience and protect your company reputation.',
    features: [['AI for feedback', 'Turn hundreds of reviews into clear signals about service, product, and experience.'], ['Faster responses', 'Identify what needs attention and speed up your response workflow with AI support.'], ['Reputation view', 'Track ratings, trends, topics, and progress in one dashboard.'], ['Smart alerts', 'Know when a poor experience needs attention before it becomes a bigger issue.']],
    plansEyebrow: 'Plans',
    plansTitle: 'Start small. Grow when you need to.',
    plansText: 'The current plans remain here; this version only changes how visitors reach them.',
    finalTitle: 'Start understanding your reputation today.',
    finalText: 'Try Filtra.AI for 7 days and see how feedback can become useful information for your business.',
    footer: 'Filtra.AI · Redesign preview · Does not change the current landing',
  },
  es: {
    badge: 'Inteligencia de reputación para empresas',
    heroTitle: 'Tu reputación puede trabajar',
    heroAccent: 'por ti.',
    heroText: 'Centraliza los comentarios, entiende lo que dicen tus clientes y usa IA para convertir las reseñas en acciones que mejoren la experiencia.',
    start: 'Comenzar prueba gratis de 7 días',
    howCta: 'Ver cómo funciona',
    noCard: 'Sin tarjeta',
    quick: 'Configuración rápida',
    cancel: 'Cancela cuando quieras',
    reputation: 'Reputación general',
    feedbacks: 'Comentarios',
    positives: 'Positivos',
    alerts: 'Alertas',
    patterns: 'La IA encontró 3 patrones',
    weekly: 'Resumen semanal listo para el gestor',
    strip: [['Comentarios centralizados', 'Deja de buscar información en varios canales.'], ['IA que encuentra patrones', 'Detecta temas y señales que podrían pasar desapercibidos.'], ['Acción más rápida', 'Convierte los comentarios en decisiones y respuestas.']],
    howEyebrow: 'Cómo funciona',
    howTitle: 'Del comentario a la acción en pocos pasos.',
    howText: 'Filtra.AI organiza todo el ciclo de reputación para que tu equipo dedique menos tiempo a buscar problemas y más a resolverlos.',
    steps: [['01', 'Recopila', 'QR Code, enlace o canales conectados llevan al cliente al flujo de evaluación.'], ['02', 'Entiende', 'La IA identifica sentimiento, temas recurrentes y puntos de atención.'], ['03', 'Actúa', 'Tu equipo recibe contexto para responder, mejorar y seguir la evolución.']],
    featuresEyebrow: 'Recursos',
    featuresTitle: 'Mucho más que reseñas.',
    featuresText: 'Una capa de inteligencia para entender la experiencia del cliente y proteger la reputación de la empresa.',
    features: [['IA para comentarios', 'Convierte cientos de reseñas en señales claras sobre atención, producto y experiencia.'], ['Respuestas más rápidas', 'Identifica lo que merece atención y acelera las respuestas con apoyo de la IA.'], ['Visión de reputación', 'Acompaña notas, tendencias, temas y evolución en un solo panel.'], ['Alertas inteligentes', 'Sabe cuándo una mala experiencia necesita atención antes de convertirse en un problema mayor.']],
    plansEyebrow: 'Planes',
    plansTitle: 'Empieza pequeño. Crece cuando lo necesites.',
    plansText: 'Los planes actuales siguen aquí; esta versión solo cambia la forma en que el visitante llega a ellos.',
    finalTitle: 'Empieza a entender tu reputación hoy.',
    finalText: 'Prueba Filtra.AI durante 7 días y descubre cómo los comentarios pueden convertirse en información útil para tu empresa.',
    footer: 'Filtra.AI · Vista previa del rediseño · No cambia la landing actual',
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
    reputation: '整体声誉',
    feedbacks: '反馈',
    positives: '正面反馈',
    alerts: '提醒',
    patterns: 'AI 发现 3 个模式',
    weekly: '每周摘要已准备好',
    strip: [['集中管理反馈', '无需再从多个渠道寻找信息。'], ['AI 发现模式', '发现容易被忽略的主题和信号。'], ['更快采取行动', '将反馈转化为决策和回复。']],
    howEyebrow: '工作方式',
    howTitle: '从反馈到行动，只需几步。',
    howText: 'Filtra.AI 管理完整的声誉流程，让团队减少寻找问题的时间，把更多时间用于解决问题。',
    steps: [['01', '收集', '通过二维码、链接或已连接渠道进入评价流程。'], ['02', '理解', 'AI 识别情绪、重复主题和需要关注的事项。'], ['03', '行动', '团队获得上下文，用于回复、改进并跟踪变化。']],
    featuresEyebrow: '功能',
    featuresTitle: '不只是评价。',
    featuresText: '用智能分析了解客户体验，并保护企业声誉。',
    features: [['AI 分析反馈', '将数百条评价转化为关于服务、产品和体验的清晰信号。'], ['更快回复', '快速发现需要关注的内容，并借助 AI 加速回复流程。'], ['声誉视图', '在一个面板中跟踪评分、趋势、主题和变化。'], ['智能提醒', '在糟糕体验扩大之前及时发现需要处理的问题。']],
    plansEyebrow: '方案',
    plansTitle: '从小开始，按需成长。',
    plansText: '现有方案保持不变；这个版本只是改变访客到达方案页面的方式。',
    finalTitle: '今天就开始了解您的声誉。',
    finalText: '免费试用 Filtra.AI 7 天，看看客户反馈如何成为企业有价值的信息。',
    footer: 'Filtra.AI · 重设计预览 · 不改变当前首页',
  },
};

function DashboardMockup({ c }: { c: Copy }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/90 shadow-2xl shadow-indigo-950/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-zinc-600">Filtra.AI</span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{c.reputation}</span>
              <span className="text-xs text-emerald-400">+18,4%</span>
            </div>
            <div className="mt-2 flex items-end gap-3"><strong className="text-4xl text-white">4,8</strong><span className="pb-1 text-sm text-zinc-500">/ 5,0</span></div>
            <div className="mt-4 h-20 rounded-xl bg-gradient-to-b from-indigo-500/20 to-transparent p-2">
              <svg viewBox="0 0 500 90" className="h-full w-full"><path d="M0 70 C80 58 95 65 145 48 S220 55 270 36 S350 42 400 22 S450 30 500 8" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-400" /></svg>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[ '1.284', c.feedbacks ], [ '91%', c.positives ], [ '37', c.alerts ]].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="text-lg font-semibold text-white">{value}</div><div className="mt-1 text-[10px] text-zinc-500">{label}</div></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Bot size={16} className="text-indigo-300" /> {c.patterns}</div>
          <div className="mt-4 space-y-3">
            {['Atendimento elogiado', 'Tempo de espera', 'Equipe bem avaliada'].map((item, i) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between text-xs text-zinc-300"><span>{item}</span><span className="text-indigo-300">{[82, 64, 91][i]}%</span></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-indigo-400" style={{ width: [82, 64, 91][i] + '%' }} /></div></div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-200">✓ {c.weekly}</div>
        </div>
      </div>
    </div>
  );
}

const icons = [Sparkles, MessageSquare, BarChart3, ShieldCheck];

export default function LandingPreview() {
  const { language } = useLanguage();
  const c = copy[language];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(79,70,229,.24),transparent_30%),radial-gradient(circle_at_15%_20%,rgba(14,165,233,.12),transparent_25%)]" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
          <BrandMark size="md" subtitle="Reputação" href="/" />
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#como-funciona" className="hover:text-white">{c.howEyebrow}</a>
            <a href="#recursos" className="hover:text-white">{c.featuresEyebrow}</a>
            <a href="#planos" className="hover:text-white">{c.plansEyebrow}</a>
            <a href="/login" className="hover:text-white">{language === 'pt' ? 'Entrar' : language === 'en' ? 'Sign in' : language === 'es' ? 'Entrar' : '登录'}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <a href="/#trial" className="hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:inline-flex">{c.start}</a>
          </div>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-32 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs text-indigo-200"><Zap size={13} /> {c.badge}</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-6xl lg:text-7xl">{c.heroTitle} <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">{c.heroAccent}</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">{c.heroText}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/#trial" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400">{c.start} <ArrowRight size={17} /></a>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-medium text-zinc-200 hover:bg-white/[0.06]">{c.howCta}</a>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500"><span>✓ {c.noCard}</span><span>✓ {c.quick}</span><span>✓ {c.cancel}</span></div>
          </div>
          <DashboardMockup c={c} />
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:grid-cols-3 lg:px-8">
          {c.strip.map(([title, text]) => <div key={title} className="flex gap-3"><Check className="mt-0.5 text-indigo-400" size={18} /><div><div className="font-medium text-zinc-200">{title}</div><div className="mt-1 text-sm text-zinc-500">{text}</div></div></div>)}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">{c.howEyebrow}</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.howTitle}</h2><p className="mt-5 text-lg leading-8 text-zinc-400">{c.howText}</p></div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">{c.steps.map(([n, title, text]) => <div key={n} className="rounded-3xl border border-white/10 bg-white/[0.025] p-7"><div className="text-sm text-indigo-400">{n}</div><h3 className="mt-5 text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-zinc-500">{text}</p></div>)}</div>
      </section>

      <section id="recursos" className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">{c.featuresEyebrow}</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.featuresTitle}</h2><p className="mt-5 text-lg leading-8 text-zinc-400">{c.featuresText}</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">{c.features.map(([title, text], i) => { const Icon = icons[i]; return <div key={title} className="rounded-3xl border border-white/10 bg-black/20 p-7"><Icon size={22} className="text-indigo-300" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-zinc-500">{text}</p></div>; })}</div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10 max-w-2xl"><span className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">{c.plansEyebrow}</span><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.plansTitle}</h2><p className="mt-5 text-zinc-400">{c.plansText}</p></div>
        <PlanCards />
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-white/[0.03] to-violet-500/10 p-8 text-center sm:p-14">
          <Star className="mx-auto text-indigo-300" size={26} fill="currentColor" />
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{c.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">{c.finalText}</p>
          <a href="/#trial" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-black hover:bg-zinc-200">{c.start} <ArrowRight size={17} /></a>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><BrandMark size="sm" subtitle="Reputação" href="/" /><div className="text-xs text-zinc-600">{c.footer}</div></div>
      </footer>
    </main>
  );
}
