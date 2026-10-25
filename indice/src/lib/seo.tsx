import type { ReactNode } from 'react';

export const SITE = 'https://filtraai.com';
export const BASE = `${SITE}/indice`;
export const ORG_ID = `${SITE}/#organization`;
export const OG_IMAGE = `${SITE}/og-image.png`;
export const FONTE_URL = 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos';

export const urlAbsoluta = (caminho: string) => (caminho === '/' ? `${BASE}/` : `${BASE}${caminho}`);

export function JsonLd({ data }: { data: object }): ReactNode {
  // "<" escapado para que nenhum texto de dado feche a tag <script>.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function breadcrumb(itens: { nome: string; caminho: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Filtra.AI', item: `${SITE}/` },
      ...itens.map((it, i) => ({ '@type': 'ListItem', position: i + 2, name: it.nome, item: urlAbsoluta(it.caminho) })),
    ],
  };
}

export function faqLd(itens: { pergunta: string; resposta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: itens.map((i) => ({ '@type': 'Question', name: i.pergunta, acceptedAnswer: { '@type': 'Answer', text: i.resposta } })),
  };
}

export const publisher = { '@id': ORG_ID };
export const baseDeDados = {
  '@type': 'Dataset',
  name: 'Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos',
  url: FONTE_URL,
  publisher: { '@type': 'GovernmentOrganization', name: 'Receita Federal do Brasil' },
};
