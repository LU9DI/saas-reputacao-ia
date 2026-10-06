import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar senha | Filtra.AI',
  description: 'Recuperação de acesso à conta Filtra.AI.',
  robots: { index: false, follow: false },
};

export default function PasswordRecoveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
