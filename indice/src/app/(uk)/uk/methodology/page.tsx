import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUK, ukMeta, ukSegmentos, ukMinimo } from '@/lib/uk';
import { nUS } from '@/lib/format';
import { JsonLd, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'UK Index methodology: source, definitions and limits';
const descricao = 'How the Filtra.AI UK Index counts local units (business sites) by local authority and category from ONS UK Business Counts, and what the numbers do not show.';

export function generateMetadata(): Metadata {
  if (!temDadosUK()) return { robots: { index: false } };
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: urlAbsoluta('/uk/methodology') },
    openGraph: { title: titulo, description: descricao, url: urlAbsoluta('/uk/methodology'), type: 'article', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  if (!temDadosUK()) notFound();
  const meta = ukMeta();
  const faq = [
    { pergunta: 'Where do the numbers come from?', resposta: `From the Office for National Statistics UK Business Counts, reference year ${meta.ano}, published through the Nomis service (dataset NM_141_1, local units). Filtra.AI only aggregates: it selects UK SIC 2007 classes and groups them into categories by local authority.` },
    { pergunta: 'Does the index count businesses or local units?', resposta: 'It counts local units: individual sites or workplaces registered for VAT and/or PAYE. A business with three shops contributes three local units. This is the NM_141_1 series, not the NM_142_1 enterprises series.' },
    { pergunta: 'What is a local unit?', resposta: 'An individual site or workplace of a business that is registered for VAT and/or PAYE. A business with three shops has three local units. Self-employed people and businesses under the VAT threshold with no employees may not be registered, so they are not counted.' },
    { pergunta: 'Why are the numbers multiples of 5?', resposta: 'The ONS rounds Business Counts to the nearest 5 to protect confidentiality. Filtra.AI shows the rounded figures and never tries to reverse them.' },
    { pergunta: 'Why are some local authorities missing?', resposta: `Only local authority and category combinations with at least ${nUS(ukMinimo())} local units are published, to avoid pages with almost no information.` },
    { pergunta: 'Why is a size breakdown sometimes unavailable?', resposta: 'The ONS withholds some size classes to protect confidentiality. Missing classes are shown as “Not available”, never as zero, and no share is calculated from an incomplete distribution. The local-unit total is still shown when it is published.' },
  ];
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Dataset',
        name: 'Filtra.AI UK Index: local units by local authority and category',
        description: descricao, url: urlAbsoluta('/uk/methodology'), inLanguage: 'en-GB',
        license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        dateModified: meta.geradoEm, temporalCoverage: meta.ano, isBasedOn: meta.fonte.url, creator: publisher, publisher,
      }} />
      <Migalhas indice caminhoAtual="/uk/methodology" rotulo="You are here" itens={[{ nome: 'UK Index', href: '/uk' }, { nome: 'Methodology' }]} />
      <h1>UK Index methodology</h1>
      <p className="lead">
        The UK Index aggregates <a href={meta.fonte.url} rel="noopener">{meta.fonte.nome}</a> into counts of local units (business sites) by local authority and category. Reference year: {meta.ano}.
        Data processed on {meta.geradoEm.slice(0, 10)}.
      </p>
      <h2>Definitions</h2>
      <ul>
        <li><strong>Business site (local unit):</strong> an individual site of a business registered for VAT and/or PAYE, as defined by the ONS.</li>
        <li><strong>Category:</strong> defined by the site&apos;s main industry code (UK SIC 2007, five digits), listed below.</li>
        <li><strong>Size:</strong> number of employees at the site, in the size classes published by the ONS.</li>
        <li><strong>Local authority:</strong> district, unitary authority or equivalent in England, Scotland, Wales and Northern Ireland.</li>
      </ul>
      <h2>Categories and SIC codes</h2>
      <table>
        <thead><tr><th>Category</th><th>UK SIC 2007 code(s)</th></tr></thead>
        <tbody>
          {ukSegmentos().map((s) => <tr key={s.slug}><td>{s.nome}</td><td>{s.sic.join(', ')}</td></tr>)}
        </tbody>
      </table>
      <h2>What the numbers do not show</h2>
      <ul>
        <li>They do not include businesses that are not registered for VAT or PAYE.</li>
        <li>They are rounded to the nearest 5, so small differences between areas are not meaningful.</li>
        <li>They do not measure revenue, quality or reputation, only the existence of sites.</li>
        <li>Agricultural data come from separate surveys and are not part of this index.</li>
        <li>Some size classes are withheld by the ONS. Missing values are not zero, and an incomplete distribution is not used to calculate shares.</li>
      </ul>
      <h2>Licence and how to cite</h2>
      <p>Contains public sector information licensed under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="noopener">Open Government Licence v3.0</a>. Cite as &ldquo;Filtra.AI UK Index, based on ONS UK Business Counts {meta.ano}. filtraai.com/indice/uk&rdquo;. See also <Link href="/uk">the index home</Link>.</p>
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
