import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Avaliações Google para restaurantes | Filtra.AI',
  description:
    'QR na mesa, filtro 4–5★ para o Google e feedback ruim no painel. Aumente a velocidade de reviews positivos sem perder controle da reputação. Trial 7 dias.',
  alternates: { canonical: '/restaurantes' },
};

export default function RestaurantesPage() {
  return (
    <SeoLanding
      h1="Reputação no Google para restaurantes e food service"
      lead="Uma review 1★ no horário de pico pode custar semanas de anúncio. O Filtra.AI coloca o pedido de avaliação no fluxo da mesa — e separa o que deve ir ao Google do que deve ser tratado na cozinha e no salão."
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
          body: 'No SEO local, reviews recentes pesam. Um fluxo estável de avaliações 4–5★ no Google ajuda mais do que um pico artificial seguido de silêncio.',
        },
        {
          heading: 'Quando a nota é baixa',
          body: '1–3★ ficam no painel: você vê o padrão (atraso, tempero, atendimento) antes de virar crise pública e pode agir com a equipe no mesmo dia.',
        },
        {
          heading: 'Comece em minutos',
          body: 'Ative o trial de 7 dias, gere o QR e coloque em uma mesa piloto. Meça quantos feedbacks entram na primeira semana — depois escale para o salão inteiro.',
        },
      ]}
    />
  );
}
