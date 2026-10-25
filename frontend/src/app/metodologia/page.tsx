import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

const url = 'https://filtraai.com/metodologia';
const title = 'Metodologia: como o Filtra.AI analisa avaliações e feedback';
const description =
  'Entenda de onde vêm os dados, como o Filtra.AI classifica sentimento e temas, quando usa IA, quais são os limites da análise e o que a equipe precisa revisar.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title: `${title} | Filtra.AI`,
    description,
    url,
    type: 'article',
    siteName: 'Filtra.AI',
    locale: 'pt_BR',
    images: [OG_IMAGE_META],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [OG_IMAGE_META.url],
  },
};

// Cada afirmação desta página corresponde a um comportamento real do produto
// (backend/services/reviewService.ts, backend/lib/sentiment.ts e groqService.ts).
// Ao mudar o produto, revise o texto: uma metodologia desatualizada induz ao erro.
const faq = [
  {
    question: 'De onde vêm os dados que o Filtra.AI analisa?',
    answer:
      'Dos feedbacks que o cliente envia pelo link ou QR Code da empresa: nota de 1 a 5 e, quando o cliente quiser, um comentário. O Filtra.AI não analisa conteúdo que o cliente não enviou por esse canal.',
  },
  {
    question: 'A classificação de sentimento é feita por IA?',
    answer:
      'Depende do plano. A classificação básica (positivo, neutro ou negativo) usa a nota e uma lista de palavras e sempre está disponível. Nos planos com IA, e quando há comentário, a IA refina essa classificação. O painel registra se a origem foi a nota, a heurística ou a IA.',
  },
  {
    question: 'A IA pode errar?',
    answer:
      'Sim. Ironia, gírias regionais, contexto do negócio e comentários curtos podem ser mal interpretados. Por isso a classificação é apoio à decisão, e a equipe deve revisar os casos sensíveis antes de agir.',
  },
  {
    question: 'O Filtra.AI publica respostas sozinho?',
    answer:
      'Não. Para feedbacks sensíveis a IA sugere uma resposta e tags de tema, e a equipe decide se usa, edita ou descarta a sugestão.',
  },
  {
    question: 'Como o Filtra.AI lida com envios repetidos ou abusivos?',
    answer:
      'O envio de feedbacks tem limite por origem de acesso e há uma regra que evita várias reclamações do mesmo cliente. Isso reduz abuso, mas não substitui a leitura humana nem garante que todo envio seja legítimo.',
  },
  {
    question: 'Os dados dos clientes entram na análise?',
    answer:
      'A análise trabalha sobre o texto e a nota do feedback. O Filtra.AI não tem como objetivo inferir nem divulgar dados pessoais a partir de avaliações. Os detalhes de tratamento de dados estão na Política de Privacidade.',
  },
];

export default function Page() {
  return (
    <SeoLanding
      h1="Metodologia: como o Filtra.AI analisa avaliações e feedback"
      lead="O Filtra.AI organiza o feedback que o cliente envia pelo link ou QR Code da empresa, classifica o sentimento, sugere temas e respostas e deixa a decisão final com a equipe. Esta página descreve o que é medido, o que a IA faz, o que ela não faz e onde a análise tem limites."
      breadcrumbHref="/metodologia"
      contextLinks={[
        { href: '/glossario', title: 'Glossário de reputação online', description: 'Definições curtas dos termos usados na análise.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Como usar a análise para encontrar padrões.' },
        { href: '/como-funciona', title: 'Como funciona o Filtra.AI', description: 'O fluxo completo, do QR Code ao painel.' },
        { href: '/ia', title: 'IA para reputação', description: 'Onde a inteligência artificial entra no fluxo.' },
        { href: '/privacidade', title: 'Política de Privacidade', description: 'Como os dados são tratados.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece com um diagnóstico.' },
      ]}
      sections={[
        {
          heading: 'Fonte dos dados',
          body: 'A análise parte do feedback enviado pelo cliente no link ou QR Code da empresa: uma nota de 1 a 5 e, opcionalmente, um comentário. Envios de teste feitos no painel são identificados como teste e não entram como feedback real.',
        },
        {
          heading: 'Como o sentimento é classificado',
          body: 'Cada feedback recebe um rótulo (positivo, neutro ou negativo) e uma pontuação de -1 a +1. A classificação básica combina a nota com palavras de tom positivo ou negativo e está sempre disponível. Nos planos com IA, quando há comentário, a IA refina o resultado. A origem da classificação (nota, heurística ou IA) fica registrada em cada feedback.',
        },
        {
          heading: 'Quando a IA não é usada',
          body: 'A IA só entra em planos que a incluem e quando o serviço está disponível. Se o plano não inclui IA, se a cota de uso acabou ou se o feedback não tem comentário, o Filtra.AI mantém a classificação básica em vez de deixar o feedback sem análise.',
        },
        {
          heading: 'Temas e respostas sugeridas',
          body: 'Para feedbacks sensíveis, a IA sugere uma resposta empática e tags de tema, no idioma do cliente quando ele está entre os idiomas disponíveis. As tags ajudam a comparar recorrências ao longo do tempo. A resposta é uma sugestão: a equipe aprova, edita ou descarta.',
        },
        {
          heading: 'Proteções contra abuso',
          body: 'O envio de feedback tem limite por origem de acesso, e uma regra evita várias reclamações do mesmo cliente. Esses controles reduzem manipulação e envios em massa, mas não garantem que todo feedback seja legítimo.',
        },
        {
          heading: 'Limites da análise',
          body: 'Uma avaliação isolada não prova um padrão. Ironia, gírias, contexto do negócio e comentários muito curtos podem ser mal interpretados, e amostras pequenas mudam rápido de um mês para o outro. Use a análise para decidir onde olhar primeiro, e confirme com a leitura dos comentários antes de mudar um processo.',
        },
        {
          heading: 'O que não fazemos',
          body: 'Não incentivamos manipulação de avaliações públicas, não inferimos nem divulgamos dados pessoais a partir do que o cliente escreveu e não publicamos respostas sem a decisão da equipe.',
        },
      ]}
      faq={faq}
    />
  );
}
