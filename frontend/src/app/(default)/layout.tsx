import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { PwaRegister } from '../components/PwaRegister';
import { Providers } from '../Providers';
import { JsonLd } from '../components/JsonLd';
import { rootMetadata, rootViewport } from '../lib/rootMetadata';

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function DefaultRootLayout({ children }: { children: React.ReactNode }) {
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
