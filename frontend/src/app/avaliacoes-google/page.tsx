import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Gestão de avaliações Google: monitore, analise e responda',
  description: 'Organize avaliações Google, entenda os temas dos clientes e conecte feedback à operação. Transforme reviews em decisões com análise, contexto e acompanhamento.',
  alternates: {
    canonical: 'https://filtraai.com/avaliacoes-google',
    languages: {
      'pt-BR': 'https://filtraai.com/avaliacoes-google',
      en: 'https://filtraai.com/en/google-reviews',
      es: 'https://filtraai.com/es/resenas-google',
      'x-default': 'https://filtraai.com/avaliacoes-google',
    },
  },
  openGraph: {
    title: 'Gestão de avaliações Google: monitore, analise e responda',
    description: 'Organize avaliações Google, entenda os temas dos clientes e conecte feedback à operação.',
    url: 'https://filtraai.com/avaliacoes-google',
    siteName: 'Filtra.AI',
    type: 'website',
    images: [OG_IMAGE_META],
  },
};

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de avaliações Google com IA"
      lead="Transforme avaliações Google e feedback de clientes em uma rotina de gestão: acompanhe o que mudou, identifique padrões e conecte os comentários às decisões da equipe."
      breadcrumbHref="/avaliacoes-google"
      contextLinks={[
        { href: '/monitoramento-reputacao-online', title: 'Monitoramento de reputação online', description: 'Acompanhe mudanças e temas recorrentes depois das avaliações.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Conecte avaliações, feedback, monitoramento e melhoria contínua.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Agrupe temas e encontre padrões em escala.' },
        { href: '/reputacao-google', title: 'Reputação no Google', description: 'Entenda o papel das avaliações na confiança e presença local.' },
        { href: '/como-melhorar-avaliacoes-google', title: 'Como melhorar avaliações Google', description: 'Melhore experiência, reduza fricção e construa uma rotina de coleta.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial da reputação e dos pontos de atenção.' },
        { href: '/filtra-ai', title: 'Conheça a Filtra.AI', description: 'Plataforma para gestão de reputação, avaliações e feedback com IA.' },
        { href: '/agencias', title: 'Gestão de reputação para agências de SEO local', description: 'Estruture avaliações e reputação como serviço para clientes.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'Pacotes de SEO local', description: 'Veja como avaliações e reputação entram em uma oferta de SEO local.' },
        { href: '/blog/velocity-reviews-google-maps-2026', title: 'Avaliações recentes no Google Maps', description: 'Entenda por que a cadência de novas avaliações importa para a percepção atual.' },
        { href: '/blog/como-responder-avaliacoes-negativas', title: 'Como responder avaliações negativas', description: 'Veja um processo para responder com contexto e corrigir a causa.' },
      ]}
      sections={[
        {
          heading: 'Como fazer gestão de avaliações Google na prática',
          body: 'Comece por uma linha de base: volume de avaliações, nota, recência, distribuição por nota e principais temas. Depois defina uma cadência para acompanhar novas avaliações, responder quando necessário e encaminhar problemas recorrentes para a equipe responsável. A Filtra.AI apoia a triagem e análise; a decisão continua com a empresa.'
        },
        {
          heading: 'Gestão de avaliações Google para empresas locais e redes',
          body: 'Em uma unidade, a prioridade costuma ser entender experiência e recorrência. Em redes e franquias, compare unidades com contexto, identifique exceções e mantenha uma visão consolidada da marca. Isso transforma reviews em uma rotina de gestão, não apenas em uma caixa de comentários.'
        },
        {
          heading: 'Como responder avaliações sem perder o foco operacional',
          body: 'Respostas públicas devem ser específicas e profissionais, mas responder não substitui corrigir a causa. Use os temas recorrentes para orientar atendimento, treinamento, comunicação ou processos e depois acompanhe se o problema volta a aparecer.'
        },
        {
        
          heading: 'Por que as avaliações Google importam?',
          body: 'Avaliações registram experiências reais e ajudam a explicar como o mercado percebe atendimento, prazo, produto, preço, ambiente e comunicação. A nota é um resumo; os comentários trazem o contexto que a operação precisa para melhorar.'
        },
        {
          heading: 'Avaliações Google e Google Maps',
          body: 'Para negócios locais, avaliação e presença no Google Maps fazem parte do mesmo ecossistema de descoberta. O objetivo não é apenas acumular estrelas: é construir uma experiência que produza feedback consistente e identificar rapidamente o que precisa mudar.'
        },
        {
          heading: 'Do feedback à avaliação pública',
          body: 'Uma jornada de avaliação eficiente reduz fricção no momento certo, com links diretos ou QR Code e uma comunicação clara. A coleta deve continuar sendo natural e nunca depender de condicionar benefício a uma nota positiva.'
        },
        {
          heading: 'Como analisar centenas de reviews',
          body: 'Quando há muitos comentários, procure recorrência em vez de ler apenas casos extremos. Agrupe temas como atendimento, tempo de espera, qualidade, preço, entrega, ambiente e comunicação; depois compare frequência, nota e evolução ao longo do tempo.'
        },
        {
          heading: 'Respostas e reputação',
          body: 'Responder é parte do relacionamento público, mas a melhor resposta é aquela apoiada por mudança real. Use o conteúdo das avaliações para entender a situação, responder com contexto quando necessário e levar problemas repetidos para o time responsável.'
        },
        {
          heading: 'Avaliações negativas como evidência',
          body: 'Uma crítica não precisa ser tratada como inimiga da marca. Ela pode revelar um gargalo específico ou uma expectativa mal alinhada. A gestão ganha valor quando transforma críticas recorrentes em hipóteses de melhoria e depois verifica se o padrão diminuiu.'
        },
        {
          heading: 'Como acompanhar a evolução',
          body: 'Observe volume, distribuição por nota, média, temas e diferença entre unidades ou serviços. O indicador importante não é uma fotografia isolada, mas a tendência: o que está melhorando, piorando ou permanecendo igual.'
        },
        {
          heading: 'Onde a IA ajuda',
          body: 'IA acelera classificação, agrupamento, resumo e busca de padrões. Ela funciona melhor como camada de triagem e inteligência sobre a operação, preservando revisão humana quando o contexto do cliente exige interpretação.'
        },
      ]}
    />
  );
}
