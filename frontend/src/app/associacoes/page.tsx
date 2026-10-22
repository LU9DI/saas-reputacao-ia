import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

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
      'x-default': 'https://filtraai.com/associacoes',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/associacoes',
    title: 'Gestão de reputação para associações e federações | Filtra.AI',
    description: 'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades em um fluxo centralizado com o Filtra.AI.',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de reputação para associações e federações | Filtra.AI',
    description: 'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades com o Filtra.AI.',
    images: [OG_IMAGE_META.url],
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
        { href: '/blog/feedback-cliente-para-reputacao', title: 'Feedback do cliente para reputação', description: 'Veja como fechar o ciclo entre opinião, ação e acompanhamento.' },
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
        {
          heading: 'Governança do feedback',
          body: 'Defina quem coleta, quem classifica, quem responde e quem acompanha cada ação. Em entidades com regionais ou programas diferentes, segmente os sinais por grupo para não misturar realidades. A governança precisa incluir acesso adequado aos dados e um registro das decisões.',
        },
        {
          heading: 'Transparência sem expor pessoas',
          body: 'Relatórios para a diretoria podem mostrar temas agregados, tendências e ações concluídas, sem transformar comentários individuais em vitrine. Quando o feedback envolver dados pessoais, restrinja o acesso e siga a política de privacidade da entidade. Transparência não exige exposição.',
        },
        {
          heading: 'Do piloto à rotina da entidade',
          body: 'Escolha um programa ou regional, estabeleça uma linha de base e rode o fluxo por algumas semanas. Revise a cadência, os responsáveis e o formato do relatório antes de expandir. A escala funciona melhor quando o processo já produz decisões claras no piloto.',
        },
      ]}
      faq={[
        {
          question: 'Como usar feedback de associados sem criar um ranking entre eles?',
          answer: 'Trabalhe com temas agregados e contexto, não com uma lista pública de notas. Compare grupos semelhantes, explique as diferenças e foque em ações de melhoria. Evite expor comentários individuais ou transformar a participação em competição.',
        },
        {
          question: 'A estrutura serve para federações com regionais?',
          answer: 'Sim, desde que a visão consolidada seja acompanhada do contexto de cada regional ou programa. Segmentar os sinais ajuda a distinguir problemas locais de padrões sistêmicos e a direcionar a ação para quem tem autonomia.',
        },
        {
          question: 'Preciso tratar dados pessoais no processo?',
          answer: 'Feedback pode conter dados pessoais. Defina a finalidade da coleta, quem terá acesso, por quanto tempo os registros serão mantidos e como a pessoa pode exercer seus direitos. A política deve seguir a legislação aplicável e ser revisada com a área responsável.',
        },
      ]}
    />
  );
}
