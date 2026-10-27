import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUS, usMeta, usSegmentos, usCondadosDoEstado, usTopCondados, usTotalSeg } from '@/lib/us';
import { ESTADOS_US, siglaDeSlug } from '@/lib/us-states';
import { nUS, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(state: string) {
  if (!temDadosUS()) return null;
  const sigla = siglaDeSlug(state);
  if (!sigla) return null;
  const condados = usCondadosDoEstado(sigla);
  return condados.length ? { sigla, nome: ESTADOS_US[sigla], condados } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const r = resolver(state);
  if (!r) return { robots: { index: false } };
  const meta = usMeta();
  const titulo = `Businesses by county and category in ${r.nome}`;
  const descricao = corta(`Establishments with paid employees (restaurants, clinics, hotels, gyms and more) in ${r.condados.length} counties of ${r.nome}, from Census Bureau CBP ${meta.ano}.`, 158);
  const url = urlAbsoluta(`/us/${state}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state } = await params;
  const r = resolver(state);
  if (!r) notFound();
  const meta = usMeta();
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'US Index', caminho: '/us' }, { nome: r.nome, caminho: `/us/${state}` }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'US Index', href: '/us' }, { nome: r.nome }]} />
      <h1>Businesses by county and category in {r.nome}</h1>
      <p className="lead">
        The US Index tracks {usSegmentos().length} categories across {nUS(r.condados.length)} counties of {r.nome}, using the Census Bureau&apos;s County Business Patterns ({meta.ano}).
        Counts are establishments with paid employees. See the counties with the most establishments in each category.
      </p>
      {usSegmentos().map((seg) => {
        const top = usTopCondados(seg.slug, 10, r.sigla);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome} in {r.nome}: {nUS(usTotalSeg(seg.slug, r.sigla))} establishments</h2>
            <ul className="lista">
              {top.map(({ county, e }) => (
                <li key={county.slug}><Link href={`/us/${state}/${county.slug}/${seg.slug}`}>{county.nome}</Link><span>{nUS(e)}</span></li>
              ))}
            </ul>
          </section>
        );
      })}
      <h2>All counties of {r.nome} in the Index</h2>
      <ul className="grade">
        {r.condados.map(({ county, total, segmentos }) => (
          <li key={county.slug}><Link href={`/us/${state}/${county.slug}`}>{county.nome}<small>{nUS(total)} establishments in {segmentos} {segmentos === 1 ? 'category' : 'categories'}</small></Link></li>
        ))}
      </ul>
      <Cta campanha={`us-${state}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Do you operate in ${r.nome}? See how your business looks in Google reviews.`} />
    </>
  );
}
