import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './components/PwaRegister';
import { Providers } from './Providers';
import { JsonLd } from './components/JsonLd';

const siteUrl = 'https://filtraai.com';
const ogImage = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
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
        <script
          id="localized-document-language"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var segment=window.location.pathname.split('/')[1];var languages={en:'en',es:'es',zh:'zh'};document.documentElement.lang=languages[segment]||'pt-BR';}catch(e){}})();",
          }}
        />
        <JsonLd />
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
