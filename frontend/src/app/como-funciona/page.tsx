import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

export const metadata: Metadata = {
  title: 'Como funciona: feedback, avaliações e reputação',
  description:
    'Veja como o Filtra.AI organiza feedback, facilita convites para avaliações genuínas no Google e ajuda a equipe a transformar insatisfação em melhoria. Trial de 7 dias grátis.',
  alternates: {
    canonical: 'https://filtraai.com/como-funciona',
    languages: {
      'pt-BR': 'https://filtraai.com/como-funciona',
      en: 'https://filtraai.com/en/how-it-works',
      es: 'https://filtraai.com/es/como-funciona',
      'x-default': 'https://filtraai.com/como-funciona',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/como-funciona',
    title: 'Como funciona o Filtra.AI | Gestão de reputação e avaliações',
    description: 'Veja como o Filtra.AI organiza avaliações, feedback e reputação em um fluxo com IA e teste gratuito de 7 dias.',
    images: [OG_IMAGE_META],
  },
};

export default function ComoFuncionaPage() {
  return (
    <SeoLanding
      breadcrumbHref="/como-funciona"
      h1="Como o Filtra.AI protege sua reputação no Google"
      lead="O Filtra.AI não substitui o Google Reviews. Ele cria um fluxo de feedback próximo à experiência, facilita convites não seletivos para avaliações genuínas e ajuda a equipe a tratar insatisfações com discrição."
      sections={[
        {
          heading: '1. Canal de avaliação',
          body: 'Após ativar a conta, você recebe um link e um QR Code para balcão, cardápio, embalagem ou WhatsApp. O cliente inicia o fluxo de feedback próximo à experiência e decide como deseja compartilhar sua opinião.',
        },
        {
          heading: '2. Registro da nota',
          body: 'O cliente escolhe de 1 a 5 estrelas. O sistema decide automaticamente o próximo caminho — sem você precisar intervir em cada avaliação.',
        },
        {
          heading: '3. Convite para uma avaliação genuína no Google',
          body: 'Depois da experiência, a empresa pode convidar o cliente a compartilhar uma avaliação honesta no Google. O cliente decide se avalia, qual nota dá e o que escreve.',
        },
        {
          heading: '4. Feedback privado para acompanhamento',
          body: 'O cliente também pode preferir deixar feedback direto para a empresa. Esse relato pode ficar no painel para análise, encaminhamento e acompanhamento. O tratamento privado não depende de uma nota específica.',
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
