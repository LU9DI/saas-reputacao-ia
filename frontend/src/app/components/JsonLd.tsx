const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://filtraai.com';

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Filtra.AI',
      url: siteUrl,
      email: 'projetosaas1@gmail.com',
      description: 'Plataforma de gestão de reputação online, avaliações e feedback de clientes com inteligência artificial.',
      logo: `${siteUrl}/icons/icon-512.png`,
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
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', description: 'Teste gratuito de 7 dias sem cartão', url: siteUrl },
      provider: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        { '@type': 'Question', name: 'O que é o Filtra.AI?', acceptedAnswer: { '@type': 'Answer', text: 'O Filtra.AI é uma plataforma SaaS que ajuda empresas a monitorar avaliações, entender feedback de clientes e transformar sinais de reputação em ações de crescimento.' } },
        { '@type': 'Question', name: 'O Filtra.AI analisa avaliações com inteligência artificial?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. A plataforma organiza sinais, temas e oportunidades presentes nas avaliações e no feedback para apoiar decisões de gestão.' } },
        { '@type': 'Question', name: 'Existe teste gratuito?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. O Filtra.AI oferece um teste de 7 dias sem cartão para conhecer a plataforma.' } },
      ],
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
};
