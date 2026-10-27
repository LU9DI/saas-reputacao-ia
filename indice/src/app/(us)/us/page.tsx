import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUS, usMeta, usSegmentos, usTopCondados, usTotalSeg, usEstadosComDados } from '@/lib/us';
import { slugEstado } from '@/lib/us-states';
import { nUS } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

export const revalidate = 86400;
const titulo = 'Filtra.AI US Index: how many businesses are there by county and category';

export function generateMetadata(): Metadata {
  if (!temDadosUS()) return { robots: { index: false } };
  const meta = usMeta();
  const descricao = `Establishments with paid employees (restaurants, clinics, hotels, gyms and more) by U.S. county, from Census Bureau County Business Patterns ${meta.ano}.`;
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: urlAbsoluta('/us') },
    openGraph: { title: titulo, description: descricao, url: urlAbsoluta('/us'), type: 'website', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  if (!temDadosUS()) notFound();
  const meta = usMeta();
  const estados = usEstadosComDados();
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'US Index', caminho: '/us' }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'US Index' }]} />
      <h1>Filtra.AI US Index: how many businesses are there by county and category</h1>
      <p className="lead">
        Counts of establishments with paid employees in {usSegmentos().length} categories across {nUS(estados.reduce((t, e) => t + e.condados, 0))} U.S. counties,
        from the Census Bureau&apos;s County Business Patterns ({meta.ano}). Aggregated numbers only, no company names.{' '}
        <Link href="/us/methodology">See how we calculate</Link>.
      </p>
      <h2>Choose a state</h2>
      <ul className="grade">
        {estados.map((e) => (
          <li key={e.sigla}><Link href={`/us/${e.slug}`}>{e.nome}<small>{nUS(e.condados)} counties</small></Link></li>
        ))}
      </ul>
      {usSegmentos().map((seg) => {
        const top = usTopCondados(seg.slug, 10);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome}: {nUS(usTotalSeg(seg.slug))} establishments in the US</h2>
            <ul className="lista">
              {top.map(({ county, e }) => (
                <li key={`${county.state}-${county.slug}`}>
                  <Link href={`/us/${slugEstado(county.state)}/${county.slug}/${seg.slug}`}>{county.nome}, {county.state}</Link>
                  <span>{nUS(e)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Cta campanha="us-home" botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto="Customers compare businesses in the same category by their Google reviews. See how yours looks." />
    </>
  );
}
