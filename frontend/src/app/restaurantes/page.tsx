import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Avaliações Google para restaurantes',
  description:
    'QR na mesa, pedido de feedback e convite para avaliações genuínas no Google. Organize comentários, identifique padrões e transforme a experiência do cliente em ações. Trial de 7 dias.',
  alternates: {
    canonical: 'https://filtraai.com/restaurantes',
    languages: {
      'pt-BR': 'https://filtraai.com/restaurantes',
      en: 'https://filtraai.com/en/restaurants',
      es: 'https://filtraai.com/es/restaurantes',
      'x-default': 'https://filtraai.com/restaurantes',
    },
  },
};

export default function RestaurantesPage() {
  return (
    <SeoLanding
      h1="Reputação no Google para restaurantes e food service"
      lead="Uma avaliação não começa no Maps: ela nasce da experiência. O Filtra.AI coloca o pedido de feedback no ponto de contato da mesa, conta ou delivery e ajuda a equipe a transformar comentários em ações."
      breadcrumbHref="/restaurantes"
      contextLinks={[
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação para restaurantes', description: 'Monitore avaliações e transforme sinais do salão e do delivery em ações.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Analisar avaliações com IA', description: 'Encontre padrões recorrentes em atendimento, tempo de espera e experiência.' },
        { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e avaliações', description: 'Entenda como reputação e presença local se conectam.' },
        { href: '/feedback-de-clientes', title: 'Feedback de clientes', description: 'Crie um fluxo contínuo de opiniões para melhorar a operação.' },
      ]}
      sections={[
        {
          heading: 'A dor do salão',
          body: 'Cliente satisfeito raramente abre o Maps sozinho. Cliente irritado quase sempre avalia. Sem um canal no ponto de contato (mesa, conta, delivery), a nota pública vira roleta.',
        },
        {
          heading: 'QR na mesa e no delivery',
          body: 'Imprima o QR no cardápio, no totem ou no comprovante. No delivery, envie o link pelo WhatsApp após a entrega. Quanto mais cedo a avaliação, maior a chance de feedback construtivo.',
        },
        {
          heading: 'Velocity de reviews',
          body: 'No SEO local, consistência e experiência real importam. Um fluxo legítimo de convites para avaliações genuínas é mais sustentável do que picos artificiais de pedidos.',
        },
        {
          heading: 'Quando a nota é baixa',
          body: 'Todo feedback recebido pelo fluxo pode ser analisado no painel. Quando surgir insatisfação, a equipe entende o motivo — atraso, tempero, atendimento — e pode agir no mesmo dia, sem depender de criar uma rota baseada na nota.',
        },
        {
          heading: 'Comece em minutos',
          body: 'Ative o trial de 7 dias, gere o QR e coloque em uma mesa piloto. Meça quantos feedbacks entram na primeira semana — depois escale para o salão inteiro.',
        },
      ]}
    />
  );
}
