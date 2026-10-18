import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos e preços',
  description:
    'Conheça os planos da Filtra.AI para gestão de reputação, avaliações, feedback de clientes e inteligência de crescimento.',
  alternates: { canonical: 'https://filtraai.com/planos' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Planos | Filtra.AI',
    description:
      'Conheça os planos da Filtra.AI para gestão de reputação e análise de avaliações com IA.',
    url: 'https://filtraai.com/planos',
    siteName: 'Filtra.AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planos e preços da Filtra.AI',
    description:
      'Compare os planos da Filtra.AI para gestão de reputação, avaliações e análise com IA.',
    images: ['https://filtraai.com/og-image.svg'],
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
