import { serializeJsonLd } from '../lib/safeJsonLd';
import type { Metadata } from 'next';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

const url = 'https://filtraai.com/sobre';
const title = 'Sobre o Filtra.AI: quem somos e de onde vêm os dados';
const description =
  'O Filtra.AI é uma plataforma de gestão de reputação e feedback com relatórios em IA. Veja o que fazemos, a origem dos dados do Índice e como pedir uma correção.';

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
  twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE_META.url] },
};

// Só afirmações que o próprio site e o repositório sustentam. Não inclua número de
// clientes, prêmios ou nomes de pessoas sem fonte verificável.
const sections = [
  {
    heading: 'O que o Filtra.AI faz',
    body: 'O Filtra.AI é uma plataforma de gestão de reputação e feedback. Ela reúne avaliações e comentários de clientes, organiza os sinais e gera relatórios com apoio de IA para a equipe decidir o que melhorar. Ela não cria nota própria de reputação e não garante posição em buscas.',
  },
  {
    heading: 'De onde vêm os dados do Índice',
    body: 'O Índice Filtra.AI publica contagens agregadas de estabelecimentos. No Brasil, a fonte é o cadastro aberto de CNPJ da Receita Federal. Nos Estados Unidos, é o County Business Patterns do Census Bureau. São números por município ou condado e por categoria, sem dados pessoais e sem nomes de empresas.',
  },
  {
    heading: 'Como tratamos limites e erros',
    body: 'Só publicamos um recorte quando ele tem ao menos 10 estabelecimentos, para evitar páginas com pouca informação. O Índice mostra a competência dos dados em cada página, e a metodologia explica o que a contagem inclui e o que ela não mede.',
  },
  {
    heading: 'Como pedir uma correção',
    body: 'Se encontrar um número que não bate com a fonte, ou um conteúdo que precise de ajuste, fale com a equipe pela página de suporte. Informe a URL e o que está diferente; conferimos na fonte e atualizamos a página.',
  },
];

const profilePage = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${url}#profile`,
  url,
  name: title,
  inLanguage: 'pt-BR',
  mainEntity: {
    '@type': 'Organization',
    '@id': 'https://filtraai.com/#organization',
    name: 'Filtra.AI',
    url: 'https://filtraai.com',
    description,
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(profilePage) }} />
      <SeoLanding
        h1="Sobre o Filtra.AI"
        lead="O Filtra.AI é uma plataforma de gestão de reputação e feedback com relatórios em IA. Esta página diz o que fazemos, de onde vêm os dados do nosso Índice e como pedir uma correção."
        breadcrumbHref="/sobre"
        contextLinks={[
          { href: '/metodologia', title: 'Metodologia do Filtra.AI', description: 'Como os dados são analisados e quais são os limites.' },
          { href: '/indice/metodologia', title: 'Metodologia do Índice', description: 'Fonte, competência e cálculo das contagens.' },
          { href: '/suporte', title: 'Suporte', description: 'Fale com a equipe e peça uma correção.' },
          { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Comece com um diagnóstico.' },
        ]}
        sections={sections}
      />
    </>
  );
}
