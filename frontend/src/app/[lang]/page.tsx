import type { Metadata } from 'next';
import LandingPreview from '../preview/page';

type Lang = 'en' | 'es' | 'zh';

const meta: Record<Lang, { title: string; description: string }> = {
  en: {
    title: 'AI reputation management for businesses | Filtra.AI',
    description: 'Centralize customer feedback, understand reviews with AI, and turn reputation signals into actions that improve customer experience.',
  },
  es: {
    title: 'Gestión de reputación online con IA | Filtra.AI',
    description: 'Centraliza comentarios de clientes, entiende las reseñas con IA y convierte las señales de reputación en acciones para mejorar la experiencia.',
  },
  zh: {
    title: 'AI 企业在线声誉管理 | Filtra.AI',
    description: '集中管理客户反馈，用 AI 理解评价，并将声誉信号转化为改善客户体验的行动。',
  },
};

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }, { lang: 'zh' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Lang }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const m = meta[lang];
  const canonical = `https://filtraai.com/${lang}`;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical,
      languages: {
        'pt-BR': 'https://filtraai.com/',
        en: 'https://filtraai.com/en',
        es: 'https://filtraai.com/es',
        zh: 'https://filtraai.com/zh',
        'x-default': 'https://filtraai.com/',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: m.title,
      description: m.description,
      locale: lang === 'en' ? 'en_US' : lang === 'es' ? 'es_ES' : 'zh_CN',
    },
  };
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ lang: Lang }>;
}) {
  const { lang } = await params;
  return <LandingPreview />;
}
