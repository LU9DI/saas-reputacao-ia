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
      description:
        'Gestão de avaliações Google e reputação online com filtro 4–5★ / 1–3★, QR Code e IA.',
      logo: `${siteUrl}/icons/icon-512.png`,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Filtra.AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description:
        'Plataforma SaaS de reputação: QR/link de avaliação, roteamento para Google Reviews nas notas altas e painel privado nas baixas, com IA e relatório inteligente.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        description: 'Trial gratuito de 7 dias sem cartão',
        url: siteUrl,
      },
      provider: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O Filtra.AI substitui o Google Reviews?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. O Filtra.AI orienta avaliações 4–5 estrelas para o Google Reviews e mantém feedbacks 1–3 no painel privado para a empresa tratar com discrição.',
          },
        },
        {
          '@type': 'Question',
          name: 'O teste de 7 dias exige cartão de crédito?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. O trial de 7 dias não exige cartão e não gera cobrança automática.',
          },
        },
        {
          '@type': 'Question',
          name: 'Para quem o Filtra.AI é indicado?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Restaurantes, clínicas, varejo local, redes multi-unidade e agências de marketing que trabalham SEO local e reputação no Google.',
          },
        },
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
}
