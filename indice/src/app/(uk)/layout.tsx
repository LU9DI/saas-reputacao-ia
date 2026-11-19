import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '../globals.css';
import { temDadosUK, ukMeta } from '@/lib/uk';
import { SITE, OG_IMAGE } from '@/lib/seo';
import { BrandMark } from '@/components/BrandMark';
import { AnalyticsConsent } from '@/components/AnalyticsConsent';

export function generateMetadata(): Metadata {
  if (!temDadosUK()) return { robots: { index: false, follow: false } };
  const meta = ukMeta();
  return {
    metadataBase: new URL(SITE),
    applicationName: 'Filtra.AI Index (UK)',
    authors: [{ name: 'Filtra.AI' }],
    publisher: 'Filtra.AI',
    openGraph: { type: 'website', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Filtra.AI' }] },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE] },
    robots: meta.sintetico ? { index: false, follow: false } : { index: true, follow: true },
  };
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' };

export default function UkLayout({ children }: { children: React.ReactNode }) {
  // Sem data-uk/ as páginas respondem 404 (notFound nas rotas); o layout não pode quebrar antes disso.
  const meta = temDadosUK() ? ukMeta() : null;
  return (
    <html lang="en-GB">
      <body>
        <AnalyticsConsent />
        {meta?.sintetico && <div className="amostra">SYNTHETIC DEVELOPMENT DATA. DO NOT PUBLISH. NUMBERS ARE NOT REAL.</div>}
        <header className="topo">
          <div className="wrap topo-in">
            <div className="topo-marca">
              <BrandMark uid="topo" />
              <Link className="topo-secao" href="/uk">UK Index</Link>
            </div>
            <nav aria-label="Main">
              <Link href="/uk">Home</Link>
              <Link href="/uk/methodology">Methodology</Link>
              {/* Hub irmão (pt-BR). Rótulo no idioma de destino. */}
              <Link href="/" hrefLang="pt-BR" lang="pt-BR">Índice Brasil</Link>
              <a className="botao botao-sm" href="https://filtraai.com/en/free-review-audit?utm_source=indice&utm_medium=seo&utm_campaign=top">Free review audit</a>
            </nav>
          </div>
        </header>
        <div className="wrap">
          <main>{children}</main>
        </div>
        <footer className="rodape">
          <div className="wrap rodape-in">
            <BrandMark size="sm" uid="rodape" />
            <div className="rodape-texto">
              <p>
                Filtra.AI UK Index: counts of local business units by local authority and category, from the Office for National Statistics UK Business Counts ({meta?.ano}). Contains public sector information licensed under the Open Government Licence v3.0.{' '}
                <Link href="/uk/methodology">How we calculate</Link>.
              </p>
              <p>
                <a href="https://filtraai.com/en">Filtra.AI</a> · <a href="https://filtraai.com/en/free-review-audit">Free review audit</a>
              </p>
              {/* Link recíproco com o Índice Brasil, presente em TODAS as páginas /uk. */}
              <p>
                Brazil edition:{' '}
                <Link href="/" hrefLang="pt-BR" lang="pt-BR">Índice Filtra.AI</Link> — counts by Brazilian municipality from the federal CNPJ registry.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
