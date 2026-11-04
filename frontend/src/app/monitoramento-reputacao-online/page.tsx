import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Monitoramento de feedback e reputação online para empresas';
  const description = 'Acompanhe o feedback recebido por link ou QR Code, identifique temas recorrentes e organize prioridades de melhoria.';
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
      h1="Monitoramento de feedback e reputação online para empresas"
      lead="Acompanhe ao longo do tempo o feedback que os clientes enviam à empresa pelo link ou QR Code do Filtra.AI. A plataforma organiza notas e comentários recebidos para ajudar a identificar mudanças e prioridades; não monitora nem importa automaticamente avaliações públicas do Google."
      breadcrumbHref="/monitoramento-reputacao-online"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Coleta de feedback e análise com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Entenda a diferença entre reviews públicos e feedback privado.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua de melhoria.' },
        { href: '/metodologia', title: 'Metodologia', description: 'Veja a origem dos dados e os limites da análise.' },
      ]}
      sections={[
        { heading: 'O que o Filtra.AI acompanha', body: 'O acompanhamento da plataforma se baseia nos feedbacks enviados pelos clientes pelo link ou QR Code da empresa: notas de 1 a 5 e comentários opcionais. A equipe pode observar temas recorrentes e usar esses sinais para priorizar melhorias.' },
        { heading: 'O que não é monitorado automaticamente', body: 'O Filtra.AI não se conecta ao Perfil da Empresa no Google para buscar novas avaliações públicas, importar reviews ou acompanhar respostas. Para acompanhar avaliações publicadas no Google, use os recursos do próprio Google. A auditoria gratuita é separada e analisa o conteúdo que a empresa cola manualmente.' },
        { heading: 'Como transformar sinais em ação', body: 'Confirme se o tema aparece em mais de um feedback, identifique a etapa da experiência envolvida, encaminhe o ponto para o responsável e acompanhe os próximos ciclos de feedback para avaliar se houve mudança.' },
        { heading: 'Separe sinal isolado de recorrência', body: 'Um comentário isolado merece atenção, mas não prova sozinho um problema sistêmico. Considere quantidade, contexto e clareza dos relatos antes de priorizar uma mudança.' },
        { heading: 'Compare unidades com contexto', body: 'Empresas com várias unidades podem organizar feedback por local e observar diferenças, sem transformar realidades distintas em uma comparação enganosa.' },
        { heading: 'Crie uma rotina de revisão', body: 'Uma revisão periódica dos feedbacks recebidos ajuda a transformar comentários em decisões operacionais. Defina responsáveis e verifique se as ações adotadas melhoraram a experiência.' },
      ]}
      faq={[
        {
          question: 'O Filtra.AI monitora avaliações públicas do Google?',
          answer: 'Não. O Filtra.AI acompanha o feedback enviado à empresa por link ou QR Code. Ele não importa nem monitora automaticamente avaliações do Perfil da Empresa no Google.',
        },
        {
          question: 'Que dados posso acompanhar no Filtra.AI?',
          answer: 'Notas e comentários enviados pelos clientes pelo link ou QR Code, incluindo temas e sinais recorrentes organizados pela plataforma.',
        },
        {
          question: 'A auditoria gratuita monitora avaliações continuamente?',
          answer: 'Não. É um diagnóstico pontual do conteúdo que a própria empresa cola no formulário; não há busca automática em Google ou outros sites.',
        },
      ]}
    />
  );
}
