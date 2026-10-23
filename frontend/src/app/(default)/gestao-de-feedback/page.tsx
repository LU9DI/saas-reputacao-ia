import type { Metadata } from 'next';
import { SeoLanding } from '../../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Gestão de feedback de clientes: método e ferramentas',
  description:
    'Como estruturar coleta, análise e acompanhamento de feedback de clientes para transformar opiniões em melhoria operacional.',
  alternates: {
    canonical: 'https://filtraai.com/gestao-de-feedback',
    languages: {
      'pt-BR': 'https://filtraai.com/gestao-de-feedback',
      en: 'https://filtraai.com/en/customer-feedback-management',
      es: 'https://filtraai.com/es/gestion-feedback-clientes',
      'x-default': 'https://filtraai.com/gestao-de-feedback',
    },
  },
  };
}

export default function Page() {
  return (
    <SeoLanding
      h1="Gestão de feedback de clientes: da opinião à ação"
      lead="Feedback só cria valor quando chega à pessoa certa e vira uma decisão. Estruture coleta, análise e acompanhamento em um fluxo contínuo."
      breadcrumbHref="/gestao-de-feedback"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
        { href: '/blog/feedback-cliente-para-reputacao', title: 'Feedback do cliente para reputação', description: 'Veja como fechar o ciclo entre opinião, ação e acompanhamento.' },
        { href: '/blog/review-1-estrela-primeiras-24-horas', title: 'Primeiras 24 horas de uma avaliação 1★', description: 'Use um checklist para investigar e responder sem improviso.' },
      ]}
      sections={[
        { heading: 'Colete feedback perto da experiência', body: 'Quanto mais próximo o pedido estiver do momento vivido pelo cliente, mais ricos tendem a ser os detalhes úteis para melhoria.' },
        { heading: 'Organize por tema e prioridade', body: 'Comentários precisam de contexto, tema, urgência e responsável para não desaparecerem em uma caixa de entrada genérica.' },
        { heading: 'Separe sinais públicos e privados', body: 'Avaliações públicas afetam a percepção externa; feedback privado pode revelar problemas operacionais que exigem tratamento interno.' },
        { heading: 'Feche o ciclo', body: 'Registre a ação tomada e verifique se os comentários seguintes confirmam a mudança. Sem retorno, o processo de feedback fica incompleto.' },
        { heading: 'Aprenda com o histórico', body: 'Ao longo do tempo, temas recorrentes e problemas não resolvidos mostram onde a operação ainda precisa de atenção.' },
        { heading: 'Um fluxo em cinco etapas', body: 'Capture o feedback em um ponto natural da jornada, classifique o tema, defina um responsável, execute uma ação verificável e acompanhe o retorno. O fluxo precisa ser simples o suficiente para acontecer toda semana, sem depender de uma pessoa heroica.' },
        { heading: 'O que medir além da satisfação', body: 'A nota de satisfação ajuda, mas não mostra o que fazer. Acompanhe volume de feedbacks, temas que mais aparecem, tempo de triagem, reincidência e ações concluídas. Combine sinais privados com avaliações públicas para enxergar a experiência completa.' },
        { heading: 'Erros que fazem o feedback desaparecer', body: 'Coletar sem dono, tratar todo comentário como urgência, responder sem registrar a causa e confundir um caso isolado com tendência são armadilhas comuns. Também é um erro prometer retorno ao cliente sem um processo que garanta o acompanhamento.' },
      ]}
      faq={[
        {
          question: 'Qual é a diferença entre feedback e avaliação pública?',
          answer: 'O feedback pode chegar por um canal privado e revelar detalhes operacionais. A avaliação pública aparece no Google ou em outra plataforma e afeta a percepção de quem pesquisa a empresa. Os dois devem ser lidos juntos, mas nem todo feedback precisa virar uma avaliação pública.',
        },
        {
          question: 'Qual prazo devo usar para responder um feedback?',
          answer: 'Não existe um prazo universal. Defina um acordo de nível de serviço por canal e por gravidade: casos sensíveis ou com risco para o cliente merecem atenção imediata; sugestões podem entrar na revisão semanal. O importante é ter um responsável e um prazo realista.',
        },
        {
          question: 'Como começar a estruturar a gestão de feedback?',
          answer: 'Escolha uma jornada ou unidade, defina onde o feedback será coletado, quem fará a triagem e como as ações serão registradas. Rode por algumas semanas, estabeleça uma linha de base e só depois amplie para outras áreas.',
        },
      ]}
    />
  );
}
