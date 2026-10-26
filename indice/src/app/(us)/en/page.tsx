import type { Metadata } from 'next';
import Link from 'next/link';
import { usMeta, usSegments, usStatesWithData, usTopCounties, usSegmentTotal, stateSlug } from '@/lib/us';
import { nEn as n } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

export const revalidate = 86400;
const title = 'Filtra.AI Index: how many businesses are there by county and industry';

export function generateMetadata(): Metadata {
  const m = usMeta();
  const description = `Establishment counts for restaurants, clinics, hotels, gyms and more across U.S. counties, by state (County Business Patterns, ${m.year}).`;
  return {
    title: { absolute: title }, description, alternates: { canonical: urlAbsoluta('/en') },
    openGraph: { title, description, url: urlAbsoluta('/en'), type: 'website', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  };
}

export default function Page() {
  const m = usMeta();
  const states = usStatesWithData();
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Index', caminho: '/en' }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'Index' }]} />
      <h1>Filtra.AI Index: how many businesses are there by county and industry</h1>
      <p className="lead">
        Establishment counts in {usSegments().length} industries across {n(states.reduce((t, s) => t + s.counties, 0))} U.S. counties, from the U.S. Census Bureau&apos;s
        County Business Patterns ({m.year}). Aggregated figures only. <Link href="/en/methodology">See how we calculate</Link>.
      </p>
      <h2>Choose a state</h2>
      <ul className="grade">
        {states.map((s) => (
          <li key={s.abbr}><Link href={`/en/${stateSlug(s.abbr)}`}>{s.name}<small>{n(s.counties)} counties</small></Link></li>
        ))}
      </ul>
      {usSegments().map((seg) => {
        const top = usTopCounties(seg.slug, 10);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.name}: {n(usSegmentTotal(seg.slug))} establishments in the counties listed</h2>
            <ul className="lista">
              {top.map(({ county, e }) => (
                <li key={`${county.state}-${county.slug}`}>
                  <Link href={`/en/${stateSlug(county.state)}/${county.slug}/${seg.slug}`}>{county.name}, {county.state}</Link>
                  <span>{n(e)} establishments</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Cta campanha="en-home" botao="Get a free review audit" destino="https://filtraai.com/en/free-review-audit" texto="Customers compare businesses in the same industry before they choose. See how your business looks on Google." />
    </>
  );
}
