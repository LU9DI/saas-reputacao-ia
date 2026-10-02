import type { Metadata } from 'next';
import PreviewLanding from './preview/page';

export const metadata: Metadata = {
  title: 'Gestão de reputação online com IA | Filtra.AI',
  description:
    'Analise avaliações, feedback e reputação online com IA. Encontre padrões e transforme a voz do cliente em ações de crescimento.',
  alternates: { canonical: 'https://filtraai.com/' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/',
    title: 'Gestão de reputação online com IA | Filtra.AI',
    description:
      'Analise avaliações, feedback e reputação online com IA e transforme a voz do cliente em ações de crescimento.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de reputação online com IA | Filtra.AI',
    description:
      'Analise avaliações e feedback com IA e transforme sinais de clientes em ações de crescimento.',
  },
};

export default function Home() {
  return <PreviewLanding />;
}
