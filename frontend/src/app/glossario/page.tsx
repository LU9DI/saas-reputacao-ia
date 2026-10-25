import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

const url = 'https://filtraai.com/glossario';
const title = 'Glossário de reputação online e avaliações Google';
const description =
  'Definições diretas de avaliação Google, reputação online, análise de sentimento, SEO local, review gating e outros termos usados na gestão de avaliações.';

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

// Definição curta primeiro: é o formato que buscadores e assistentes de IA
// conseguem citar sem depender de contexto. Mantenha cada definição em 1–2 frases.
const terms: { term: string; definition: string }[] = [
  {
    term: 'Avaliação Google',
    definition:
      'Nota de 1 a 5 estrelas, com comentário opcional, que um cliente publica no perfil de uma empresa no Google. É pública e aparece na busca e no Maps.',
  },
  {
    term: 'Perfil da Empresa no Google (Google Business Profile)',
    definition:
      'Ficha gratuita do Google em que a empresa gerencia como aparece na busca e no Maps: endereço, horários, fotos, respostas e avaliações.',
  },
  {
    term: 'Reputação online',
    definition:
      'Percepção pública de uma empresa formada por avaliações, comentários, menções e respostas disponíveis na internet.',
  },
  {
    term: 'Feedback do cliente',
    definition:
      'Opinião que o cliente compartilha sobre uma experiência, em canal público ou privado. O feedback privado permite tratar o problema antes de virar uma avaliação pública.',
  },
  {
    term: 'Análise de sentimento',
    definition:
      'Classificação do tom de um texto, em geral como positivo, neutro ou negativo, por regras, por modelos de IA ou pela combinação dos dois. Apoia a triagem, mas pode errar em ironia e contexto.',
  },
  {
    term: 'Tag de tema',
    definition:
      'Rótulo que resume o assunto de um feedback, como atendimento, tempo de espera ou preço. Permite comparar recorrências entre períodos e unidades.',
  },
  {
    term: 'Nota média',
    definition:
      'Média das notas recebidas. Depende do volume: com poucas avaliações, uma única nota muda a média de forma visível.',
  },
  {
    term: 'Frequência de avaliações (review velocity)',
    definition:
      'Ritmo com que novas avaliações chegam ao longo do tempo. Um fluxo contínuo costuma transmitir mais atualidade do que um pico isolado.',
  },
  {
    term: 'Solicitação seletiva de avaliações (review gating)',
    definition:
      'Prática de convidar para a avaliação pública apenas clientes satisfeitos. Contraria as diretrizes do Google, que não permitem solicitar avaliações apenas de clientes satisfeitos.',
  },
  {
    term: 'SEO local',
    definition:
      'Conjunto de práticas para uma empresa aparecer em buscas com intenção local, como "dentista perto de mim". Avaliações, proximidade e dados do perfil entram nessa composição.',
  },
  {
    term: 'Local Pack',
    definition:
      'Bloco com mapa e três empresas que o Google mostra em buscas locais. É um dos principais pontos de visibilidade para negócios com endereço físico.',
  },
  {
    term: 'QR Code de avaliação',
    definition:
      'Código impresso em balcão, cardápio ou embalagem que leva o cliente direto ao canal de feedback ou de avaliação, reduzindo o esforço de participar.',
  },
  {
    term: 'Resposta a avaliações',
    definition:
      'Resposta pública da empresa a um comentário. Mostra atenção ao cliente e, em avaliações negativas, é a chance de explicar e oferecer solução.',
  },
  {
    term: 'GEO e AEO',
    definition:
      'GEO (Generative Engine Optimization) busca ser citado por assistentes de IA; AEO (Answer Engine Optimization) busca ser a resposta direta em buscadores. Ambos dependem de conteúdo claro, estruturado e com fonte.',
  },
];

const definedTermSet = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${url}#termset`,
  name: title,
  url,
  inLanguage: 'pt-BR',
  hasDefinedTerm: terms.map((t) => ({
    '@type': 'DefinedTerm',
    name: t.term,
    description: t.definition,
    inDefinedTermSet: `${url}#termset`,
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }}
      />
      <SeoLanding
        h1="Glossário de reputação online e avaliações Google"
        lead="Definições curtas dos termos mais usados em gestão de avaliações, reputação online e análise de feedback. Cada termo é explicado em uma ou duas frases, sem depender de contexto."
        breadcrumbHref="/glossario"
        contextLinks={[
          { href: '/metodologia', title: 'Metodologia do Filtra.AI', description: 'Como os dados são analisados e quais são os limites.' },
          { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize a gestão das avaliações.' },
          { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Encontre padrões em comentários.' },
          { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture a rotina de reputação.' },
          { href: '/blog/seo-local-avaliacoes-local-pack', title: 'SEO local e Local Pack', description: 'Como avaliações entram em buscas locais.' },
          { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece com um diagnóstico.' },
        ]}
        sections={terms.map((t) => ({ heading: t.term, body: t.definition }))}
      />
    </>
  );
}
