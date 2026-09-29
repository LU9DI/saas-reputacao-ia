import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade da Filtra.AI e informações sobre tratamento de dados pessoais.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Política de Privacidade | Filtra.AI',
    description: 'Política de Privacidade da Filtra.AI.',
    url: '/privacidade',
    siteName: 'Filtra.AI',
  },
};

export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
