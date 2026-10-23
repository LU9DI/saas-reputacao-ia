import type { Metadata } from 'next';
import { SeoLanding } from '../../components/SeoLanding';
import { OG_IMAGE_META } from '../../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Programa de parceiros | Reputação e feedback',
  description:
    'Programa para consultorias, agências, profissionais e entidades que querem incluir gestão de reputação, avaliações e feedback em sua oferta.',
  alternates: {
    canonical: 'https://filtraai.com/parceiros',
    languages: {
      'pt-BR': 'https://filtraai.com/parceiros',
      en: 'https://filtraai.com/en/partners',
      es: 'https://filtraai.com/es/socios',
      'x-default': 'https://filtraai.com/parceiros',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/parceiros',
    title: 'Programa de parceiros Filtra.AI | Reputação e feedback',
    description:
      'Inclua gestão de reputação, avaliações e feedback na oferta da sua consultoria, agência ou serviço profissional.',
    siteName: 'Filtra.AI',
    images: [OG_IMAGE_META],
  },
};

export default function ParceirosPage() {
  return (
    <SeoLanding
      h1="Leve gestão de reputação para mais empresas"
      lead="Consultorias, agências, especialistas em SEO local e parceiros comerciais podem usar a Filtra.AI como uma camada operacional para feedback, avaliações e reputação."
      breadcrumbHref="/parceiros"
      contextLinks={[
        {
          href: '/agencias',
          title: 'Filtra.AI para agências',
          description: 'Estruture reputação como serviço recorrente para sua carteira.',
        },
        {
          href: '/gestao-de-reputacao-online',
          title: 'Gestão de reputação online',
          description: 'Entenda o ciclo completo de monitoramento, análise e ação.',
        },
        {
          href: '/analise-de-avaliacoes-com-ia',
          title: 'Análise de avaliações com IA',
          description: 'Transforme grandes volumes de comentários em temas e prioridades.',
        },
        {
          href: '/auditoria-gratuita',
          title: 'Auditoria gratuita',
          description: 'Comece a conversa comercial com um diagnóstico prático.',
        },
        {
          href: '/filtra-ai',
          title: 'Conheça a Filtra.AI',
          description: 'Veja a plataforma e o fluxo de reputação com IA.',
        },
      ]}
      sections={[
        {
          heading: 'Para quem é o programa',
          body: 'Agências de marketing, SEO local, consultorias, profissionais especializados e entidades com acesso a empresas podem incorporar reputação e feedback à própria oferta sem reconstruir a operação do zero.',
        },
        {
          heading: 'O que o parceiro entrega',
          body: 'O parceiro pode usar a Filtra.AI para organizar feedback, acompanhar avaliações, identificar temas recorrentes, preparar análises e transformar sinais de clientes em recomendações para cada conta.',
        },
        {
          heading: 'Como abrir uma nova oportunidade comercial',
          body: 'Comece pela realidade do cliente: reputação atual, volume de avaliações, principais temas de experiência e pontos que já aparecem no atendimento. Uma auditoria objetiva ajuda a transformar o problema em uma conversa comercial concreta.',
        },
        {
          heading: 'Integração com SEO local',
          body: 'Para carteiras de negócios locais, reputação pode entrar no mesmo pacote de presença local. A agência acompanha o que os clientes dizem, relaciona temas à experiência e cria uma rotina de acompanhamento que complementa SEO, conteúdo e aquisição.',
        },
        {
          heading: 'Comece com um piloto',
          body: 'Escolha um cliente com volume real de avaliações e rode uma primeira rotina de feedback, análise e acompanhamento. O piloto deve produzir evidência suficiente para definir o processo, os responsáveis e o formato do relatório.',
        },
        {
          heading: 'Escala para a carteira',
          body: 'Depois do primeiro caso, padronize onboarding, revisão dos sinais, relatório e próximos passos. A escala vem da repetição do processo, não de páginas idênticas ou relatórios genéricos.',
        },
      ]}
    />
  );
}
