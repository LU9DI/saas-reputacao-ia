import type { Metadata } from 'next';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso e contrato de assinatura SaaS da Filtra.AI.',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title: 'Termos de Uso | Filtra.AI',
    description: 'Termos de Uso e contrato de assinatura SaaS da Filtra.AI.',
    url: '/termos',
    siteName: 'Filtra.AI',
    images: [OG_IMAGE_META],
  },
};

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
