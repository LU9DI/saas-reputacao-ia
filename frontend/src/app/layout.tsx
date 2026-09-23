import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './components/PwaRegister';
import { Providers } from './Providers';
import { JsonLd } from './components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://filtraai.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      'Filtra.AI — Gestão de avaliações Google e reputação online | Trial 7 dias',
    template: '%s · Filtra.AI',
  },
  description:
    'Filtre avaliações antes do Google: 4–5★ vão ao Google Reviews, 1–3★ ficam no painel privado com IA. QR Code, WhatsApp, relatório inteligente. Teste grátis por 7 dias, sem cartão.',
  applicationName: 'Filtra.AI',
  keywords: [
    'gestão de avaliações Google',
    'reputação online',
    'Google Reviews',
    'Google Meu Negócio',
    'filtro de avaliações',
    'QR Code avaliação',
    'reputação restaurante',
    'avaliações clínica',
    'SEO local reviews',
    'Filtra.AI',
  ],
  authors: [{ name: 'Filtra.AI' }],
  creator: 'Filtra.AI',
  publisher: 'Filtra.AI',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Filtra.AI',
    title: 'Filtra.AI — Reputação com filtro | Avaliações Google',
    description:
      '4–5★ → Google · 1–3★ → painel privado + IA. Trial grátis de 7 dias para restaurantes, clínicas e redes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI — Gestão de avaliações Google',
    description:
      'Filtre antes de publicar. Trial 7 dias grátis. QR + painel + IA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Filtra.AI',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        <JsonLd />
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
