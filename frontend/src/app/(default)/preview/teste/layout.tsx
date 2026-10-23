import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teste grátis por 7 dias',
  description: 'Crie sua conta Filtra.AI e teste a plataforma de gestão de reputação por 7 dias.',
  robots: { index: false, follow: false },
};

export default function PreviewTrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
