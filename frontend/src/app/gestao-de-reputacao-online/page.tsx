import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Software de gestão de reputação online',
    description: 'Software para monitorar avaliações Google, analisar feedback com IA e transformar temas recorrentes em ações de melhoria.',
    alternates: {
      canonical: 'https://filtraai.com/gestao-de-reputacao-online',
      languages: {
        'pt-BR': 'https://filtraai.com/gestao-de-reputacao-online',
        en: 'https://filtraai.com/en/online-reputation-management',
        es: 'https://filtraai.com/es/gestion-reputacion-online',
        'x-default': 'https://filtraai.com/gestao-de-reputacao-online',
      },
    },
    openGraph: {
      type: 'website',
      url: 'https://filtraai.com/gestao-de-reputacao-online',
      siteName: 'Filtra.AI',
      locale: 'pt_BR',
      title: 'Software de gestão de reputação online',
      description: 'Software para monitorar avaliações, analisar feedback e organizar a gestão da reputação online com IA.',
      images: [OG_IMAGE_META],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Software de gestão de reputação online',
      description: 'Software para monitorar avaliações, analisar feedback e organizar a gestão da reputação online com IA.',
      images: [OG_IMAGE_META.url],
    },
  };
}

const faq = [
  {
    question: 'O que é gestão de reputação online?',
    answer: 'É o processo contínuo de acompanhar avaliações, feedback e sinais da experiência, identificar padrões, agir sobre problemas e medir a evolução da percepção pública.',
  },
  {
    question: 'Como gerir a reputação de uma empresa?',
    answer: 'Monitore avaliações e feedback, agrupe temas recorrentes, responda com contexto, encaminhe problemas para a operação e acompanhe se os temas críticos diminuem ao longo do tempo.',
  },
  {
    question: 'O que uma ferramenta de gestão de reputação online deve acompanhar?',
    answer: 'Volume de avaliações, distribuição de notas, temas recorrentes, respostas, evolução por período e diferenças entre unidades ou serviços quando aplicável.',
  },
  {
    question: 'Como a IA ajuda na gestão de reputação?',
    answer: 'A IA pode classificar comentários, agrupar temas, resumir padrões e acelerar a triagem de grandes volumes de feedback, com revisão humana para situações que exigem contexto.',
  },
];

export default function Page() {
  return (
    <SeoLanding
      h1="Software de gestão de reputação online para empresas"
      lead="Centralize avaliações e feedback, identifique padrões com IA e organize ações para melhorar a experiência do cliente. A Filtra.AI ajuda sua equipe a transformar sinais de reputação em prioridades verificáveis."
      breadcrumbHref="/gestao-de-reputacao-online"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI — plataforma de reputação', description: 'Centralize avaliações Google, feedback, análise por IA e rotina de reputação.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Organize avaliações e os sinais que aparecem no Google Maps.' },
        { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe mudanças, temas recorrentes e prioridades.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre temas, padrões, riscos e oportunidades em escala.' },
        { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Use a voz do cliente como dado para decisões de crescimento.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece com um diagnóstico da presença e dos principais sinais de reputação.' },
        { href: '/blog/gestao-reputacao-online-guia', title: 'Guia de reputação online', description: 'Aprofunde conceitos, indicadores e rotinas para gerir a reputação.' },
        { href: '/agencias', title: 'Gestão de reputação para agências de SEO local', description: 'Leve a operação de reputação para uma carteira de clientes.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local', description: 'Conecte reputação, avaliações e descoberta local.' },
      ]}
      sections={[
        {
          heading: 'O que é gestão de reputação online?',
          body: 'É uma disciplina operacional que conecta percepção pública e melhoria interna. Em vez de olhar apenas a nota média, a empresa acompanha avaliações novas, temas recorrentes, distribuição de notas, respostas, diferenças entre unidades e evolução ao longo do tempo.'
        },
        {
          heading: 'O que realmente precisa ser monitorado',
          body: 'Volume de avaliações, mudanças bruscas na nota, recorrência de reclamações, elogios que representam diferenciais, tempo de resposta, temas ligados a atendimento, prazo, preço, produto, ambiente e comunicação. Em redes, compare unidades com contexto para não confundir realidades diferentes.'
        },
        {
          heading: 'De avaliação isolada para sinal de gestão',
          body: 'Uma crítica pode ser pontual. Muitas críticas semelhantes em pouco tempo indicam um padrão mais útil para a gestão. A análise estruturada permite separar ruído, recorrência e mudança de comportamento, criando uma fila de prioridades em vez de uma caixa de comentários.'
        },
        {
          heading: 'Reputação e aquisição de clientes',
          body: 'Antes de comprar, potenciais clientes pesquisam a empresa e encontram avaliações, respostas, presença local e sinais de confiança. Por isso, reputação não é apenas comunicação: ela participa do processo de decisão. Conteúdo útil, experiência consistente e avaliações acompanhadas formam um mesmo ciclo.'
        },
        {
          heading: 'Como transformar reputação em melhoria operacional',
          body: 'Registre os temas mais frequentes, associe cada tema a uma área responsável, defina uma ação verificável e acompanhe as avaliações seguintes. Quando o mesmo problema deixa de aparecer, existe um sinal de melhoria que pode ser comparado por período, unidade ou serviço.'
        },
        {
          heading: 'Gestão de reputação para empresas com várias unidades',
          body: 'Hotéis, restaurantes, clínicas, franquias e operações multilocais precisam de uma visão consolidada da marca e também de detalhe por unidade. A gestão correta mantém os dois níveis: visão executiva para priorização e evidência local para a equipe que pode agir.'
        },
        {
          heading: 'Serviços de gestão de reputação online: o que avaliar',
          body: 'Ao contratar ou estruturar o serviço, verifique o que será monitorado, como os temas são classificados, qual a cadência de respostas e de leitura do período e como o resultado será medido. Um bom serviço deixa claro o que a empresa faz internamente e o que o fornecedor entrega — sem prometer posição garantida no Google ou remoção de avaliações.',
        },
        {
          heading: 'Por que usar IA nesse processo',
          body: 'Quando o volume cresce, ler tudo manualmente fica caro e inconsistente. IA pode agrupar comentários, encontrar padrões e resumir sinais para acelerar a triagem. O julgamento final continua com a equipe, especialmente quando existe contexto operacional ou ironia no comentário.'
        },
        {
          heading: 'Gestão de reputação online e SEO local',
          body: 'Para empresas locais, reputação e presença no Google fazem parte da mesma jornada de descoberta. Acompanhe avaliações, temas recorrentes e percepção por unidade junto da estratégia de presença local, conteúdo e Google Maps.',
        },
        {
          heading: 'O que medir toda semana',
          body: 'Acompanhe nota e distribuição das avaliações, volume novo, temas que subiram ou caíram, problemas recorrentes, elogios mais frequentes e evolução por unidade. O objetivo não é produzir outro relatório: é descobrir o que merece ação agora e verificar se a ação funcionou.'
        },
      ]}
      faq={faq}
    />
  );
}
