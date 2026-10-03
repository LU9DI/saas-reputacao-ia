import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuditoriaGratuitaClient } from '../../auditoria-gratuita/AuditoriaGratuitaClient';

type Lang = 'en' | 'es' | 'zh';

const meta: Record<Lang, { title: string; description: string }> = {
  en: { title: 'Free review and online reputation audit | Filtra.AI', description: 'Run a free audit of your company reviews and identify strengths, risks, recurring themes, and improvement opportunities.' },
  es: { title: 'Auditoría gratuita de reseñas y reputación online | Filtra.AI', description: 'Realiza una auditoría gratuita de las reseñas de tu empresa e identifica fortalezas, riesgos, temas recurrentes y oportunidades de mejora.' },
  zh: { title: '免费评价与在线声誉审计 | Filtra.AI', description: '免费分析企业评价，发现优势、风险、重复主题和改善机会。' },
};

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }, { lang: 'zh' }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!(lang in meta)) return {};
  const key = lang as Lang;
  return {
    title: meta[key].title,
    description: meta[key].description,
    alternates: {
      canonical: `https://filtraai.com/${lang}/auditoria-gratuita`,
      languages: {
        'pt-BR': 'https://filtraai.com/auditoria-gratuita',
        en: 'https://filtraai.com/en/auditoria-gratuita',
        es: 'https://filtraai.com/es/auditoria-gratuita',
        zh: 'https://filtraai.com/zh/auditoria-gratuita',
        'x-default': 'https://filtraai.com/auditoria-gratuita',
      },
    },
  };
}

export default async function LocalizedAuditPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!(lang in meta)) notFound();
  return <AuditoriaGratuitaClient language={lang as Lang} />;
}
