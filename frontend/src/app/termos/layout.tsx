import type { Metadata } from 'next';

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
  },
};

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
