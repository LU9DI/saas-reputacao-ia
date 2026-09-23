import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filtra.AI — Preview do novo site',
  description: 'Preview privado do redesign da experiência do Filtra.AI.',
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
