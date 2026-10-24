import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Monitoramento de reputação online para empresas';
  const description = 'Monitore avaliações, feedback e sinais de reputação online em uma rotina organizada com análise por temas e prioridades.';
  const url = 'https://filtraai.com/monitoramento-reputacao-online';

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': url,
        en: 'https://filtraai.com/en/online-reputation-monitoring',
        es: 'https://filtraai.com/es/monitoreo-reputacion-online',
        'x-default': url,
      },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Filtra.AI',
      locale: 'pt_BR',
      title,
      description,
      images: [OG_IMAGE_META],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE_META.url],
    },
  };
}

export default function Page() {
  return (
    <SeoLanding
      h1="Monitoramento de reputação online para empresas sem depender de planilhas"
      lead="Monitorar reputação é acompanhar mudanças, entender causas e agir. A Filtra.AI organiza avaliações e feedback para transformar sinais dispersos em prioridades."
      breadcrumbHref="/monitoramento-reputacao-online"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
        { href: '/agencias', title: 'Gestão de reputação para agências de SEO local', description: 'Transforme monitoramento em entrega recorrente para clientes.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local', description: 'Veja como monitoramento e reputação entram no pacote.' },
      ]}
      sections={[
        { heading: 'Como montar um monitoramento de reputação online', body: 'Defina primeiro quais fontes e sinais importam, depois estabeleça frequência, responsáveis e critérios de prioridade. Uma rotina útil registra mudanças, contexto e próxima ação em vez de apenas acumular alertas.' },
        { heading: 'Monitoramento de reputação para agências de SEO local', body: 'Para agências, o valor está em transformar monitoramento em uma entrega recorrente e comparável entre clientes. Padronize linha de base, temas, indicadores e relatório, mantendo espaço para exceções de cada negócio.' },
        { heading: 'O que fazer quando aparece um sinal crítico', body: 'Confirme se o sinal é isolado ou recorrente, identifique a unidade ou etapa da jornada envolvida, encaminhe para o responsável e acompanhe as avaliações seguintes. Evite tratar todo alerta como crise.' },
        { heading: 'O que monitorar', body: 'Acompanhe volume de avaliações, variações de nota, temas recorrentes, novos problemas e mudanças relevantes na percepção dos clientes.' },
        { heading: 'Separe ruído de mudança real', body: 'Um comentário isolado merece atenção, mas uma tendência persistente ou acelerada normalmente fornece um sinal mais forte para a gestão.' },
        { heading: 'Priorize o que pode virar ação', body: 'Classifique temas por frequência, impacto no negócio e capacidade da equipe responsável de agir sobre eles.' },
        { heading: 'Compare unidades com contexto', body: 'Empresas com várias unidades precisam enxergar diferenças locais sem transformar realidades distintas em uma comparação enganosa.' },
        { heading: 'Crie uma rotina semanal', body: 'Uma revisão recorrente transforma avaliações dispersas em inteligência operacional, facilita decisões e mostra se os problemas estão diminuindo.' },
      ]}
      faq={[
        {
          question: 'O que deve entrar no monitoramento da reputação online?',
          answer: 'Comece por novas avaliações, mudanças na distribuição das notas, temas recorrentes, reclamações críticas, respostas pendentes e diferenças entre unidades. Inclua apenas fontes que a equipe consegue acompanhar e transformar em ações.',
        },
        {
          question: 'Com que frequência devo monitorar a reputação da empresa?',
          answer: 'Operações com volume alto devem acompanhar alertas críticos com frequência e revisar tendências pelo menos semanalmente. Compare períodos mensais para entender a evolução, considerando sazonalidade e mudanças na operação.',
        },
        {
          question: 'Qual é a diferença entre monitoramento e gestão de reputação?',
          answer: 'Monitoramento identifica mudanças, comentários e sinais relevantes. Gestão de reputação usa esses sinais para responder, investigar causas, corrigir problemas e medir se as ações melhoraram a experiência dos clientes.',
        },
      ]}
    />
  );
}
