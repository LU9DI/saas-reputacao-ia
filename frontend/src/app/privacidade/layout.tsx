import type { Metadata } from 'next';
import { OG_IMAGE_META } from '../lib/socialMetadata';

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
    images: [OG_IMAGE_META],
  },
};

export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
