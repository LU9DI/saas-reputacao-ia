import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Reputação para agências de SEO local | Filtra.AI',
  description:
    'Gestão de reputação, avaliações Google e feedback para agências de SEO local. Estruture uma oferta recorrente e acompanhe clientes com a Filtra.AI.'
  alternates: {
    canonical: 'https://filtraai.com/agencias',
    languages: {
      'pt-BR': 'https://filtraai.com/agencias',
      en: 'https://filtraai.com/en/agencies',
      es: 'https://filtraai.com/es/agencias',
      zh: 'https://filtraai.com/zh/agencies',
      'x-default': 'https://filtraai.com/agencias',
    },
  },
};

export default function AgenciasPage() {
  return (
    <SeoLanding
      h1="Gestão de reputação para agências de SEO local"
      lead="Agências de SEO local e marketing digital podem ampliar a entrega ao cliente conectando Google, avaliações, feedback e reputação em uma operação recorrente. O Filtra.AI organiza essa camada para que a agência acompanhe sinais, encontre padrões e transforme feedback em ações."
      breadcrumbHref="/agencias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture a operação de reputação que sua agência entrega aos clientes.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Conecte avaliações, presença local e acompanhamento de feedback.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Transforme reviews em temas, padrões e prioridades.' },
        { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação', description: 'Acompanhe mudanças e sinais relevantes por cliente.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Use um diagnóstico inicial para abrir conversas comerciais.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local', description: 'Veja o que incluir em uma oferta recorrente de SEO local, avaliações e reputação.' },
        { href: '/filtra-ai', title: 'Conheça a Filtra.AI', description: 'Plataforma de reputação, avaliações e feedback com IA.' },
      ]}
      sections={[
        {
          heading: 'Por que uma agência de SEO local deve incluir reputação?',
          body: 'A presença local não termina no site ou no Perfil da Empresa no Google. Avaliações, feedback e percepção dos clientes fazem parte da experiência que o consumidor encontra antes de escolher uma empresa. Ao incorporar reputação ao serviço, a agência amplia o escopo da estratégia local sem transformar a operação em tarefas isoladas.'
        },
        {
          heading: 'Agência de SEO local: como transformar reputação em serviço recorrente',
          body: 'Uma oferta recorrente pode combinar diagnóstico, acompanhamento de avaliações, análise de temas, identificação de problemas e relatórios. O cliente passa a enxergar uma rotina contínua de melhoria, enquanto a agência cria um processo que pode ser repetido entre contas sem perder o contexto de cada negócio.'
        },
        {
          heading: 'SEO local, Google Maps e avaliações',
          body: 'Para negócios locais, descoberta no Google, presença no Maps e percepção do cliente fazem parte do mesmo ciclo. A agência pode usar o Filtra.AI como camada operacional para acompanhar o que acontece depois do atendimento e levar os sinais mais relevantes de volta para a estratégia de SEO local.'
        },
        {
          heading: 'Como vender gestão de reputação para o cliente',
          body: 'Em vez de vender apenas “mais avaliações”, apresente a solução como uma operação: coletar feedback autêntico, acompanhar avaliações, identificar padrões, apoiar respostas e mostrar evolução. Essa abordagem conecta reputação à experiência do cliente e dá ao serviço entregáveis que podem ser acompanhados mês a mês.'
        },
        {
          heading: 'Relatórios que o cliente entende',
          body: 'Além de tráfego e posições, um relatório de SEO local pode mostrar volume e recência de avaliações, temas recorrentes, pontos de atenção, mudanças na percepção e prioridades para o próximo ciclo. O valor está em conectar dados a decisões, não em acumular métricas.'
        },
        {
          heading: 'Um piloto por cliente antes de escalar',
          body: 'Comece com um restaurante, clínica, hotel ou outra operação da carteira. Configure o fluxo, acompanhe a entrada de feedback e use uma primeira leitura de temas para demonstrar valor. Depois, padronize onboarding, análise e relatórios para expandir a oferta para outras contas.'
        },
        {
          heading: 'Escala para carteiras maiores',
          body: 'Com vários clientes, o ganho vem da padronização: mesma lógica de onboarding, mesmo formato de análise e uma rotina clara para cada conta. A agência preserva o contexto de cada negócio, mas reduz o trabalho manual repetitivo e consegue priorizar exceções.'
        },
        {
          heading: 'O papel da IA na entrega',
          body: 'A IA pode classificar comentários, encontrar recorrências e acelerar a produção de análises. A agência continua responsável pelo contexto estratégico, pela comunicação com o cliente e pela decisão sobre quais sinais merecem intervenção.'
        },
      ]}
    />
  );
}
