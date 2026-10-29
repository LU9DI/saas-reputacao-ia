import { serializeJsonLd } from '../lib/safeJsonLd';
const siteUrl = 'https://filtraai.com';

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Filtra.AI',
      alternateName: ['Filtra AI', 'FiltraAI', 'Filtra.AI Gestão de Reputação'],
      url: siteUrl,
      email: 'projetosaas1@gmail.com',
      description: 'Plataforma brasileira de gestão de reputação online, avaliações e feedback de clientes com inteligência artificial. O site oficial é filtraai.com.',
      disambiguatingDescription: 'Filtra.AI é uma plataforma SaaS brasileira de gestão de reputação, avaliações e feedback de clientes. Não confundir com outras empresas ou marcas chamadas FiltrAI/Filtra AI.',
      logo: `${siteUrl}/icons/icon-512.png`,
      legalName: 'Filtra Ai Tecnologia LTDA',
      brand: { '@type': 'Brand', name: 'Filtra.AI', url: siteUrl },
      identifier: { '@type': 'PropertyValue', propertyID: 'CNPJ', value: '69.113.166/0001-10' },
      knowsAbout: ['gestão de reputação online', 'avaliações Google', 'feedback de clientes', 'SEO local', 'inteligência artificial'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Filtra.AI',
      description: 'Gestão de reputação online e análise de avaliações com IA.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: ['pt-BR', 'en', 'es', 'zh-CN'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Filtra.AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description: 'Plataforma SaaS para monitorar avaliações, analisar feedback com IA, identificar oportunidades e organizar ações de reputação.',
      featureList: ['Monitoramento de avaliações', 'Análise de feedback com IA', 'Gestão de reputação online', 'Relatórios inteligentes', 'QR Code e links para avaliações'],
      // O teste de 7 dias é gratuito, mas o produto tem assinatura paga. Não declarar price=0:
      // isso faria o Google e outros consumidores de dados estruturados interpretarem o software como gratuito.
      offers: {
        '@type': 'Offer',
        price: '69.90',
        priceCurrency: 'BRL',
        description: 'Plano Inicial mensal a partir de R$ 69,90; teste gratuito de 7 dias sem cartão.',
        url: `${siteUrl}/planos`,
      },
      provider: { '@id': `${siteUrl}/#organization` },
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  );
};
