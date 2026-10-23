import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { PwaRegister } from '../components/PwaRegister';
import { Providers } from '../Providers';
import { JsonLd } from '../components/JsonLd';
import { rootMetadata, rootViewport } from '../lib/rootMetadata';

type Lang = 'en' | 'es' | 'zh';

const langs: Lang[] = ['en', 'es', 'zh'];

function isLang(value: string): value is Lang {
  return (langs as string[]).includes(value);
}

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export default async function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} className="h-full" suppressHydrationWarning>
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
