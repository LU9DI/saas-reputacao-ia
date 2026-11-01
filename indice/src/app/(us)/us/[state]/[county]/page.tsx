import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUS, usMeta, usCondado, usSegsDoCondado } from '@/lib/us';
import { ESTADOS_US, siglaDeSlug } from '@/lib/us-states';
import { nUS, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string; county: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(state: string, county: string) {
  if (!temDadosUS()) return null;
  const sigla = siglaDeSlug(state);
  if (!sigla) return null;
  const c = usCondado(sigla, county);
  const segs = c ? usSegsDoCondado(sigla, county) : [];
  return c && segs.length ? { sigla, c, segs } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, county } = await params;
  const r = resolver(state, county);
  if (!r) return { robots: { index: false } };
  const meta = usMeta();
  const total = r.segs.reduce((t, x) => t + x.reg.e, 0);
  const titulo = `Businesses by category in ${r.c.nome}, ${r.sigla}`;
  const descricao = corta(`${nUS(total)} establishments with paid employees in ${r.segs.length} categories in ${r.c.nome}, ${r.sigla} (Census CBP ${meta.ano}). Counts, size and ranking.`, 158);
  const url = urlAbsoluta(`/us/${state}/${county}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state, county } = await params;
  const r = resolver(state, county);
  if (!r) notFound();
  const meta = usMeta();
  const { sigla, c, segs } = r;
  const total = segs.reduce((t, x) => t + x.reg.e, 0);
  const maior = segs[0];
  const faq = [
    {
      pergunta: `Which category has the most establishments in ${c.nome}?`,
      resposta: `Among the ${segs.length} categories tracked, ${maior.seg.curto} have the most in ${c.nome}, ${ESTADOS_US[sigla]}: ${nUS(maior.reg.e)} establishments with paid employees, according to Census Bureau County Business Patterns ${meta.ano}.`,
    },
    {
      pergunta: `How many establishments are there in ${c.nome} across these categories?`,
      resposta: `${nUS(total)} establishments with paid employees, adding up the ${segs.length} categories with enough data to publish. This is not the total number of businesses in the county, and businesses with no employees are not counted.`,
    },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'US Index', caminho: '/us' }, { nome: ESTADOS_US[sigla], caminho: `/us/${state}` }, { nome: c.nome, caminho: `/us/${state}/${county}` }])} />
      <Migalhas rotulo="You are here" itens={[{ nome: 'US Index', href: '/us' }, { nome: ESTADOS_US[sigla], href: `/us/${state}` }, { nome: c.nome }]} />
      <h1>Businesses by category in {c.nome}, {sigla}</h1>
      <p className="lead">
        {c.nome}, {ESTADOS_US[sigla]} has {nUS(total)} establishments with paid employees in the {segs.length} categories tracked by the US Index, according to the Census
        Bureau&apos;s County Business Patterns ({meta.ano}). The largest is {maior.seg.curto}, with {nUS(maior.reg.e)}.
      </p>
      <table>
        <thead><tr><th>Category</th><th className="num">Establishments</th></tr></thead>
        <tbody>
          {segs.map(({ seg, reg }) => (
            <tr key={seg.slug}><td><Link href={`/us/${state}/${county}/${seg.slug}`}>{seg.nome}</Link></td><td className="num">{nUS(reg.e)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="nota">Only establishments with paid employees are counted. <Link href="/us/methodology">Methodology</Link>.</p>
      <Cta campanha={`us-${state}-${county}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Customers in ${c.nome} compare businesses by their Google reviews. See how yours looks.`} />
      <Faq titulo="Frequently asked questions" itens={faq} />
    </>
  );
}
