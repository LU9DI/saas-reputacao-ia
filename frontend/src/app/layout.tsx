import type { Metadata, Viewport } from 'next';
// @ts-expect-error Next.js processes global CSS imports without TypeScript declarations.
import './globals.css';
import { PwaRegister } from './components/PwaRegister';

export const metadata: Metadata = {
  title: 'FILTRA.AI — Gestão de Reputação Online',
  description:
    'Sistema inteligente de contenção de crises e gestão de avaliações para comércios locais',
  applicationName: 'Filtra.IA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Filtra.IA',
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
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
