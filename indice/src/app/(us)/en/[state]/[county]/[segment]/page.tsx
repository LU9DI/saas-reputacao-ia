import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { usMeta, usPage, usSegmentsOfCounty, usTopCounties, stateFromSlug, stateSlug } from '@/lib/us';
import { nEn as n, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string; county: string; segment: string }> };
export const revalidate = 86400;
export async function generateStaticParams() { return []; }

const BIN_LABEL: Record<string, string> = {
  'n<5': 'Fewer than 5 employees', n5_9: '5 to 9', n10_19: '10 to 19', n20_49: '20 to 49', n50_99: '50 to 99',
  n100_249: '100 to 249', n250_499: '250 to 499', n500_999: '500 to 999', n1000: '1,000 or more',
};

function resolve(state: string, county: string, segment: string) {
  const s = stateFromSlug(state);
  if (!s) return null;
  const p = usPage(s.abbr, county, segment);
  return p ? { s, p } : null;
}

/** Fonte única dos textos: título, descrição, lead e FAQ saem daqui, então não divergem. */
function texts(p: NonNullable<ReturnType<typeof usPage>>, stateName: string, abbr: string) {
  const year = usMeta().year;
  const { county: c, seg, reg } = p;
  const title = `${seg.name} in ${c.name}, ${abbr}: how many (${year})`;
  const lead = `${c.name}, ${stateName} had ${n(reg.e)} establishments in ${seg.short} in ${year}, ranking ${p.rankState} of ${p.totalState} counties in ${stateName} and ${n(p.rankUS)} of ${n(p.totalUS)} in the United States, according to the U.S. Census Bureau's County Business Patterns.`;
  const description = corta(`${c.name}, ${abbr}: ${n(reg.e)} establishments in ${seg.short} (${year}), ranked ${p.rankState} of ${p.totalState} in ${stateName}. Source: County Business Patterns.`, 158);
  const faq = [
    { pergunta: `How many ${seg.short} establishments are in ${c.name}, ${abbr}?`, resposta: `${c.name} had ${n(reg.e)} establishments in ${seg.short} in ${year}, according to the U.S. Census Bureau's County Business Patterns. The count covers establishments with paid employees.` },
    { pergunta: `How does ${c.name} rank for ${seg.short} in ${stateName}?`, resposta: `It ranks ${p.rankState} of ${p.totalState} counties in ${stateName} and ${n(p.rankUS)} of ${n(p.totalUS)} in the United States, among counties with at least ${usMeta().minimumToIndex} establishments in this industry.` },
    { pergunta: `Where does this data come from?`, resposta: `From the Census Bureau's County Business Patterns for ${year}. Filtra.AI only counts and ranks the published figures; it adds no names or contact details of any business.` },
  ];
  return { year, title, lead, description, faq };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, county, segment } = await params;
  const r = resolve(state, county, segment);
  if (!r) return { robots: { index: false } };
  const t = texts(r.p, r.s.name, r.s.abbr);
  const url = urlAbsoluta(`/en/${state}/${county}/${segment}`);
  return {
    title: { absolute: t.title }, description: t.description, alternates: { canonical: url },
    openGraph: { title: t.title, description: t.description, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.title, description: t.description, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state, county, segment } = await params;
  const r = resolve(state, county, segment);
  if (!r) notFound();
  const { s, p } = r;
  const t = texts(p, s.name, s.abbr);
  const { county: c, seg, reg } = p;
  const path = `/en/${state}/${county}/${segment}`;
  const meta = usMeta();
  const bins = meta.sizeBins.map((b) => ({ b, v: reg.f[b] || 0 })).filter((x) => x.v > 0);
  const maxBin = Math.max(1, ...bins.map((x) => x.v));
  const others = usTopCounties(segment, 11, s.abbr).filter((x) => x.county.slug !== county).slice(0, 10);
  const sameCounty = usSegmentsOfCounty(s.abbr, county).filter((x) => x.seg.slug !== segment);

  const dataset = {
    '@context': 'https://schema.org', '@type': 'Dataset', '@id': `${urlAbsoluta(path)}#data`,
    name: `${seg.name} in ${c.name}, ${s.abbr}: establishments by employment size`,
    description: t.lead, url: urlAbsoluta(path), inLanguage: 'en', isAccessibleForFree: true,
    creator: publisher, publisher,
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    isBasedOn: { '@type': 'Dataset', name: meta.source.name, url: meta.source.url, publisher: { '@type': 'GovernmentOrganization', name: 'U.S. Census Bureau' } },
    dateModified: meta.generatedAt.slice(0, 10), temporalCoverage: String(meta.year),
    spatialCoverage: { '@type': 'Place', name: `${c.name}, ${s.name}, United States` },
    measurementTechnique: `Count of establishments with paid employees by NAICS code (${seg.naics.join(', ')}) and county.`,
    variableMeasured: [{ '@type': 'PropertyValue', name: 'Establishments', value: reg.e, unitText: 'establishments' }],
  };

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb([{ nome: 'Index', caminho: '/en' }, { nome: s.name, caminho: `/en/${state}` }, { nome: c.name, caminho: `/en/${state}/${county}` }, { nome: seg.name, caminho: path }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'Index', href: '/en' }, { nome: s.name, href: `/en/${state}` }, { nome: c.name, href: `/en/${state}/${county}` }, { nome: seg.name }]} />
      <h1>{seg.name} in {c.name}, {s.abbr}</h1>
      <p className="lead">{t.lead}</p>
      <div className="cards">
        <div className="card"><strong>{n(reg.e)}</strong><span>establishments ({t.year})</span></div>
        <div className="card"><strong>{p.rankState}</strong><span>of {p.totalState} counties in {s.name}</span></div>
        <div className="card"><strong>{n(p.rankUS)}</strong><span>of {n(p.totalUS)} in the U.S.</span></div>
      </div>

      {bins.length > 0 && (
        <section>
          <h2>Establishments by number of employees</h2>
          <table>
            <thead><tr><th>Employees per establishment</th><th className="num">Establishments</th><th>Share</th></tr></thead>
            <tbody>
              {bins.map(({ b, v }) => (
                <tr key={b}>
                  <td>{BIN_LABEL[b] || b}</td><td className="num">{n(v)}</td>
                  <td><span className="barra" style={{ width: `${Math.max(2, Math.round((v / maxBin) * 100))}%` }} aria-hidden="true" /> {Math.round((v / reg.e) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2>Other counties in {s.name}</h2>
          <ul className="lista">
            {others.map(({ county: oc, e }) => (
              <li key={oc.slug}><Link href={`/en/${stateSlug(oc.state)}/${oc.slug}/${segment}`}>{oc.name}</Link><span>{n(e)} establishments</span></li>
            ))}
          </ul>
        </section>
      )}
      {sameCounty.length > 0 && (
        <section>
          <h2>Other industries in {c.name}</h2>
          <ul className="lista">
            {sameCounty.map(({ seg: os, reg: or }) => (
              <li key={os.slug}><Link href={`/en/${state}/${county}/${os.slug}`}>{os.name}</Link><span>{n(or.e)} establishments</span></li>
            ))}
          </ul>
        </section>
      )}
      <Cta campanha={`en-${state}-${county}-${segment}`} botao="Get a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`With ${n(reg.e)} establishments in ${seg.short} in ${c.name}, customers compare before choosing. See how your business looks on Google.`} />
      <Faq titulo="Frequently asked questions" itens={t.faq} />
      <p className="nota">
        Source: <a href={meta.source.url} rel="noopener">{meta.source.name}</a>, {meta.year}. Counts establishments with paid employees; excludes most self-employed businesses and most government employees.{' '}
        <Link href="/en/methodology">Methodology</Link>.
      </p>
    </>
  );
}
