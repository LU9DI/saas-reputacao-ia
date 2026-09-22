import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from './components/PwaRegister';
import { Providers } from './Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://filtraai.com'),
  title: {
    default: 'FILTRA.AI — Online Reputation Management',
    template: '%s · FILTRA.AI',
  },
  description:
    'AI-assisted customer feedback and online reputation management for businesses.',
  keywords: ['AI reputation management', 'review monitoring', 'customer feedback', 'online reputation management'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com',
    siteName: 'Filtra.AI',
    title: 'Filtra.AI — AI Reputation Management',
    description: 'AI-assisted customer feedback and online reputation management for businesses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filtra.AI — AI Reputation Management',
    description: 'AI-assisted customer feedback and online reputation management for businesses.',
  },
  robots: { index: true, follow: true },
  applicationName: 'FILTRA.AI',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FILTRA.AI',
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
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
