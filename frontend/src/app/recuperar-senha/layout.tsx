import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperação de senha | Filtra.AI',
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
