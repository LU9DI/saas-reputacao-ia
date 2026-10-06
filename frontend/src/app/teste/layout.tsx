import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teste grátis por 7 dias | Filtra.AI',
  description: 'Ative o teste da Filtra.AI.',
  robots: { index: false, follow: false },
};

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
