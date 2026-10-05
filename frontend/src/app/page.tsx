import type { Metadata } from 'next';
import PreviewLanding from './preview/page';

export const metadata: Metadata = {
  title: 'Filtra.AI | Gestão de reputação online com IA',
  description:
    'Analise avaliações, feedback e reputação online com IA. Encontre padrões e transforme a voz do cliente em ações de crescimento.',
  alternates: { canonical: 'https://filtraai.com/' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/',
    title: 'Filtra.AI | Gestão de reputação online com IA',
    siteName: 'Filtra.AI',
    description:
      'Analise avaliações, feedback e reputação online com IA e transforme a voz do cliente em ações de crescimento.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Filtra.AI — Gestão de avaliações Google' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI | Gestão de reputação online com IA',
    description:
      'Filtra.AI: gestão de reputação online, avaliações Google e feedback de clientes com inteligência artificial. Analise avaliações e feedback com IA e transforme sinais de clientes em ações de crescimento.',
    images: ['/og-image.svg'],
  },
};

export default function Home() {
  return <PreviewLanding />;
}
