import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { SeoPageHeader } from 'components/SeoPageHeader';

export const metadata: Metadata = {
  title: 'Pedir estrela no Google não basta | Filtre antes de publicar',
  description:
    'Pedir avaliação não é controlar reputação. Entenda a diferença entre só solicitar estrelas e filtrar o feedback com QR: 4–5★ no Google, 1–3★ no painel. Trial Filtra.AI.',
  alternates: { canonical: '/pedir-estrela-vs-filtrar' },
};

export default function PedirVsFiltrarPage() {
  return (
    <SeoLanding
      h1="Pedir avaliação ≠ controlar reputação"
      lead="Muitos negócios só mandam o link do Google e torcem. Isso aumenta volume — e também o risco de reviews impulsivas. Filtrar o primeiro passo da experiência muda o jogo."
      sections={[
        {
          heading: 'O problema do “só peça 5★”',
          body: 'Incentivar apenas nota máxima pode violar políticas do Google e gerar desconfiança. O caminho sustentável é facilitar a avaliação honesta e tratar problemas cedo.',
        },
        {
          heading: 'O que o filtro faz',
          body: 'No Filtra.AI o cliente avalia no seu canal. Notas 4–5 são convidadas a concluir no Google Reviews. Notas 1–3 ficam no painel para a equipe agir com contexto.',
        },
        {
          heading: 'Transparência com responsabilidade',
          body: 'O objetivo não é censurar o Google. É dar à empresa a chance de resolver falhas operacionais e, ao mesmo tempo, não desperdiçar clientes satisfeitos que nunca avaliariam sozinhos.',
        },
        {
          heading: 'FAQ rápido',
          body: 'O Filtra substitui o Google? Não. Ele orienta o fluxo. Preciso de cartão no trial? Não. Funciona em restaurante e clínica? Sim — o canal se adapta ao ponto de contato.',
        },
        {
          heading: 'Teste os dois modelos',
          body: 'Compare uma semana só com link do Google versus uma semana com QR Filtra.AI. A diferença costuma aparecer no painel e na consistência das notas públicas.',
        },
      ]}
    />
  );
}
