import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auditoria gratuita de avaliações e reputação',
  description:
    'Faça uma auditoria gratuita das avaliações da sua empresa. Identifique pontos fortes, riscos, temas recorrentes e ações a partir do feedback dos clientes.',
  alternates: { canonical: '/auditoria-gratuita' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Auditoria gratuita de avaliações | Filtra.AI',
    description:
      'Analise avaliações da sua empresa e descubra pontos fortes, riscos e oportunidades de melhoria.',
    url: '/auditoria-gratuita',
    siteName: 'Filtra.AI',
  },
};

export default function AuditoriaGratuitaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
