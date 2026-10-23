import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filtra Dot',
  robots: { index: false, follow: false },
};

export default function DotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
