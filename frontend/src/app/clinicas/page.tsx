import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Gestão de avaliações Google para clínicas | Filtra.AI',
  description:
    'Pacientes satisfeitos no Google; insatisfações no painel privado com sugestão de resposta por IA. Ideal para clínicas e multi-unidades. Trial 7 dias grátis.',
  alternates: { canonical: '/clinicas' },
};

export default function ClinicasPage() {
  return (
    <SeoLanding
      h1="Clínicas: controle a reputação antes do Google"
      lead="Na saúde, confiança é o produto. Uma avaliação pública impulsiva pode assustar novos pacientes. O Filtra.AI organiza o pedido de feedback e separa o que deve ser público do que exige cuidado interno."
      sections={[
        {
          heading: 'Momento certo de pedir',
          body: 'Após a consulta ou procedimento, quando a experiência ainda está fresca, o link ou QR no WhatsApp da clínica aumenta a taxa de resposta sem constranger a recepção.',
        },
        {
          heading: 'Feedback privado',
          body: 'Notas baixas ficam no painel para coordenação clínica e atendimento. Assim você corrige processos (espera, comunicação, retorno) antes de escalar para o Maps.',
        },
        {
          heading: 'Tom e resposta',
          body: 'A IA sugere respostas empáticas e tags. A decisão final é sempre humana — alinhada ao padrão de comunicação da clínica.',
        },
        {
          heading: 'Multi-unidade',
          body: 'Planos Corporativo e Rei permitem visão por unidade, útil para redes e franquias que precisam comparar reputação entre endereços.',
        },
        {
          heading: 'Trial sem cartão',
          body: 'Sete dias para validar o fluxo com a recepção e o time de marketing. Sem cobrança automática no período de teste.',
        },
      ]}
    />
  );
}
