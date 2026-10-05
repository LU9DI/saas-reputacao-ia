import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Monitoramento de reputação online para empresas | Filtra.AI',
  description:
    'Monitore avaliações, feedback e sinais de reputação online em uma rotina organizada com análise por temas e prioridades.',
  alternates: {
    canonical: 'https://filtraai.com/monitoramento-reputacao-online',
    languages: {
      'pt-BR': 'https://filtraai.com/monitoramento-reputacao-online',
      en: 'https://filtraai.com/en/online-reputation-monitoring',
      es: 'https://filtraai.com/es/monitoreo-reputacion-online',
      zh: 'https://filtraai.com/zh/online-reputation-monitoring',
      'x-default': 'https://filtraai.com/monitoramento-reputacao-online',
    },
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Monitoramento de reputação online sem depender de planilhas"
      lead="Monitorar reputação é acompanhar mudanças, entender causas e agir. A Filtra.AI organiza avaliações e feedback para transformar sinais dispersos em prioridades."
      breadcrumbHref="/monitoramento-reputacao-online"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
      ]}
      sections={[
        { heading: 'O que monitorar', body: 'Acompanhe volume de avaliações, variações de nota, temas recorrentes, novos problemas e mudanças relevantes na percepção dos clientes.' },
        { heading: 'Separe ruído de mudança real', body: 'Um comentário isolado merece atenção, mas uma tendência persistente ou acelerada normalmente fornece um sinal mais forte para a gestão.' },
        { heading: 'Priorize o que pode virar ação', body: 'Classifique temas por frequência, impacto no negócio e capacidade da equipe responsável de agir sobre eles.' },
        { heading: 'Compare unidades com contexto', body: 'Empresas com várias unidades precisam enxergar diferenças locais sem transformar realidades distintas em uma comparação enganosa.' },
        { heading: 'Crie uma rotina semanal', body: 'Uma revisão recorrente transforma avaliações dispersas em inteligência operacional, facilita decisões e mostra se os problemas estão diminuindo.' },
      ]}
    />
  );
}
