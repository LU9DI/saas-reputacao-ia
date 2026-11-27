import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUK, ukMeta, ukAutoridade, ukSegsDaAutoridade } from '@/lib/uk';
import { NACOES_UK, slugNacao } from '@/lib/uk-nations';
import { nUS, corta } from '@/lib/format';
import { ate } from '@/lib/rotulos';
import { urlAbsoluta, OG_IMAGE, JsonLd, datasetDoRecorteUK } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ nation: string; authority: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(nation: string, authority: string) {
  if (!temDadosUK()) return null;
  const slug = slugNacao(nation);
  if (!slug) return null;
  const a = ukAutoridade(slug, authority);
  const segs = a ? ukSegsDaAutoridade(slug, authority) : [];
  return a && segs.length ? { slug, a, segs } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nation, authority } = await params;
  const r = resolver(nation, authority);
  if (!r) return { robots: { index: false } };
  const meta = ukMeta();
  const total = r.segs.reduce((t, x) => t + x.reg.e, 0);
  const titulo = ate(60, `Businesses by category in ${r.a.nome}`, `Businesses in ${r.a.nome}`);
  const descricao = corta(`About ${nUS(total)} business sites in ${r.segs.length} categories in ${r.a.nome}, ${NACOES_UK[r.slug]} (ONS UK Business Counts ${meta.ano}). Counts, size and ranking.`, 158);
  const url = urlAbsoluta(`/uk/${nation}/${authority}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { nation, authority } = await params;
  const r = resolver(nation, authority);
  if (!r) notFound();
  const meta = ukMeta();
  const { slug, a, segs } = r;
  const nome = NACOES_UK[slug];
  const total = segs.reduce((t, x) => t + x.reg.e, 0);
  const maior = segs[0];
  const faq = [
    {
      pergunta: `Which category has the most business sites in ${a.nome}?`,
      resposta: `Among the ${segs.length} categories tracked, ${maior.seg.curto} have the most in ${a.nome}, ${nome}: about ${nUS(maior.reg.e)} business sites, according to ONS UK Business Counts ${meta.ano}.`,
    },
    {
      pergunta: `How many business sites are there in ${a.nome} across these categories?`,
      resposta: `About ${nUS(total)}, adding up the ${segs.length} categories with enough data to publish. This is not the total number of businesses in the area, and businesses that are not VAT or PAYE registered are not counted.`,
    },
  ];
  return (
    <>
      <JsonLd
        data={datasetDoRecorteUK({
          url: urlAbsoluta(`/uk/${nation}/${authority}`),
          name: `Businesses by category in ${a.nome}`,
          description: `Business sites in ${segs.length} categories in ${a.nome}, ${nome}, from the ONS UK Business Counts ${meta.ano}, rounded to the nearest 5.`,
          espacial: `${a.nome}, ${nome}, United Kingdom`,
          meta,
          variaveis: [
            { nome: 'Business sites in published categories', valor: total, unidade: 'local units' },
            { nome: 'Categories with published pages', valor: segs.length, unidade: 'categories' },
          ],
        })}
      />
      <Migalhas
        indice
        caminhoAtual={`/uk/${nation}/${authority}`}
        rotulo="You are here"
        itens={[{ nome: 'UK Index', href: '/uk' }, { nome, href: `/uk/${nation}` }, { nome: a.nome }]}
      />
      <h1>Businesses by category in {a.nome}</h1>
      <p className="lead">
        {a.nome}, {nome} has about {nUS(total)} business sites in the {segs.length} categories tracked by the UK Index, according to the ONS
        UK Business Counts ({meta.ano}). The largest is {maior.seg.curto}, with about {nUS(maior.reg.e)}.
      </p>
      <p className="nota">
        Part of the <Link href={`/uk/${nation}`}>{nome}</Link> hub and the <Link href="/uk">UK Index</Link>.
      </p>
      <table>
        <thead><tr><th>Category</th><th className="num">Business sites</th></tr></thead>
        <tbody>
          {segs.map(({ seg, reg }) => (
            <tr key={seg.slug}><td><Link href={`/uk/${nation}/${authority}/${seg.slug}`}>{seg.nome}</Link></td><td className="num">{nUS(reg.e)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="nota">Counts are rounded to the nearest 5. <Link href="/uk/methodology">Methodology</Link>.</p>
      <Cta campanha={`uk-${nation}-${authority}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Customers in ${a.nome} compare businesses by their Google reviews. See how yours looks.`} />
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
