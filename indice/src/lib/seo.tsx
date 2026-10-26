import type { ReactNode } from 'react';

export const SITE = 'https://filtraai.com';
export const BASE = `${SITE}/indice`;
export const ORG_ID = `${SITE}/#organization`;
export const OG_IMAGE = `${SITE}/og-image.png`;
export const FONTE_URL = 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/cadastros/cnpj';
export const FONTE_DADOS_ABERTOS_URL = 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos';
export const SUPORTE_URL = 'https://filtraai.com/suporte';
export const CONSUMIDOR_URL = 'https://www.consumidor.gov.br/';
export const INDEX_DATASET_ID = `${BASE}/#dataset`;
export const INDEX_DATASET_NAME = 'Índice Filtra.AI: estabelecimentos ativos por município e segmento';

// O Next usa trailingSlash: false. /indice/ responde 308 para /indice; por isso
// canonical, sitemap, Open Graph e breadcrumbs usam sempre a forma sem barra final.
export const urlAbsoluta = (caminho: string) => `${BASE}${caminho === '/' ? '' : caminho}`;

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

// Entidade editorial identificável: organização, sem inventar pessoa física.
export const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Filtra.AI',
  url: SITE,
};

export const publisher = organization;

export const baseDeDados = {
  '@type': 'Dataset',
  name: 'Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos',
  description: 'Base de dados abertos do CNPJ publicada pela Receita Federal do Brasil, usada para as contagens do Índice.',
  url: FONTE_URL,
  publisher: { '@type': 'GovernmentOrganization', name: 'Receita Federal do Brasil' },
};

type MetaResumo = {
  competencia: string;
  geradoEm: string;
  janela: { inicio: string; fim: string };
};

const TECNICA =
  'Contagem de estabelecimentos por situação cadastral, atividade econômica principal (CNAE) e município. Aberturas usam a data de início de atividade; baixas usam a data da situação cadastral, na janela de 12 meses fechada antes da competência.';

/** Dataset do Índice inteiro. Home e metodologia compartilham o mesmo @id e o mesmo conteúdo. */
export function datasetDoIndice(meta: MetaResumo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': INDEX_DATASET_ID,
    name: INDEX_DATASET_NAME,
    description:
      'Contagens agregadas de estabelecimentos ativos, aberturas e baixas por município e segmento, derivadas do cadastro aberto de CNPJ da Receita Federal. Cobre os segmentos acompanhados e os municípios com pelo menos 10 estabelecimentos ativos no segmento; não é o total de empresas brasileiras e não mede reputação.',
    url: BASE,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    creator: { '@id': ORG_ID },
    publisher,
    isBasedOn: baseDeDados,
    dateModified: meta.geradoEm,
    temporalCoverage: `${meta.janela.inicio}/${meta.competencia}`,
    spatialCoverage: {
      '@type': 'Place',
      name: 'Brasil',
      address: { '@type': 'PostalAddress', addressCountry: 'BR' },
    },
    measurementTechnique: TECNICA,
    variableMeasured: ['Estabelecimentos ativos', 'Aberturas em 12 meses', 'Baixas de CNPJ em 12 meses'],
  };
}

export type VariavelDataset = {
  nome: string;
  valor: number;
  unidade?: string;
  descricao?: string;
};

/** Dataset de um recorte (estado, município ou célula), ligado ao Dataset principal pelo @id. */
export function datasetDoRecorte({
  url,
  name,
  description,
  espacial,
  meta,
  variaveis,
}: {
  url: string;
  name: string;
  description: string;
  espacial: string;
  meta: MetaResumo;
  variaveis: VariavelDataset[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${url}#dados`,
    name,
    description,
    url,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    isPartOf: { '@id': INDEX_DATASET_ID },
    creator: { '@id': ORG_ID },
    publisher,
    isBasedOn: baseDeDados,
    dateModified: meta.geradoEm,
    temporalCoverage: `${meta.janela.inicio}/${meta.competencia}`,
    spatialCoverage: { '@type': 'Place', name: espacial },
    measurementTechnique: TECNICA,
    variableMeasured: variaveis.map((v) => ({
      '@type': 'PropertyValue',
      name: v.nome,
      value: v.valor,
      ...(v.unidade ? { unitText: v.unidade } : {}),
      ...(v.descricao ? { description: v.descricao } : {}),
    })),
  };
}
