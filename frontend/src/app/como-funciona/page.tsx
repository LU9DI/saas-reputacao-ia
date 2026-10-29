import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';
import { serializeJsonLd } from '../lib/safeJsonLd';

export const metadata: Metadata = {
  title: 'Como funciona: feedback, avaliações e reputação',
  description:
    'Veja como o Filtra.AI organiza feedback, apoia convites para avaliações genuínas e ajuda a equipe a transformar insatisfação em melhoria.',
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'Como o Filtra.AI organiza feedback e avaliações',
            description:
              'Fluxo do Filtra.AI: criar um canal de avaliação, registrar a nota, apoiar o convite para uma avaliação genuína no Google, tratar o feedback privado e usar IA como apoio à análise.',
            step: [
              {
                '@type': 'HowToStep',
                position: 1,
                name: 'Criar o canal de avaliação',
                text: 'A empresa recebe um link e um QR Code para usar no balcão, cardápio, embalagem ou WhatsApp. O cliente inicia o feedback próximo da experiência.',
              },
              {
                '@type': 'HowToStep',
                position: 2,
                name: 'Registrar a nota',
                text: 'O cliente escolhe de 1 a 5 estrelas e o sistema encaminha o fluxo conforme a resposta, sem intervenção manual em cada avaliação.',
              },
              {
                '@type': 'HowToStep',
                position: 3,
                name: 'Convidar para uma avaliação genuína',
                text: 'Depois da experiência, a empresa pode convidar o cliente a publicar uma avaliação honesta no Google. O cliente decide se avalia, a nota e o texto.',
              },
              {
                '@type': 'HowToStep',
                position: 4,
                name: 'Tratar o feedback privado',
                text: 'O cliente também pode enviar feedback direto para a empresa, que fica no painel para análise, encaminhamento e acompanhamento.',
              },
              {
                '@type': 'HowToStep',
                position: 5,
                name: 'Usar IA como apoio',
                text: 'Em feedbacks sensíveis, a IA sugere resposta e tags. A equipe revisa, edita ou descarta a sugestão antes de qualquer ação.',
              },
            ],
          }),
        }}
      />
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
      faq={[
        {
          question: 'Como funciona o Filtra.AI?',
          answer: 'A empresa oferece um link ou QR Code de feedback, o cliente registra a experiência e decide se quer publicar uma avaliação honesta no Google. O feedback privado fica no painel para análise, encaminhamento e acompanhamento.',
        },
        {
          question: 'Preciso de cartão de crédito para testar?',
          answer: 'O teste de 7 dias não exige cartão de crédito. Depois do período, a empresa escolhe um plano ou cancela.',
        },
        {
          question: 'O Filtra.AI publica avaliações no Google automaticamente?',
          answer: 'Não. A publicação é uma decisão do cliente. O Filtra.AI facilita o convite e organiza o feedback, sem criar avaliações nem escolher a nota.',
        },
        {
          question: 'A IA responde as avaliações sozinha?',
          answer: 'Não. A IA sugere respostas e tags de tema; a equipe revisa, edita ou descarta a sugestão antes de qualquer publicação.',
        },
        {
          question: 'Funciona para empresas com várias unidades?',
          answer: 'Sim. A análise pode comparar temas e evolução por unidade, o que ajuda a separar um problema local de um padrão da rede.',
        },
      ]}
    />
    </>
  );
}
