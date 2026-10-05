import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './components/PwaRegister';
import { Providers } from './Providers';
import { JsonLd } from './components/JsonLd';

const siteUrl = 'https://filtraai.com';
const ogImage = `${siteUrl}/og-image.svg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Filtra.AI | Filtra — Gestão de reputação online com IA',
    template: '%s · Filtra.AI',
  },
  description:
    'Filtra.AI é a plataforma brasileira de gestão de reputação online com IA: monitore avaliações Google, analise feedback de clientes e transforme a voz do cliente em crescimento.',
  applicationName: 'Filtra.AI',
  keywords: ['Filtra','Filtra.AI','Filtra AI','gestão de reputação online','gestão de avaliações','avaliações Google','análise de avaliações com IA','feedback de clientes','customer feedback analytics','review analysis','AI reputation management','experiência do cliente','satisfação do cliente','reputação online','monitoramento de avaliações Google','gestão de reviews','software de gestão de reputação','reputação empresarial','reputação para hotéis','reputação para restaurantes','reputação para clínicas','reputação para franquias'],
  authors: [{ name: 'Filtra.AI' }],
  creator: 'Filtra.AI',
  publisher: 'Filtra.AI',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: `${siteUrl}/` },
  category: 'BusinessApplication',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Filtra.AI',
    title: 'Filtra.AI | Filtra — Gestão de reputação online com IA',
    description: 'Gestão de reputação online, avaliações Google e análise de feedback com inteligência artificial.',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Filtra.AI — Gestão de reputação online com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI | Filtra — Gestão de reputação online com IA',
    description: 'Monitore avaliações, analise feedback com IA e transforme sinais de clientes em prioridades de ação.',
    images: [ogImage],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Filtra.AI' },
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
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#000000' }, { media: '(prefers-color-scheme: light)', color: '#4f46e5' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
