import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel do cliente — Preview',
  description: 'Demonstração visual do painel de reputação da Filtra.AI.',
  robots: { index: false, follow: false },
};

export default function PreviewPanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
