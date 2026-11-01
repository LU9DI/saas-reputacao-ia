import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUS, usMeta, usSegmentos, usMinimo } from '@/lib/us';
import { nUS } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'US Index methodology: source, definitions and limits';
const descricao = 'How the Filtra.AI US Index counts establishments with paid employees by county and category from Census Bureau County Business Patterns, and what the numbers do not show.';

export function generateMetadata(): Metadata {
  if (!temDadosUS()) return { robots: { index: false } };
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: urlAbsoluta('/us/methodology') },
    openGraph: { title: titulo, description: descricao, url: urlAbsoluta('/us/methodology'), type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  if (!temDadosUS()) notFound();
  const meta = usMeta();
  const faq = [
    { pergunta: 'Where do the numbers come from?', resposta: `From the U.S. Census Bureau's County Business Patterns (CBP), reference year ${meta.ano}. Filtra.AI only aggregates: it sums establishments by county and category.` },
    { pergunta: 'Are businesses without employees included?', resposta: 'No. CBP covers establishments with paid employees. Self-employed people and owner-only businesses are not counted, so real business counts can be higher, especially for salons and repair shops.' },
    { pergunta: 'Why are some counties missing?', resposta: `Only county and category combinations with at least ${nUS(usMinimo())} establishments are published, to avoid pages with almost no information.` },
    { pergunta: 'Is employment exact?', resposta: 'No. The Census Bureau adds statistical noise to employment and payroll to protect confidentiality, so employment is shown as approximate. Establishment counts are not noised.' },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'US Index', caminho: '/us' }, { nome: 'Methodology', caminho: '/us/methodology' }])} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Dataset',
        name: 'Filtra.AI US Index: establishments by county and category',
        description: descricao, url: urlAbsoluta('/us/methodology'), inLanguage: 'en',
        dateModified: meta.geradoEm, temporalCoverage: meta.ano, isBasedOn: meta.fonte.url, creator: publisher, publisher,
      }} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'US Index', href: '/us' }, { nome: 'Methodology' }]} />
      <h1>US Index methodology</h1>
      <p className="lead">
        The US Index aggregates <a href={meta.fonte.url} rel="noopener">{meta.fonte.nome}</a> into counts by county and category. Reference year: {meta.ano}.
        Data processed on {meta.geradoEm.slice(0, 10)}.
      </p>
      <h2>Definitions</h2>
      <ul>
        <li><strong>Establishment:</strong> a single physical location of a business with at least one paid employee, as defined by the Census Bureau.</li>
        <li><strong>Category:</strong> defined by the establishment&apos;s main industry code (NAICS), listed below.</li>
        <li><strong>Size:</strong> number of employees at the establishment, in the size classes published by the Census Bureau.</li>
      </ul>
      <h2>Categories and NAICS codes</h2>
      <table>
        <thead><tr><th>Category</th><th>NAICS code(s)</th></tr></thead>
        <tbody>
          {usSegmentos().map((s) => <tr key={s.slug}><td>{s.nome}</td><td>{s.naics.map((c) => c.replace(/\//g, '')).join(', ')}</td></tr>)}
        </tbody>
      </table>
      <h2>What the numbers do not show</h2>
      <ul>
        <li>They do not include businesses without paid employees.</li>
        <li>They do not measure revenue, quality or reputation, only the existence of establishments.</li>
        <li>The data lag: the latest CBP release is typically about two years behind.</li>
        <li>Employment figures are approximate because of statistical noise.</li>
      </ul>
      <h2>How to cite</h2>
      <p>&ldquo;Filtra.AI US Index, based on U.S. Census Bureau County Business Patterns {meta.ano}. filtraai.com/indice/us&rdquo;. See also <Link href="/us">the index home</Link>.</p>
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
