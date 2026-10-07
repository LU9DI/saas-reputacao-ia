import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos da Filtra.AI',
  description:
    'Conheça os planos da Filtra.AI para gestão de reputação, avaliações, feedback de clientes e inteligência de crescimento.',
  alternates: { canonical: 'https://filtraai.com/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Planos | Filtra.AI',
    description:
      'Conheça os planos da Filtra.AI para gestão de reputação e análise de avaliações com IA.',
    url: 'https://filtraai.com/',
    siteName: 'Filtra.AI',
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
