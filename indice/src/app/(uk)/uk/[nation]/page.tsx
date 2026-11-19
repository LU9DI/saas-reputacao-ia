import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUK, ukMeta, ukSegmentos, ukAutoridadesDaNacao, ukTopAutoridades, ukTotalSeg } from '@/lib/uk';
import { NACOES_UK, slugNacao } from '@/lib/uk-nations';
import { nUS, corta } from '@/lib/format';
import { urlAbsoluta, OG_IMAGE, JsonLd, datasetDoRecorteUK } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ nation: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(nation: string) {
  if (!temDadosUK()) return null;
  const slug = slugNacao(nation);
  if (!slug) return null;
  const autoridades = ukAutoridadesDaNacao(slug);
  return autoridades.length ? { slug, nome: NACOES_UK[slug], autoridades } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nation } = await params;
  const r = resolver(nation);
  if (!r) return { robots: { index: false } };
  const meta = ukMeta();
  const titulo = `Businesses by local authority and category in ${r.nome}`;
  const descricao = corta(`Business sites (restaurants, pubs, clinics, gyms and more) in ${r.autoridades.length} local authorities of ${r.nome}, from ONS UK Business Counts ${meta.ano}.`, 158);
  const url = urlAbsoluta(`/uk/${nation}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { nation } = await params;
  const r = resolver(nation);
  if (!r) notFound();
  const meta = ukMeta();
  const total = r.autoridades.reduce((t, c) => t + c.total, 0);
  return (
    <>
      <JsonLd
        data={datasetDoRecorteUK({
          url: urlAbsoluta(`/uk/${nation}`),
          name: `Businesses by local authority and category in ${r.nome}`,
          description: `Business sites in ${r.autoridades.length} local authorities of ${r.nome}, by category, from the ONS UK Business Counts ${meta.ano}, rounded to the nearest 5.`,
          espacial: `${r.nome}, United Kingdom`,
          meta,
          variaveis: [
            { nome: 'Business sites in published categories', valor: total, unidade: 'local units' },
            { nome: 'Local authorities with published pages', valor: r.autoridades.length, unidade: 'local authorities' },
            { nome: 'Categories tracked', valor: ukSegmentos().length, unidade: 'categories' },
          ],
        })}
      />
      <Migalhas indice caminhoAtual={`/uk/${nation}`} rotulo="You are here" itens={[{ nome: 'UK Index', href: '/uk' }, { nome: r.nome }]} />
      <h1>Businesses by local authority and category in {r.nome}</h1>
      <p className="lead">
        The UK Index tracks {ukSegmentos().length} categories across {nUS(r.autoridades.length)} local authorities of {r.nome}, using the ONS UK Business Counts ({meta.ano}).
        Counts are business sites, rounded to the nearest 5. See the local authorities with the most sites in each category.
      </p>
      <p className="nota">
        Browse the <Link href="/uk">UK Index</Link> for every nation, or open a local authority hub below to see all categories.
      </p>
      {ukSegmentos().map((seg) => {
        const top = ukTopAutoridades(seg.slug, 5, r.slug);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome} in {r.nome}: about {nUS(ukTotalSeg(seg.slug, r.slug))} sites</h2>
            <ul className="lista">
              {top.map(({ auth, e }) => (
                <li key={auth.slug}><Link href={`/uk/${nation}/${auth.slug}/${seg.slug}`}>{auth.nome}</Link><span>{nUS(e)}</span></li>
              ))}
            </ul>
          </section>
        );
      })}
      <h2>All local authorities of {r.nome} in the Index</h2>
      <ul className="grade">
        {r.autoridades.map(({ auth, total, segmentos }) => (
          <li key={auth.slug}><Link href={`/uk/${nation}/${auth.slug}`}>{auth.nome}<small>about {nUS(total)} sites in {segmentos} {segmentos === 1 ? 'category' : 'categories'}</small></Link></li>
        ))}
      </ul>
      <Cta campanha={`uk-${nation}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Do you operate in ${r.nome}? See how your business looks in Google reviews.`} />
    </>
  );
}
