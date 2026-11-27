import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUK, ukMeta, ukSegmentos, ukTopAutoridades, ukTotalSeg, ukNacoesComDados } from '@/lib/uk';
import { NACOES_UK } from '@/lib/uk-nations';
import { nUS } from '@/lib/format';
import { ate } from '@/lib/rotulos';
import { urlAbsoluta, OG_IMAGE, JsonLd, datasetDoRecorteUK } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

export const revalidate = 86400;
const tituloMeta = ate(
  60,
  'Filtra.AI UK Index: businesses by local authority and category',
  'Filtra.AI UK Index: businesses by local authority',
  'Filtra.AI UK Index: businesses',
);

export function generateMetadata(): Metadata {
  if (!temDadosUK()) return { robots: { index: false } };
  const meta = ukMeta();
  const descricao = `Business sites (restaurants, pubs, dentists, hairdressers, gyms and more) by UK local authority, from ONS UK Business Counts ${meta.ano}, rounded to the nearest 5.`;
  return {
    title: { absolute: tituloMeta },
    description: descricao,
    alternates: { canonical: urlAbsoluta('/uk') },
    openGraph: { title: tituloMeta, description: descricao, url: urlAbsoluta('/uk'), type: 'website', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: tituloMeta, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  if (!temDadosUK()) notFound();
  const meta = ukMeta();
  const nacoes = ukNacoesComDados();
  const total = ukSegmentos().reduce((t, seg) => t + ukTotalSeg(seg.slug), 0);
  const nAuth = nacoes.reduce((t, n) => t + n.autoridades, 0);
  return (
    <>
      <JsonLd
        data={datasetDoRecorteUK({
          url: urlAbsoluta('/uk'),
          name: 'Filtra.AI UK Index: business sites by local authority and category',
          description: `Business sites in the ${ukSegmentos().length} categories tracked by the UK Index, aggregated by local authority from the ONS UK Business Counts ${meta.ano}, rounded to the nearest 5.`,
          espacial: 'United Kingdom',
          meta,
          variaveis: [
            { nome: 'Business sites in published categories', valor: total, unidade: 'local units' },
            { nome: 'Local authorities with published pages', valor: nAuth, unidade: 'local authorities' },
            { nome: 'Categories tracked', valor: ukSegmentos().length, unidade: 'categories' },
          ],
        })}
      />
      <Migalhas indice caminhoAtual="/uk" rotulo="You are here" itens={[{ nome: 'UK Index' }]} />
      <h1>Filtra.AI UK Index: how many businesses are there by local authority and category</h1>
      <p className="lead">
        Counts of business sites in {ukSegmentos().length} categories across {nUS(nAuth)} UK local authorities, from the Office for National Statistics
        UK Business Counts ({meta.ano}), rounded to the nearest 5. Aggregated numbers only, no company names.{' '}
        <Link href="/uk/methodology">See how we calculate</Link>.
      </p>
      <h2>Choose a nation</h2>
      <ul className="grade">
        {nacoes.map((n) => (
          <li key={n.slug}><Link href={`/uk/${n.slug}`}>{NACOES_UK[n.slug]}<small>{nUS(n.autoridades)} local {n.autoridades === 1 ? 'authority' : 'authorities'}</small></Link></li>
        ))}
      </ul>
      {ukSegmentos().map((seg) => {
        const top = ukTopAutoridades(seg.slug, 5);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome}: about {nUS(ukTotalSeg(seg.slug))} sites in the UK</h2>
            <ul className="lista">
              {top.map(({ auth, e }) => (
                <li key={`${auth.nation}-${auth.slug}`}>
                  <Link href={`/uk/${auth.nation}/${auth.slug}/${seg.slug}`}>{auth.nome}</Link>
                  <span>{nUS(e)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Cta campanha="uk-home" botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto="Customers compare businesses in the same category by their Google reviews. See how yours looks." />
    </>
  );
}
