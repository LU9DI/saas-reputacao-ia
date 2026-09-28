import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de reputação para associações e federações | Filtra.AI',
  description:
    'Organize feedback, avaliações e sinais de reputação de associados, empresas e unidades em um fluxo centralizado com o Filtra.AI.',
  alternates: { canonical: '/associacoes' },
};

export default function AssociacoesPage() {
  return (
    <SeoLanding
      h1="Associações e federações: transforme feedback em gestão"
      lead="Entidades setoriais recebem sinais de associados, empresas e públicos diferentes. O Filtra.AI ajuda a organizar feedback e identificar padrões para que a equipe saiba onde concentrar atenção."
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
