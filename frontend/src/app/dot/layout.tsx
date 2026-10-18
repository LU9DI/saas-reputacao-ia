import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filtra Dot — acesso privado',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
