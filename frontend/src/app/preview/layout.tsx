import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filtra.AI — Gestão de reputação com IA | Preview',
  description:
    'Conheça o novo posicionamento do Filtra.AI: gestão de avaliações, reputação, feedbacks, relatórios e inteligência artificial em um único painel.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/preview' },
  openGraph: {
    type: 'website',
    title: 'Filtra.AI — Gestão de reputação com IA',
    description:
      'Gestão de avaliações, reputação, feedbacks e inteligência artificial em um único painel.',
    siteName: 'Filtra.AI',
    url: '/preview',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI — Gestão de reputação com IA',
    description: 'Gestão de avaliações, reputação, feedbacks e IA em um único painel.',
  },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
