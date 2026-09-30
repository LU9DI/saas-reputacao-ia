import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de avaliações e reputação para hotéis | Filtra.AI',
  description:
    'Organize avaliações de hóspedes, identifique padrões de experiência e transforme feedback em ações para melhorar a reputação do hotel.',
  alternates: { canonical: '/hoteis' },
};

export default function HoteisPage() {
  return (
    <SeoLanding
      h1="Hotéis: transforme avaliações de hóspedes em melhoria"
      lead="Avaliações revelam muito mais do que uma nota. O Filtra.AI organiza feedback de hóspedes para identificar padrões de experiência, pontos de atrito e oportunidades de melhoria."
      breadcrumbHref="/hoteis"
      contextLinks={[
        { href: '/turismo', title: 'Reputação para turismo e hotelaria', description: 'Veja como organizar feedback ao longo da jornada do visitante.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture o acompanhamento de avaliações e percepção pública.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre temas recorrentes sem depender de leitura manual de cada comentário.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece identificando padrões e oportunidades na reputação do hotel.' },
      ]}
      sections={[
        {
          heading: 'O que os hóspedes estão dizendo',
          body: 'Avaliações podem revelar recorrências sobre limpeza, quartos, atendimento, café da manhã, localização, ruído, manutenção, comunicação e outros pontos da estadia. O objetivo é encontrar padrões, não tratar um comentário isolado como diagnóstico.',
        },
        {
          heading: 'Reputação e experiência caminham juntas',
          body: 'A reputação pública é consequência de experiências reais. Ao organizar feedback, a equipe consegue levar temas recorrentes para as áreas responsáveis e também reconhecer práticas que os hóspedes valorizam.',
        },
        {
          heading: 'Da recepção à gestão',
          body: 'Feedback estruturado pode apoiar reuniões de operação, atendimento e qualidade. Em vez de depender de planilhas ou comentários espalhados, a equipe passa a trabalhar com temas mais claros e comparáveis.',
        },
        {
          heading: 'Hotéis, pousadas e redes',
          body: 'A lógica pode ser aplicada a diferentes operações de hospedagem. Em estruturas com várias unidades, a análise por operação ajuda a distinguir problemas locais de padrões que merecem atenção mais ampla.',
        },
        {
          heading: 'Comece com um piloto de 7 dias',
          body: 'Teste o fluxo em uma unidade ou operação, observe os feedbacks recebidos e identifique os temas mais recorrentes. Depois, use o aprendizado para decidir como ampliar o processo.',
        },
      ]}
    />
  );
}
