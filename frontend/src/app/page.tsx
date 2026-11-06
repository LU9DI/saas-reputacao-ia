import { serializeJsonLd } from './lib/safeJsonLd';
import type { Metadata } from 'next';
import PreviewLanding from './preview/page';

export const metadata: Metadata = {
  title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
  description:
    'Colete feedback de clientes por link ou QR Code, analise padrões com IA e transforme a voz do cliente em prioridades de melhoria.',
  alternates: {
    canonical: 'https://filtraai.com/',
    languages: {
      'pt-BR': 'https://filtraai.com/',
      en: 'https://filtraai.com/en',
      es: 'https://filtraai.com/es',
      'x-default': 'https://filtraai.com/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/',
    title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    siteName: 'Filtra.AI',
    description:
      'Colete feedback por link ou QR Code, analise temas com IA e transforme a voz do cliente em ações de melhoria.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Filtra.AI — Gestão de avaliações Google' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    description:
      'Colete feedback de clientes, analise temas com IA e acompanhe oportunidades de melhoria. Teste 7 dias grátis, sem cartão.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  const homepageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://filtraai.com/#webpage',
    url: 'https://filtraai.com/',
    name: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    description:
      'Organize o feedback e as avaliações que sua empresa coleta por link ou QR Code, identifique padrões com IA e apoie a gestão da reputação online. Não monitora nem importa avaliações públicas do Google automaticamente.',
    isPartOf: { '@id': 'https://filtraai.com/#website' },
    about: { '@id': 'https://filtraai.com/#organization' },
    mainEntity: { '@id': 'https://filtraai.com/#software' },
    inLanguage: 'pt-BR',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />
      <PreviewLanding />
    </>
  );
}
