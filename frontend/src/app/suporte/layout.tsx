import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suporte | Filtra.AI',
  description: 'Suporte da Filtra.AI.',
  robots: { index: false, follow: false },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
