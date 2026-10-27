import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '../globals.css';
import { usMeta } from '@/lib/us';
import { SITE, OG_IMAGE } from '@/lib/seo';

export function generateMetadata(): Metadata {
  const meta = usMeta();
  return {
    metadataBase: new URL(SITE),
    applicationName: 'Filtra.AI Index (US)',
    authors: [{ name: 'Filtra.AI' }],
    publisher: 'Filtra.AI',
    openGraph: { type: 'website', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Filtra.AI' }] },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE] },
    robots: meta.sintetico ? { index: false, follow: false } : { index: true, follow: true },
  };
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' };

export default function UsLayout({ children }: { children: React.ReactNode }) {
  const meta = usMeta();
  return (
    <html lang="en">
      <body>
        {meta.sintetico && <div className="amostra">SYNTHETIC DEVELOPMENT DATA. DO NOT PUBLISH. NUMBERS ARE NOT REAL.</div>}
        <header className="topo">
          <div className="wrap">
            <a className="marca" href="https://filtraai.com/en">Filtra.AI <span>/ US Index</span></a>
            <nav aria-label="Main">
              <Link href="/us">Home</Link>
              <Link href="/us/methodology">Methodology</Link>
              <a href="https://filtraai.com/en/free-review-audit?utm_source=indice&utm_medium=seo&utm_campaign=top">Free review audit</a>
            </nav>
          </div>
        </header>
        <div className="wrap">
          <main>{children}</main>
          <footer className="rodape">
            <p>
              Filtra.AI US Index: counts of business establishments with paid employees, from the U.S. Census Bureau&apos;s County Business Patterns ({meta.ano}).{' '}
              <Link href="/us/methodology">How we calculate</Link>.
            </p>
            <p>
              <a href="https://filtraai.com/en">Filtra.AI</a> · <a href="https://filtraai.com/en/free-review-audit">Free review audit</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
