import type { Metadata } from 'next';
import { OG_IMAGE_META } from '../../lib/socialMetadata';

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
    images: [OG_IMAGE_META],
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
