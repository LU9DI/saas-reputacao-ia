import type { Metadata } from 'next';
import { usMeta, usSegments, usMin } from '@/lib/us';
import { nEn as n } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Migalhas } from '@/components/Migalhas';

const title = 'Filtra.AI Index methodology: source, industries and limits';
const description = 'How the Index counts establishments by county and industry from the Census Bureau County Business Patterns, and what the numbers do not show.';
export const metadata: Metadata = {
  title: { absolute: title }, description, alternates: { canonical: urlAbsoluta('/en/methodology') },
  openGraph: { title, description, url: urlAbsoluta('/en/methodology'), type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
};

export default function Page() {
  const m = usMeta();
  const faq = [
    { pergunta: 'Where do the numbers come from?', resposta: `From the U.S. Census Bureau's County Business Patterns for ${m.year}. Filtra.AI only aggregates and ranks the published counts.` },
    { pergunta: 'Is this every business in the county?', resposta: 'No. County Business Patterns covers establishments with paid employees. It excludes most self-employed businesses and most government employees, so real totals are higher.' },
    { pergunta: 'Why do some counties have no page for an industry?', resposta: `We only publish combinations with at least ${usMin()} establishments, because very small counts say little.` },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Index', caminho: '/en' }, { nome: 'Methodology', caminho: '/en/methodology' }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Dataset', name: 'Filtra.AI Index: establishments by county and industry', description, url: urlAbsoluta('/en/methodology'), inLanguage: 'en', dateModified: m.generatedAt.slice(0, 10), temporalCoverage: String(m.year), isBasedOn: m.source.url, license: 'https://creativecommons.org/publicdomain/zero/1.0/', creator: publisher, publisher }} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'Index', href: '/en' }, { nome: 'Methodology' }]} />
      <h1>Filtra.AI Index methodology</h1>
      <p className="lead">The Index aggregates the U.S. Census Bureau&apos;s <a href={m.source.url} rel="noopener">County Business Patterns</a> ({m.year}) into establishment counts by county and industry. Data prepared {new Date(m.generatedAt).toLocaleDateString('en-US')}.</p>
      <h2>What is counted</h2>
      <p>Establishments with paid employees, classified by NAICS industry code, and the number of establishments in each employment-size class. Employment and payroll figures are not used.</p>
      <h2>Industries and NAICS codes</h2>
      <table>
        <thead><tr><th>Industry</th><th>NAICS</th></tr></thead>
        <tbody>{usSegments().map((s) => (<tr key={s.slug}><td>{s.name}</td><td>{s.naics.join(', ')}</td></tr>))}</tbody>
      </table>
      <p className="nota">Where the Census Bureau changed a code between NAICS versions (for example pharmacies), the code valid for the data year is used.</p>
      <h2>Minimum size and privacy</h2>
      <p>Pages exist only for counties with at least {usMin()} establishments in the industry. No business names, addresses or contact details are used.</p>
      <h2>Limits</h2>
      <ul>
        <li>Counts show how many establishments exist, not how good they are.</li>
        <li>The latest available data year is {m.year}, so figures can lag current conditions.</li>
        <li>Self-employed businesses are not included.</li>
        {m.linesRead ? <li>This release read {n(m.linesRead)} rows, of which {n(m.linesInScope ?? 0)} fell in the industries tracked.</li> : null}
      </ul>
      <h2>How to cite</h2>
      <p>&ldquo;Filtra.AI Index, based on U.S. Census Bureau County Business Patterns, {m.year}. filtraai.com/indice/en&rdquo;.</p>
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
