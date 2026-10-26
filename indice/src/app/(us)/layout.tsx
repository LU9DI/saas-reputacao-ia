import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { usMeta } from '@/lib/us';
import { SITE, OG_IMAGE } from '@/lib/seo';

export function generateMetadata(): Metadata {
  const meta = usMeta();
  return {
    metadataBase: new URL(SITE),
    applicationName: 'Filtra.AI Index',
    authors: [{ name: 'Filtra.AI' }],
    publisher: 'Filtra.AI',
    openGraph: { type: 'website', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Filtra.AI' }] },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE] },
    robots: meta.synthetic ? { index: false, follow: false } : { index: true, follow: true },
  };
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' };

export default function UsLayout({ children }: { children: React.ReactNode }) {
  const meta = usMeta();
  return (
    <html lang="en">
      <body>
        {meta.synthetic && <div className="amostra">SYNTHETIC DEVELOPMENT DATA. DO NOT PUBLISH. NOT REAL.</div>}
        <header className="topo">
          <div className="wrap">
            <a className="marca" href="https://filtraai.com/en">Filtra.AI <span>/ Index</span></a>
            <nav aria-label="Main">
              <Link href="/en">Home</Link>
              <Link href="/en/methodology">Methodology</Link>
              <a href="https://filtraai.com/en/free-review-audit?utm_source=indice&utm_medium=seo&utm_campaign=top">Free review audit</a>
            </nav>
          </div>
        </header>
        <div className="wrap">
          <main>{children}</main>
          <footer className="rodape">
            <p>
              Filtra.AI Index: establishment counts from the U.S. Census Bureau County Business Patterns ({meta.year}). Aggregated figures only.{' '}
              <Link href="/en/methodology">How we calculate</Link>.
            </p>
            <p><a href="https://filtraai.com/en">Filtra.AI</a></p>
          </footer>
        </div>
      </body>
    </html>
  );
}
