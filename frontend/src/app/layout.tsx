import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './components/PwaRegister';
import { Providers } from './Providers';
import { JsonLd } from './components/JsonLd';
import { LanguageSwitcher } from './components/LanguageSwitcher';

const siteUrl = 'https://filtraai.com';
const ogImage = `${siteUrl}/og-image.svg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Filtra.AI — Transforme a voz do cliente em crescimento',
    template: '%s · Filtra.AI',
  },
  description:
    'Filtra.AI transforma avaliações e feedback de clientes em inteligência para crescimento, reputação, retenção e decisões de gestão. Teste grátis por 7 dias.',
  applicationName: 'Filtra.AI',
  keywords: [
    'feedback de clientes',
    'análise de avaliações com IA',
    'gestão de reputação online',
    'customer feedback analytics',
    'review analysis',
    'AI reputation management',
    'experiência do cliente',
    'satisfação do cliente',
    'gestão de avaliações',
    'reputação online',
    'crescimento empresarial',
    'Filtra.AI',
    'software de gestão de reputação',
    'monitoramento de avaliações Google',
    'gestão de reviews',
    'customer experience',
    'reputação empresarial',
    'reputação para hotéis',
    'reputação para restaurantes',
    'reputação para clínicas',
    'reputação para franquias',
  ],
  authors: [{ name: 'Filtra.AI' }],
  creator: 'Filtra.AI',
  publisher: 'Filtra.AI',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: 'https://filtraai.com/' },
  category: 'BusinessApplication',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Filtra.AI',
    title: 'Filtra.AI — Transforme a voz do cliente em crescimento',
    description:
      'Descubra padrões nas avaliações, identifique problemas e oportunidades e transforme a voz do consumidor em decisões de crescimento. Teste grátis por 7 dias.',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Filtra.AI — Gestão de avaliações Google' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI — A voz do cliente pode mostrar onde sua empresa cresce',
    description:
      'Analise avaliações e feedback com IA e transforme sinais de clientes em prioridades de ação. Teste grátis por 7 dias.',
    images: [ogImage],
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
  formatDetection: { telephone: false },
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
          <div className="fixed right-4 top-4 z-[100]">
            <LanguageSwitcher compact />
          </div>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
