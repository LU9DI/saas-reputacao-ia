import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { usMeta, usCounty, usSegmentsOfCounty, stateFromSlug } from '@/lib/us';
import { nEn as n, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string; county: string }> };
export const revalidate = 86400;
export async function generateStaticParams() { return []; }

function resolve(state: string, county: string) {
  const s = stateFromSlug(state);
  if (!s) return null;
  const c = usCounty(s.abbr, county);
  const segs = c ? usSegmentsOfCounty(s.abbr, county) : [];
  return c && segs.length ? { s, c, segs } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, county } = await params;
  const r = resolve(state, county);
  if (!r) return { robots: { index: false } };
  const total = r.segs.reduce((t, x) => t + x.reg.e, 0);
  const title = `Businesses by industry in ${r.c.name}, ${r.s.abbr}`;
  const description = corta(`How many establishments are in ${r.c.name}, ${r.s.abbr} across ${r.segs.length} industries: ${n(total)} in total (County Business Patterns, ${usMeta().year}).`, 158);
  const url = urlAbsoluta(`/en/${state}/${county}`);
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state, county } = await params;
  const r = resolve(state, county);
  if (!r) notFound();
  const { s, c, segs } = r;
  const total = segs.reduce((t, x) => t + x.reg.e, 0);
  const top = segs[0];
  const year = usMeta().year;
  const faq = [
    { pergunta: `Which industry has the most establishments in ${c.name}, ${s.abbr}?`, resposta: `Among the ${segs.length} industries tracked, ${top.seg.short} has the most in ${c.name}: ${n(top.reg.e)} establishments, according to the U.S. Census Bureau's County Business Patterns (${year}).` },
    { pergunta: `How many establishments are in ${c.name} across the industries tracked?`, resposta: `${n(total)} establishments across the ${segs.length} industries with enough data to publish. This is not the total number of businesses in the county, only the industries tracked.` },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Index', caminho: '/en' }, { nome: s.name, caminho: `/en/${state}` }, { nome: c.name, caminho: `/en/${state}/${county}` }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'Index', href: '/en' }, { nome: s.name, href: `/en/${state}` }, { nome: c.name }]} />
      <h1>Businesses by industry in {c.name}, {s.abbr}</h1>
      <p className="lead">{c.name}, {s.name} has {n(total)} establishments in the {segs.length} industries tracked by the Index ({year}, County Business Patterns). The largest is {top.seg.short}, with {n(top.reg.e)}.</p>
      <table>
        <thead><tr><th>Industry</th><th className="num">Establishments</th></tr></thead>
        <tbody>
          {segs.map(({ seg, reg }) => (
            <tr key={seg.slug}><td><Link href={`/en/${state}/${county}/${seg.slug}`}>{seg.name}</Link></td><td className="num">{n(reg.e)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="nota">Establishments with paid employees. <Link href="/en/methodology">Methodology</Link>.</p>
      <Cta campanha={`en-${state}-${county}`} botao="Get a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Customers in ${c.name} compare ratings and reviews before they choose. See how your business looks on Google.`} />
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
