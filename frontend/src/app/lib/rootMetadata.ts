import type { Metadata, Viewport } from 'next';

const siteUrl = 'https://filtraai.com';
const ogImage = `${siteUrl}/og-image.png`;

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    template: '%s · Filtra.AI',
  },
  description:
    'Filtra.AI é a plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com IA. Monitore sinais, encontre padrões e transforme feedback em ação.',
  applicationName: 'Filtra.AI',
  keywords: ['Filtra','Filtra.AI','Filtra AI','gestão de reputação online','gestão de avaliações','avaliações Google','análise de avaliações com IA','feedback de clientes','customer feedback analytics','review analysis','AI reputation management','experiência do cliente','satisfação do cliente','reputação online','monitoramento de avaliações Google','gestão de reviews','software de gestão de reputação','reputação empresarial','reputação para hotéis','reputação para restaurantes','reputação para clínicas','reputação para franquias'],
  authors: [{ name: 'Filtra.AI' }],
  creator: 'Filtra.AI',
  publisher: 'Filtra.AI',
  manifest: '/manifest.webmanifest',
  category: 'BusinessApplication',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Filtra.AI',
    title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    description: 'Monitore avaliações Google, organize feedback e transforme sinais de reputação em decisões práticas com inteligência artificial.',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Filtra.AI — Gestão de reputação online e avaliações Google com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI | Gestão de reputação online e avaliações Google com IA',
    description: 'Monitore avaliações, analise feedback com IA e transforme sinais de clientes em prioridades de ação.',
    images: [ogImage],
  },
  other: { googlebot: 'max-image-preview:large, max-snippet:-1' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Filtra.AI' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const rootViewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#000000' }, { media: '(prefers-color-scheme: light)', color: '#4f46e5' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};
