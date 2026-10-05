import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import { LanguageProvider, type Language } from '../../Contexts/LanguageContext';

import HomePage from '../../page';
import IaPage from '../../ia/page';
import FiltraAiPage from '../../filtra-ai/page';
import FeedbackPage from '../../feedback-de-clientes/page';
import AiReviewsPage from '../../analise-de-avaliacoes-com-ia/page';
import ReputationPage from '../../gestao-de-reputacao-online/page';
import GoogleReviewsPage from '../../avaliacoes-google/page';
import GoogleReputationPage from '../../reputacao-google/page';
import ImproveGoogleReviewsPage from '../../como-melhorar-avaliacoes-google/page';
import MonitoringPage from '../../monitoramento-reputacao-online/page';
import FeedbackManagementPage from '../../gestao-de-feedback/page';
import AuditPage from '../../auditoria-gratuita/page';

type RouteConfig = {
  root: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
};

const ROUTES: Record<string, RouteConfig> = {
  '': {
    root: '/',
    title: {
      pt: 'Filtra.AI — Transforme a voz do cliente em crescimento',
      en: 'Filtra.AI — Turn customer voice into growth',
      es: 'Filtra.AI — Convierte la voz del cliente en crecimiento',
      zh: 'Filtra.AI — 将客户之声转化为增长',
    },
    description: {
      pt: 'Transforme avaliações e feedback de clientes em inteligência para crescimento e reputação.',
      en: 'Turn customer reviews and feedback into intelligence for growth and reputation.',
      es: 'Convierte reseñas y feedback de clientes en inteligencia para crecimiento y reputación.',
      zh: '将客户评价和反馈转化为增长与声誉洞察。',
    },
  },
  ai: {
    root: '/ia',
    title: { pt: 'Filtra.AI para IA', en: 'Bring your reputation into AI', es: 'Lleva tu reputación a la IA', zh: '将企业声誉带入 AI' },
    description: { pt: 'Conecte a reputação da sua empresa a agentes de IA.', en: 'Connect your company reputation to AI agents.', es: 'Conecta la reputación de tu empresa con agentes de IA.', zh: '将企业声誉连接到 AI 智能代理。' },
  },
  'filtra-ai': {
    root: '/filtra-ai',
    title: { pt: 'Filtra.AI — Gestão de reputação', en: 'Filtra.AI — Reputation management', es: 'Filtra.AI — Gestión de reputación', zh: 'Filtra.AI — 声誉管理' },
    description: { pt: 'Gestão de avaliações, feedback e reputação online com IA.', en: 'AI-powered review, feedback and online reputation management.', es: 'Gestión de reseñas, feedback y reputación online con IA.', zh: '使用 AI 管理评价、反馈和在线声誉。' },
  },
  'customer-feedback': {
    root: '/feedback-de-clientes',
    title: { pt: 'Feedback de clientes: transforme opiniões em crescimento', en: 'Customer feedback: turn opinions into growth', es: 'Feedback de clientes: convierte opiniones en crecimiento', zh: '客户反馈：将意见转化为增长' },
    description: { pt: 'Entenda o que seus clientes estão dizendo e transforme feedback em decisões.', en: 'Understand what customers are saying and turn feedback into decisions.', es: 'Entiende lo que dicen tus clientes y convierte el feedback en decisiones.', zh: '了解客户声音并将反馈转化为决策。' },
  },
  'feedback-clientes': {
    root: '/feedback-de-clientes',
    title: { pt: 'Feedback de clientes: transforme opiniões em crescimento', en: 'Customer feedback: turn opinions into growth', es: 'Feedback de clientes: convierte opiniones en crecimiento', zh: '客户反馈：将意见转化为增长' },
    description: { pt: 'Entenda o que seus clientes estão dizendo e transforme feedback em decisões.', en: 'Understand what customers are saying and turn feedback into decisions.', es: 'Entiende lo que dicen tus clientes y convierte el feedback en decisiones.', zh: '了解客户声音并将反馈转化为决策。' },
  },
  'ai-review-analysis': {
    root: '/analise-de-avaliacoes-com-ia',
    title: { pt: 'Análise de avaliações com IA para empresas', en: 'AI review analysis for companies', es: 'Análisis de reseñas con IA para empresas', zh: '企业 AI 评价分析' },
    description: { pt: 'Analise avaliações com IA para identificar temas, riscos e oportunidades.', en: 'Analyze reviews with AI to identify themes, risks and opportunities.', es: 'Analiza reseñas con IA para identificar temas, riesgos y oportunidades.', zh: '使用 AI 分析评价，发现主题、风险和机会。' },
  },
  'analisis-resenas-ia': {
    root: '/analise-de-avaliacoes-com-ia',
    title: { pt: 'Análise de avaliações com IA para empresas', en: 'AI review analysis for companies', es: 'Análisis de reseñas con IA para empresas', zh: '企业 AI 评价分析' },
    description: { pt: 'Analise avaliações com IA para identificar temas, riscos e oportunidades.', en: 'Analyze reviews with AI to identify themes, risks and opportunities.', es: 'Analiza reseñas con IA para identificar temas, riesgos y oportunidades.', zh: '使用 AI 分析评价，发现主题、风险和机会。' },
  },
  'online-reputation-management': {
    root: '/gestao-de-reputacao-online',
    title: { pt: 'Gestão de reputação online para empresas', en: 'Online reputation management for companies', es: 'Gestión de reputación online para empresas', zh: '企业在线声誉管理' },
    description: { pt: 'Monitore avaliações, analise feedback e transforme reputação em crescimento.', en: 'Monitor reviews, analyze feedback and turn reputation into growth.', es: 'Monitorea reseñas, analiza feedback y convierte reputación en crecimiento.', zh: '监测评价、分析反馈并将声誉转化为增长。' },
  },
  'gestion-reputacion-online': {
    root: '/gestao-de-reputacao-online',
    title: { pt: 'Gestão de reputação online para empresas', en: 'Online reputation management for companies', es: 'Gestión de reputación online para empresas', zh: '企业在线声誉管理' },
    description: { pt: 'Monitore avaliações, analise feedback e transforme reputação em crescimento.', en: 'Monitor reviews, analyze feedback and turn reputation into growth.', es: 'Monitorea reseñas, analiza feedback y convierte reputación en crecimiento.', zh: '监测评价、分析反馈并将声誉转化为增长。' },
  },
  'google-reviews': {
    root: '/avaliacoes-google',
    title: { pt: 'Gestão de avaliações Google', en: 'Google review management', es: 'Gestión de reseñas de Google', zh: 'Google 评价管理' },
    description: { pt: 'Transforme avaliações Google e feedback em uma rotina de gestão.', en: 'Turn Google reviews and customer feedback into a management routine.', es: 'Convierte reseñas de Google y feedback en una rutina de gestión.', zh: '将 Google 评价和客户反馈转化为管理流程。' },
  },
  'resenas-google': {
    root: '/avaliacoes-google',
    title: { pt: 'Gestão de avaliações Google', en: 'Google review management', es: 'Gestión de reseñas de Google', zh: 'Google 评价管理' },
    description: { pt: 'Transforme avaliações Google e feedback em uma rotina de gestão.', en: 'Turn Google reviews and customer feedback into a management routine.', es: 'Convierte reseñas de Google y feedback en una rutina de gestión.', zh: '将 Google 评价和客户反馈转化为管理流程。' },
  },
  'google-reputation': {
    root: '/reputacao-google',
    title: { pt: 'Reputação no Google', en: 'Google reputation', es: 'Reputación en Google', zh: 'Google 声誉' },
    description: { pt: 'Entenda e melhore os sinais que formam a reputação da sua empresa no Google.', en: 'Understand and improve the signals shaping your Google reputation.', es: 'Entiende y mejora las señales que forman tu reputación en Google.', zh: '了解并改善影响 Google 声誉的信号。' },
  },
  'reputacion-google': {
    root: '/reputacao-google',
    title: { pt: 'Reputação no Google', en: 'Google reputation', es: 'Reputación en Google', zh: 'Google 声誉' },
    description: { pt: 'Entenda e melhore os sinais que formam a reputação da sua empresa no Google.', en: 'Understand and improve the signals shaping your Google reputation.', es: 'Entiende y mejora las señales que forman tu reputación en Google.', zh: '了解并改善影响 Google 声誉的信号。' },
  },
  'improve-google-reviews': {
    root: '/como-melhorar-avaliacoes-google',
    title: { pt: 'Como melhorar avaliações Google', en: 'How to improve Google reviews', es: 'Cómo mejorar las reseñas de Google', zh: '如何改善 Google 评价' },
    description: { pt: 'Melhore a experiência e facilite avaliações honestas dos seus clientes.', en: 'Improve the experience and make it easier for customers to leave honest reviews.', es: 'Mejora la experiencia y facilita reseñas honestas.', zh: '改善体验并让客户更容易留下真实评价。' },
  },
  'mejorar-resenas-google': {
    root: '/como-melhorar-avaliacoes-google',
    title: { pt: 'Como melhorar avaliações Google', en: 'How to improve Google reviews', es: 'Cómo mejorar las reseñas de Google', zh: '如何改善 Google 评价' },
    description: { pt: 'Melhore a experiência e facilite avaliações honestas dos seus clientes.', en: 'Improve the experience and make it easier for customers to leave honest reviews.', es: 'Mejora la experiencia y facilita reseñas honestas.', zh: '改善体验并让客户更容易留下真实评价。' },
  },
  'online-reputation-monitoring': {
    root: '/monitoramento-reputacao-online',
    title: { pt: 'Monitoramento de reputação online', en: 'Online reputation monitoring', es: 'Monitoreo de reputación online', zh: '在线声誉监测' },
    description: { pt: 'Monitore mudanças em avaliações, temas e percepção dos clientes.', en: 'Monitor changes in reviews, themes and customer perception.', es: 'Monitorea cambios en reseñas, temas y percepción de clientes.', zh: '持续监测评价、主题和客户感知变化。' },
  },
  'monitoreo-reputacion-online': {
    root: '/monitoramento-reputacao-online',
    title: { pt: 'Monitoramento de reputação online', en: 'Online reputation monitoring', es: 'Monitoreo de reputación online', zh: '在线声誉监测' },
    description: { pt: 'Monitore mudanças em avaliações, temas e percepção dos clientes.', en: 'Monitor changes in reviews, themes and customer perception.', es: 'Monitorea cambios en reseñas, temas y percepción de clientes.', zh: '持续监测评价、主题和客户感知变化。' },
  },
  'customer-feedback-management': {
    root: '/gestao-de-feedback',
    title: { pt: 'Gestão de feedback de clientes', en: 'Customer feedback management', es: 'Gestión del feedback de clientes', zh: '客户反馈管理' },
    description: { pt: 'Organize feedback, temas e prioridades para transformar opinião em ação.', en: 'Organize feedback, themes and priorities to turn opinion into action.', es: 'Organiza feedback, temas y prioridades para convertir opinión en acción.', zh: '整理反馈、主题和优先级，将意见转化为行动。' },
  },
  'gestion-feedback-clientes': {
    root: '/gestao-de-feedback',
    title: { pt: 'Gestão de feedback de clientes', en: 'Customer feedback management', es: 'Gestión del feedback de clientes', zh: '客户反馈管理' },
    description: { pt: 'Organize feedback, temas e prioridades para transformar opinião em ação.', en: 'Organize feedback, themes and priorities to turn opinion into action.', es: 'Organiza feedback, temas y prioridades para convertir opinión en acción.', zh: '整理反馈、主题和优先级，将意见转化为行动。' },
  },
  'free-review-audit': {
    root: '/auditoria-gratuita',
    title: { pt: 'Auditoria gratuita de avaliações e reputação online', en: 'Free review and online reputation audit', es: 'Auditoría gratuita de reseñas y reputación online', zh: '免费评价与在线声誉审计' },
    description: { pt: 'Faça uma auditoria gratuita das avaliações da sua empresa.', en: 'Get a free audit of your company reviews and online reputation.', es: 'Haz una auditoría gratuita de las reseñas de tu empresa.', zh: '免费分析企业评价和在线声誉。' },
  },
  'auditoria-gratuita': {
    root: '/auditoria-gratuita',
    title: { pt: 'Auditoria gratuita de avaliações e reputação online', en: 'Free review and online reputation audit', es: 'Auditoría gratuita de reseñas y reputación online', zh: '免费评价与在线声誉审计' },
    description: { pt: 'Faça uma auditoria gratuita das avaliações da sua empresa.', en: 'Get a free audit of your company reviews and online reputation.', es: 'Haz una auditoría gratuita de las reseñas de tu empresa.', zh: '免费分析企业评价和在线声誉。' },
  },
};

const COMPONENTS: Record<string, ComponentType> = {
  '/': HomePage,
  '/ia': IaPage,
  '/filtra-ai': FiltraAiPage,
  '/feedback-de-clientes': FeedbackPage,
  '/analise-de-avaliacoes-com-ia': AiReviewsPage,
  '/gestao-de-reputacao-online': ReputationPage,
  '/avaliacoes-google': GoogleReviewsPage,
  '/reputacao-google': GoogleReputationPage,
  '/como-melhorar-avaliacoes-google': ImproveGoogleReviewsPage,
  '/monitoramento-reputacao-online': MonitoringPage,
  '/gestao-de-feedback': FeedbackManagementPage,
  '/auditoria-gratuita': AuditPage,
};

const LOCALES: Language[] = ['en', 'es', 'zh'];

function configFor(slug: string[]) {
  return ROUTES[slug.join('/')] || null;
}

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    Object.keys(ROUTES).map((slug) => ({
      locale,
      slug: slug ? slug.split('/') : [],
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug = [] } = await params;
  if (!LOCALES.includes(locale as Language)) return {};
  const config = configFor(slug);
  if (!config) return {};

  const lang = locale as Language;
  const currentPath = `/${locale}${slug.length ? `/${slug.join('/')}` : ''}`;
  const localized = Object.fromEntries(
    LOCALES.map((l) => [l, `https://filtraai.com/${l}${slugForLocale(config.root, l)}`]),
  );

  return {
    title: config.title[lang],
    description: config.description[lang],
    alternates: {
      canonical: `https://filtraai.com${currentPath}`,
      languages: {
        'pt-BR': `https://filtraai.com${config.root}`,
        en: localized.en,
        es: localized.es,
        zh: localized.zh,
        'x-default': `https://filtraai.com${config.root}`,
      },
    },
    openGraph: {
      title: config.title[lang],
      description: config.description[lang],
      url: `https://filtraai.com${currentPath}`,
      type: 'website',
    },
  };
}

function slugForLocale(root: string, locale: Language): string {
  const map: Record<string, Record<Language, string>> = {
    '/': { pt: '', en: '', es: '', zh: '' },
    '/ia': { pt: 'ai', en: 'ai', es: 'ia', zh: 'ai' },
    '/filtra-ai': { pt: 'filtra-ai', en: 'filtra-ai', es: 'filtra-ai', zh: 'filtra-ai' },
    '/feedback-de-clientes': { pt: 'customer-feedback', en: 'customer-feedback', es: 'feedback-clientes', zh: 'customer-feedback' },
    '/analise-de-avaliacoes-com-ia': { pt: 'ai-review-analysis', en: 'ai-review-analysis', es: 'analisis-resenas-ia', zh: 'ai-review-analysis' },
    '/gestao-de-reputacao-online': { pt: 'online-reputation-management', en: 'online-reputation-management', es: 'gestion-reputacion-online', zh: 'online-reputation-management' },
    '/avaliacoes-google': { pt: 'google-reviews', en: 'google-reviews', es: 'resenas-google', zh: 'google-reviews' },
    '/reputacao-google': { pt: 'google-reputation', en: 'google-reputation', es: 'reputacion-google', zh: 'google-reputation' },
    '/como-melhorar-avaliacoes-google': { pt: 'improve-google-reviews', en: 'improve-google-reviews', es: 'mejorar-resenas-google', zh: 'improve-google-reviews' },
    '/monitoramento-reputacao-online': { pt: 'online-reputation-monitoring', en: 'online-reputation-monitoring', es: 'monitoreo-reputacion-online', zh: 'online-reputation-monitoring' },
    '/gestao-de-feedback': { pt: 'customer-feedback-management', en: 'customer-feedback-management', es: 'gestion-feedback-clientes', zh: 'customer-feedback-management' },
    '/auditoria-gratuita': { pt: 'free-review-audit', en: 'free-review-audit', es: 'auditoria-gratuita', zh: 'free-review-audit' },
  };
  const value = map[root]?.[locale] ?? map[root]?.en ?? '';
  return value ? `/${value}` : '';
}

export default async function LocalizedPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug = [] } = await params;
  if (!LOCALES.includes(locale as Language)) notFound();

  const config = configFor(slug);
  if (!config) notFound();

  const Page = COMPONENTS[config.root];
  if (!Page) notFound();

  return (
    <LanguageProvider initial={locale as Language}>
      <Page />
    </LanguageProvider>
  );
}
