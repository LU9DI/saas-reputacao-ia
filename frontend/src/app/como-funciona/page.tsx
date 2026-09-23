import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';

export const metadata: Metadata = {
  title: 'Como funciona o Filtra.AI | Filtro de avaliações Google',
  description:
    'Veja o passo a passo: QR ou link, nota de 1 a 5, 4–5★ vão ao Google Reviews e 1–3★ ficam no painel privado com apoio de IA. Trial 7 dias grátis.',
  alternates: { canonical: '/como-funciona' },
};

export default function ComoFuncionaPage() {
  return (
    <SeoLanding
      h1="Como o Filtra.AI protege sua reputação no Google"
      lead="O Filtra.AI não substitui o Google Reviews. Ele orienta experiências positivas para lá e trata insatisfações em ambiente privado, com painel e apoio de IA."
      sections={[
        {
          heading: '1. Canal de avaliação',
          body: 'Após ativar a conta, você recebe um link exclusivo e um QR Code para balcão, cardápio, embalagem ou WhatsApp. O cliente avalia primeiro no seu ambiente controlado.',
        },
        {
          heading: '2. Registro da nota',
          body: 'O cliente escolhe de 1 a 5 estrelas. O sistema decide automaticamente o próximo caminho — sem você precisar intervir em cada avaliação.',
        },
        {
          heading: '3. Notas altas (4–5★): Google Reviews',
          body: 'Avaliações positivas são direcionadas à página oficial no Google. A publicação final depende da confirmação do cliente no Google, como em qualquer fluxo legítimo.',
        },
        {
          heading: '4. Notas baixas (1–3★): painel privado',
          body: 'Notas 3 ou menos permanecem no painel, sem redirecionamento automático ao Google, para a equipe analisar, corrigir processos e responder com discrição.',
        },
        {
          heading: '5. IA e relatório',
          body: 'Em feedbacks sensíveis, a IA sugere resposta empática e tags. Planos com relatório inteligente resumem o ciclo para sócios e gestores.',
        },
        {
          heading: '6. Trial de 7 dias',
          body: 'Teste sem cartão de crédito. Depois escolha um plano (Inicial, Pro, Ultra, Corporativo ou Rei). Cancele quando quiser; o acesso vale até o fim do período pago.',
        },
      ]}
    />
  );
}
