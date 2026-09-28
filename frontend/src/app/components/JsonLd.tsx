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
