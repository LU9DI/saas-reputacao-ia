import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoLanding } from '../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SEO local para agências: reputação | Filtra.AI',
    description: 'Gestão de reputação e avaliações Google para agências de SEO local. Estruture uma oferta recorrente e acompanhe clientes com a Filtra.AI.',
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
    openGraph: {
      type: 'website',
      url: 'https://filtraai.com/agencias',
      title: 'SEO local para agências: reputação | Filtra.AI',
      description: 'Gestão de reputação e avaliações Google para agências de SEO local. Estruture uma oferta recorrente e acompanhe clientes com a Filtra.AI.',
    },
  };
}

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
          body: <>Uma oferta recorrente pode combinar diagnóstico, acompanhamento de avaliações, análise de temas, identificação de problemas e relatórios. O cliente passa a enxergar uma rotina contínua de melhoria, enquanto a agência cria um processo que pode ser repetido entre contas sem perder o contexto de cada negócio. Para transformar essa lógica em uma oferta comercial, veja o guia sobre <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">pacotes de SEO local</Link>.</>
        },
        {
          heading: 'SEO local, Google Maps e avaliações',
          body: <>Para negócios locais, descoberta no Google, presença no Maps e percepção do cliente fazem parte do mesmo ciclo. A agência pode usar o Filtra.AI como camada operacional para acompanhar o que acontece depois do atendimento e levar os sinais mais relevantes de volta para a estratégia de SEO local. O aprofundamento sobre <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">SEO local, avaliações e Local Pack</Link> detalha como essas frentes se conectam.</>
        },
        {
          heading: 'Como vender gestão de reputação para o cliente',
          body: <>Em vez de vender apenas “mais avaliações”, apresente a solução como uma operação: coletar feedback autêntico, acompanhar avaliações, identificar padrões, apoiar respostas e mostrar evolução. Essa abordagem conecta reputação à experiência do cliente e dá ao serviço entregáveis que podem ser acompanhados mês a mês. Uma <Link href="/auditoria-gratuita" className="text-indigo-400 underline">auditoria inicial</Link> pode ajudar a transformar esses sinais em prioridades comerciais.</>
        },
        {
          heading: 'O que a Filtra.AI realmente coloca na operação da agência',
          body: <>A plataforma organiza feedback e avaliações para triagem e análise, com recursos de IA para classificar sinais, encontrar temas recorrentes e apoiar a produção de análises. O fluxo também pode facilitar convites não seletivos para avaliações genuínas e levar insatisfações para um canal de tratamento antes que a equipe decida a resposta. A agência continua responsável pela estratégia e pela decisão final. Veja <Link href="/como-funciona" className="text-indigo-400 underline">como a Filtra.AI funciona</Link>.</>
        },
        {
          heading: 'Relatórios que o cliente entende',
          body: 'Além de tráfego e posições, um relatório de SEO local pode mostrar volume e recência de avaliações, temas recorrentes, pontos de atenção, mudanças na percepção e prioridades para o próximo ciclo. O valor está em conectar dados a decisões, não em acumular métricas.'
        },
        {
          heading: 'Modelo de escopo para gestão de reputação em agências',
          body: <>Uma forma prática de transformar a gestão de reputação em serviço é separar o escopo em quatro entregas: diagnóstico inicial, rotina de acompanhamento, análise periódica e reunião ou relatório de decisão. O diagnóstico define a linha de base; o acompanhamento registra novas avaliações e feedback; a análise identifica temas e exceções; e o relatório mostra o que mudou e qual ação vem depois. Esse desenho evita vender uma promessa vaga de “melhorar a reputação” e facilita comparar o serviço entre clientes. Para estruturar preço, frequência e entregáveis, use também o guia de <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">pacotes de SEO local</Link>.</>
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
          heading: 'O que a agência faz, o que a plataforma faz e o que o cliente faz',
          body: <>Um escopo saudável separa responsabilidades. A agência define estratégia, interpreta os sinais, prioriza ações e conduz a comunicação com o cliente. A Filtra.AI organiza dados, apoia a triagem e acelera a análise conforme os recursos contratados. O cliente continua responsável por decisões operacionais, atendimento e mudanças dentro do próprio negócio. Essa divisão evita que a ferramenta seja apresentada como substituta da consultoria.</>
        },
        {
          heading: 'Como estruturar onboarding para cada conta',
          body: <>No início, registre unidades, links dos perfis, canais de feedback, volume e recência de avaliações, nota atual, temas já conhecidos e responsáveis. Depois, defina a cadência: o que será observado semanalmente, o que entra no relatório mensal e quais situações exigem encaminhamento imediato. O onboarding vira um ativo comercial quando o cliente consegue ver claramente o ponto de partida e a rotina que será executada.</>
        },
        {
          heading: 'Como demonstrar valor sem inventar ROI',
          body: <>Use uma linha de base e compare os mesmos indicadores ao longo do tempo. Mostre mudanças em volume e recência de avaliações, temas recorrentes, problemas encaminhados, respostas e ações implementadas. Se uma métrica não melhorar, registre isso e explique a próxima hipótese. A prova comercial fica mais forte quando é baseada no que realmente aconteceu na conta, e não em um case genérico.</>
        },
        {
          heading: 'Quando a operação está pronta para escalar',
          body: <>Escalar não significa apenas adicionar clientes. Antes, padronize o onboarding, defina um modelo de relatório, estabeleça critérios para priorizar exceções e documente quem aprova respostas e ações. A partir daí, a agência pode usar uma mesma estrutura operacional em diferentes contas, preservando as particularidades de cada negócio.</>
        },
        {
          heading: 'O papel da IA na entrega',
          body: 'A IA pode classificar comentários, encontrar recorrências e acelerar a produção de análises. No Filtra.AI, recursos automatizados de IA são usados para classificação, análise, sugestão de respostas ou geração de relatórios, conforme o plano. A agência continua responsável pelo contexto estratégico, pela comunicação com o cliente e pela decisão sobre quais sinais merecem intervenção.'
        },
        {
          heading: 'Pacotes de SEO local para agências: escopo que o cliente consegue comprar',
          body: <>Uma proposta comercial forte separa estratégia de execução. Defina unidades, frequência, avaliações, reputação, conteúdo local, relatórios e responsáveis. O objetivo é vender uma rotina mensurável, não uma promessa de posição. Para comparar escopo, preço e entregáveis, consulte <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">o guia de pacotes de SEO local</Link>.</>
        },
      ]}
    />
  );
}
