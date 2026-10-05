import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Filtra.AI para agências de marketing e SEO local',
  description:
    'Agregue gestão de reputação e reviews Google ao portfólio da agência. Onboarding rápido, trial 7 dias e narrativa clara de SEO local para seus clientes.',
  alternates: { canonical: '/agencias' },
};

export default function AgenciasPage() {
  return (
    <SeoLanding
      h1="Ofereça reputação operacional aos seus clientes"
      lead="Agências de SEO local e marketing digital já entregam Google Meu Negócio, anúncios e conteúdo. O Filtra.AI completa o stack: um canal de avaliação que alimenta reviews positivos e reduz surpresas no Maps."
      breadcrumbHref="/agencias"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture a operação de reputação que sua agência entrega aos clientes.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Transforme avaliações em temas, sinais e relatórios acionáveis.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e avaliações', description: 'Conecte reputação e estratégia de presença local.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Use um diagnóstico inicial para abrir conversas com novos clientes.' },
      ]}
      sections={[
        {
          heading: 'Por que isso vende',
          body: 'Clientes perguntam “como subir a nota no Google?”. Em vez de só pedir estrela no WhatsApp, você entrega um fluxo com QR, painel e relatório — serviço recorrente com valor percebido alto.',
        },
        {
          heading: 'Onboarding em uma reunião',
          body: 'Ative o trial, configure o link do Google Reviews do cliente, gere o QR e treine a equipe de balcão ou recepção. Em poucos minutos o canal está no ar.',
        },
        {
          heading: 'Narrativa de SEO local',
          body: 'Reviews recentes, volume e resposta importam no Local Pack. Posicione o Filtra.AI como camada operacional da reputação — alinhada às metas de Maps da agência.',
        },
        {
          heading: 'Relatório para o cliente',
          body: 'O relatório inteligente ajuda a mostrar resultado em reuniões mensais: feedbacks, padrões e próximos passos, sem depender só de prints do Google.',
        },
        {
          heading: 'Comece com um cliente piloto',
          body: 'Use os 7 dias grátis em um restaurante ou clínica da carteira. Valide retenção e, em seguida, padronize a oferta no pacote de SEO local.',
        },
      ]}
    />
  );
}
