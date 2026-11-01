import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { getMeta } from '@/lib/data';
import { SITE, OG_IMAGE } from '@/lib/seo';
import { mesPorExtenso } from '@/lib/format';
import { SiteHeader } from '@/components/SiteHeader';
import { BrandMark } from '@/components/BrandMark';

export function generateMetadata(): Metadata {
  const meta = getMeta();
  return {
    metadataBase: new URL(SITE),
    applicationName: 'Índice Filtra.AI',
    authors: [{ name: 'Filtra.AI' }],
    publisher: 'Filtra.AI',
    openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Filtra.AI' }] },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE] },
    // Amostra sintética nunca deve ser indexada.
    robots: meta.sintetico ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  return (
    <html lang="pt-BR">
      <body>
        {meta.sintetico && <div className="amostra">DADOS SINTÉTICOS DE DESENVOLVIMENTO. NÃO PUBLICAR. NÃO REPRESENTAM A REALIDADE.</div>}
        <SiteHeader />
        <div className="wrap">
          <main>{children}</main>
        </div>
        <footer className="rodape">
          <div className="wrap rodape-in">
            <BrandMark size="sm" uid="rodape" />
            <div className="rodape-texto">
              <p>
                Índice Filtra.AI: contagens agregadas do cadastro aberto de CNPJ da Receita Federal, competência {mesPorExtenso(meta.competencia)}.
                Sem dados pessoais. <Link href="/metodologia">Como calculamos</Link>.
              </p>
              <p>
                <a href="https://filtraai.com/">Filtra.AI</a> · <a href="https://filtraai.com/gestao-de-reputacao-online">Gestão de reputação online</a> ·{' '}
                <a href="https://filtraai.com/avaliacoes-google">Avaliações Google</a> · <a href="https://filtraai.com/privacidade">Privacidade</a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
