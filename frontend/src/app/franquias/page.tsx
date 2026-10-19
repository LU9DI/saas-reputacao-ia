import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de reputação para franquias e redes',
  description:
    'Gestão de reputação para franquias e redes: compare avaliações por unidade, encontre padrões e transforme feedback em ações operacionais.',
  alternates: {
    canonical: 'https://filtraai.com/franquias',
    languages: {
      'pt-BR': 'https://filtraai.com/franquias',
      en: 'https://filtraai.com/en/franchises',
      es: 'https://filtraai.com/es/franquicias',
      zh: 'https://filtraai.com/zh/franchises',
      'x-default': 'https://filtraai.com/franquias',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/franquias',
    title: 'Gestão de reputação para franquias e redes | Filtra.AI',
    description: 'Organize avaliações e feedback de várias unidades, identifique padrões e acompanhe reputação local com o Filtra.AI para franquias e redes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestão de reputação para franquias e redes | Filtra.AI',
    description: 'Organize avaliações de várias unidades e acompanhe padrões de reputação com o Filtra.AI.',
  },
};

export default function FranquiasPage() {
  return (
    <SeoLanding
      h1="Franquias e redes: visão da reputação por unidade"
      lead="Cada unidade influencia a percepção da marca. O Filtra.AI ajuda redes e franquias a organizar avaliações e feedback, identificar padrões e enxergar onde a experiência precisa de atenção."
      breadcrumbHref="/franquias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Organize monitoramento, respostas e evolução da reputação.' },
        { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Transforme opiniões em informação operacional para a rede.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões recorrentes entre unidades e avaliações.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial de uma unidade ou da rede.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e avaliações', description: 'Entenda como avaliações entram na operação de SEO local.' },
      ]}
      sections={[
        {
          heading: 'Visão por unidade',
          body: 'Organize os sinais de reputação de cada endereço para separar problemas locais de padrões que aparecem em várias unidades.',
        },
        {
          heading: 'Compare padrões de experiência',
          body: 'Observe temas recorrentes em atendimento, tempo de espera, qualidade, comunicação e outros pontos que afetam a percepção do cliente.',
        },
        {
          heading: 'Apoie os franqueados',
          body: 'Transforme feedback em informação operacional que pode ser compartilhada com a unidade responsável, mantendo a decisão e a resposta com as equipes.',
        },
        {
          heading: 'Escala sem perder contexto',
          body: 'Uma estrutura centralizada facilita acompanhar várias unidades sem tratar todas como se tivessem exatamente os mesmos problemas.',
        },
        {
          heading: 'Teste uma unidade primeiro',
          body: 'Ative o trial de 7 dias em uma unidade piloto, valide o fluxo e depois avalie a expansão para a rede.',
        },
        {
          heading: 'O que acompanhar por unidade',
          body: 'Compare volume de avaliações, nota média, temas recorrentes, avaliações sem resposta e tempo de resposta. O objetivo é identificar desvios entre unidades e priorizar a operação que precisa de atenção, sem reduzir a análise a uma única nota.',
        },
        {
          heading: 'Como transformar comparação em rotina',
          body: 'Defina uma cadência semanal para revisar sinais críticos e uma revisão mensal para comparar tendências. Registre o responsável por cada ação e o período de acompanhamento para saber se a mudança realmente alterou o padrão de feedback.',
        },
        {
          heading: 'Reputação centralizada, contexto local',
          body: 'Uma rede precisa de visão consolidada para encontrar padrões e de visão por endereço para corrigir causas locais. A operação deve preservar o contexto de cada unidade em vez de aplicar a mesma resposta a problemas diferentes.',
        },
        {
          heading: 'Como priorizar unidades',
          body: 'Nem toda unidade precisa da mesma atenção. Priorize pela combinação de volume de sinais, gravidade dos temas, recorrência e tendência. Uma unidade com poucas avaliações e um problema grave pode exigir mais atenção do que outra com nota menor, mas sem temas críticos. Registre a prioridade e o responsável para não transformar a comparação em uma lista sem ação.',
        },
        {
          heading: 'Governança entre central e franqueado',
          body: 'Defina quem responde, quem corrige a operação e quem acompanha o resultado. A central deve cuidar da diretriz, da comparação e dos temas sistêmicos; a unidade local precisa ter autonomia para responder com contexto e agir na causa. Um fluxo de escalonamento claro evita respostas genéricas e atrasos em casos sensíveis.',
        },
        {
          heading: 'Erros comuns ao comparar unidades',
          body: 'Comparar unidades de portes diferentes, ignorar sazonalidade, olhar apenas a nota média e tratar um caso isolado como padrão. Também é comum centralizar todas as respostas e perder o contexto local. A comparação deve considerar o tipo de operação, o volume de clientes e o período analisado.',
        },
      ]}
      faq={[
        {
          question: 'Como comparar a reputação entre unidades de uma franquia?',
          answer: 'Compare volume de avaliações, nota média, temas recorrentes, avaliações sem resposta e tempo de resposta. Evite ranquear unidades apenas pela nota: uma unidade com poucas avaliações pode ter um resultado instável, e uma unidade grande pode ter mais exposição. O ideal é olhar indicadores absolutos e relativos, sempre com o contexto de operação de cada endereço.',
        },
        {
          question: 'Quem deve responder às avaliações: a central ou o franqueado?',
          answer: 'A decisão pode variar. O importante é definir um responsável por unidade, um padrão mínimo de resposta e um fluxo de escalonamento para casos sensíveis. A central pode cuidar da diretriz e dos temas sistêmicos; o franqueado tende a ter mais contexto para responder sobre a operação local.',
        },
        {
          question: 'Como lidar com uma avaliação negativa em uma unidade?',
          answer: 'Responda com transparência, sem discutir detalhes pessoais em público. Registre o tema, acione o responsável local e acompanhe a correção. Se o caso envolver dados do cliente, migre para um canal privado. O objetivo é resolver a causa e demonstrar que a rede leva o feedback a sério.',
        },
        {
          question: 'Como saber se a reputação da rede melhorou?',
          answer: 'Acompanhe a evolução dos temas recorrentes, a proporção de avaliações respondidas, o tempo de resposta e a recorrência dos problemas. A nota média ajuda, mas não mostra se a causa foi corrigida. Compare períodos e unidades semelhantes e registre as ações tomadas.',
        },
        {
          question: 'O que medir em cada unidade além da nota média?',
          answer: 'Volume e recência das avaliações, temas de experiência, avaliações sem resposta, tempo de resposta, evolução dos temas e ações concluídas. Também vale comparar a percepção da unidade com a promessa da marca.',
        },
        {
          question: 'Quantas unidades posso acompanhar?',
          answer: 'O Filtra.AI foi pensado para redes com múltiplas unidades. Comece com uma unidade piloto para validar o fluxo, os temas e os responsáveis; depois expanda para as demais, mantendo a visão consolidada e o contexto local.',
        },
      ]}
    />
  );
}
