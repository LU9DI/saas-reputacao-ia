import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { usMeta, usSegments, usCountiesOfState, usTopCounties, usSegmentTotal, stateFromSlug, stateSlug } from '@/lib/us';
import { nEn as n, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string }> };
export const revalidate = 86400;
export async function generateStaticParams() { return []; }

function resolve(slug: string) {
  const s = stateFromSlug(slug);
  if (!s) return null;
  const counties = usCountiesOfState(s.abbr);
  return counties.length ? { s, counties } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const r = resolve(state);
  if (!r) return { robots: { index: false } };
  const title = `Businesses by county and industry in ${r.s.name}`;
  const description = corta(`Establishment counts for restaurants, clinics, hotels, gyms and more across ${r.counties.length} counties in ${r.s.name} (County Business Patterns, ${usMeta().year}).`, 158);
  const url = urlAbsoluta(`/en/${state}`);
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state } = await params;
  const r = resolve(state);
  if (!r) notFound();
  const { s, counties } = r;
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Index', caminho: '/en' }, { nome: s.name, caminho: `/en/${state}` }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'Index', href: '/en' }, { nome: s.name }]} />
      <h1>Businesses by county and industry in {s.name}</h1>
      <p className="lead">
        The Index tracks {usSegments().length} industries in {n(counties.length)} counties of {s.name}, using the U.S. Census Bureau&apos;s County Business Patterns ({usMeta().year}).
        Below are the counties with the most establishments in each industry.
      </p>
      {usSegments().map((seg) => {
        const top = usTopCounties(seg.slug, 10, s.abbr);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.name} in {s.name}: {n(usSegmentTotal(seg.slug, s.abbr))} establishments</h2>
            <ul className="lista">
              {top.map(({ county, e }) => (
                <li key={county.slug}><Link href={`/en/${state}/${county.slug}/${seg.slug}`}>{county.name}</Link><span>{n(e)} establishments</span></li>
              ))}
            </ul>
          </section>
        );
      })}
      <h2>All counties in {s.name} in the Index</h2>
      <ul className="grade">
        {counties.map(({ county, total, segments }) => (
          <li key={county.slug}><Link href={`/en/${state}/${county.slug}`}>{county.name}<small>{n(total)} establishments in {segments} {segments === 1 ? 'industry' : 'industries'}</small></Link></li>
        ))}
      </ul>
      <Cta campanha={`en-${state}`} botao="Get a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Do business in ${s.name}? See how your reputation looks on Google.`} />
    </>
  );
}
