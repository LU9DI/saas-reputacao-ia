import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de reputação para associações e federações',
  description:
    'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades em um fluxo centralizado com o Filtra.AI.',
  alternates: {
    canonical: 'https://filtraai.com/associacoes',
    languages: {
      'pt-BR': 'https://filtraai.com/associacoes',
      en: 'https://filtraai.com/en/associations',
      es: 'https://filtraai.com/es/asociaciones',
      zh: 'https://filtraai.com/zh/associations',
      'x-default': 'https://filtraai.com/associacoes',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/associacoes',
    title: 'Gestão de reputação para associações e federações | Filtra.AI',
    description: 'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades em um fluxo centralizado com o Filtra.AI.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de reputação para associações e federações | Filtra.AI',
    description: 'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades com o Filtra.AI.',
  },
};

export default function AssociacoesPage() {
  return (
    <SeoLanding
      h1="Associações e federações: transforme feedback em gestão"
      lead="Entidades setoriais recebem sinais de associados, empresas e públicos diferentes. O Filtra.AI ajuda a organizar feedback e identificar padrões para que a equipe saiba onde concentrar atenção."
      breadcrumbHref="/associacoes"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Organize monitoramento, respostas e evolução da reputação.' },
        { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Transforme opiniões de associados e públicos em informação útil.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões e temas recorrentes nas avaliações.' },
        { href: '/parceiros', title: 'Programa de parceiros', description: 'Veja como entidades e parceiros podem apoiar clientes em um piloto.' },
      ]}
      sections={[
        {
          heading: 'Escute associados e empresas',
          body: 'Centralize avaliações e feedbacks de diferentes pontos de contato em vez de depender de mensagens dispersas, planilhas ou relatos isolados.',
        },
        {
          heading: 'Encontre padrões por segmento',
          body: 'Agrupe temas recorrentes e acompanhe onde surgem mais atritos. Isso ajuda a transformar reclamações individuais em informação útil para a gestão da entidade.',
        },
        {
          heading: 'Relacione reputação e experiência',
          body: 'Use sinais públicos e feedback privado para entender a percepção sobre serviços, eventos, atendimento e iniciativas da organização.',
        },
        {
          heading: 'Útil para federações e redes',
          body: 'A estrutura pode apoiar entidades com várias unidades, regionais ou grupos associados que precisam de uma visão mais organizada da experiência.',
        },
        {
          heading: 'Teste por 7 dias',
          body: 'Comece com um fluxo ou grupo piloto, acompanhe os feedbacks recebidos e avalie como o processo pode ser ampliado.',
        },
      ]}
    />
  );
}
