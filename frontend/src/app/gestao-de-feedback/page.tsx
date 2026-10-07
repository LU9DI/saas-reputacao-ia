import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Gestão de feedback de clientes: método e ferramentas | Filtra.AI',
  description:
    'Como estruturar coleta, análise e acompanhamento de feedback de clientes para transformar opiniões em melhoria operacional.',
  alternates: {
    canonical: 'https://filtraai.com/gestao-de-feedback',
    languages: {
      'pt-BR': 'https://filtraai.com/gestao-de-feedback',
      en: 'https://filtraai.com/en/customer-feedback-management',
      es: 'https://filtraai.com/es/gestion-feedback-clientes',
      zh: 'https://filtraai.com/zh/customer-feedback-management',
      'x-default': 'https://filtraai.com/gestao-de-feedback',
    },
  },\n  };\n}\n\nexport default function Page() {
  return (
    <SeoLanding
      h1="Gestão de feedback de clientes: da opinião à ação"
      lead="Feedback só cria valor quando chega à pessoa certa e vira uma decisão. Estruture coleta, análise e acompanhamento em um fluxo contínuo."
      breadcrumbHref="/gestao-de-feedback"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
      ]}
      sections={[
        { heading: 'Colete feedback perto da experiência', body: 'Quanto mais próximo o pedido estiver do momento vivido pelo cliente, mais ricos tendem a ser os detalhes úteis para melhoria.' },
        { heading: 'Organize por tema e prioridade', body: 'Comentários precisam de contexto, tema, urgência e responsável para não desaparecerem em uma caixa de entrada genérica.' },
        { heading: 'Separe sinais públicos e privados', body: 'Avaliações públicas afetam a percepção externa; feedback privado pode revelar problemas operacionais que exigem tratamento interno.' },
        { heading: 'Feche o ciclo', body: 'Registre a ação tomada e verifique se os comentários seguintes confirmam a mudança. Sem retorno, o processo de feedback fica incompleto.' },
        { heading: 'Aprenda com o histórico', body: 'Ao longo do tempo, temas recorrentes e problemas não resolvidos mostram onde a operação ainda precisa de atenção.' },
      ]}
    />
  );
}
