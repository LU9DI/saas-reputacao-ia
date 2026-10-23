import type { Metadata } from 'next';
import PreviewLanding from './preview/page';

export const metadata: Metadata = {
  title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
  description:
    'Monitore avaliações Google, feedback e reputação da sua empresa com IA. Identifique padrões, melhore respostas e transforme a voz do cliente em crescimento.',
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
      'Analise avaliações Google, feedback e reputação online com IA e transforme a voz do cliente em ações de crescimento.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Filtra.AI — Gestão de avaliações Google' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    description:
      'Transforme avaliações e feedback em crescimento: análise de reputação online com IA. Teste 7 dias grátis, sem cartão.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return <PreviewLanding />;
}
