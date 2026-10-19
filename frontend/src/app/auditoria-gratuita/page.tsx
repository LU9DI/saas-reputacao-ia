import type { Metadata } from 'next';
import { AuditoriaGratuitaClient } from './AuditoriaGratuitaClient';

export const metadata: Metadata = {
  title: 'Auditoria gratuita de avaliações e reputação online',
  description:
    'Faça uma auditoria gratuita das avaliações da sua empresa. Identifique pontos fortes, riscos e temas recorrentes e veja oportunidades de melhoria.',
  alternates: {
    canonical: 'https://filtraai.com/auditoria-gratuita',
    languages: {
      'pt-BR': 'https://filtraai.com/auditoria-gratuita',
      en: 'https://filtraai.com/en/free-review-audit',
      es: 'https://filtraai.com/es/auditoria-gratuita',
      'x-default': 'https://filtraai.com/auditoria-gratuita',
    },
  },
  openGraph: {
    title: 'Auditoria gratuita de avaliações e reputação online | Filtra.AI',
    description:
      'Analise avaliações da sua empresa e descubra padrões, riscos e oportunidades de melhoria com a Filtra.AI.',
    url: 'https://filtraai.com/auditoria-gratuita',
    type: 'website',
  },
};

export default function AuditoriaGratuitaPage() {
  return <AuditoriaGratuitaClient />;
}
