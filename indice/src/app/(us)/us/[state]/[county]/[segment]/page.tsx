import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUS, usMeta, usPagina, usTopCondados, type UsPagina } from '@/lib/us';
import { ESTADOS_US, siglaDeSlug, slugEstado } from '@/lib/us-states';
import { nUS, ordUS, pctUS, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ state: string; county: string; segment: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

const FAIXAS = ['Under 5 employees', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100 or more'];

/** Fonte única dos textos: título, descrição, lead e FAQ saem daqui, então não divergem entre si nem do JSON-LD. */
function textos(p: UsPagina, ano: string) {
  const { county, seg, reg } = p;
  const st = county.state;
  const estado = ESTADOS_US[st];
  const soma = reg.sz.reduce((t, x) => t + x, 0);
  const micro = pctUS(reg.sz[0], soma, 0);
  const grandes = pctUS(reg.sz[3] + reg.sz[4] + reg.sz[5], soma, 0);
  const titulo = `${seg.nome} in ${county.nome}, ${st}: how many are there?`;
  const descricao = corta(
    `${county.nome}, ${st} has ${nUS(reg.e)} ${seg.curto} with paid employees (Census CBP ${ano}): ranked ${ordUS(p.rankUS)} of ${nUS(p.condadosUS)} US counties. Size and employment.`,
    158,
  );
  const ranking = `${county.nome} ranks ${ordUS(p.rankUS)} among the ${nUS(p.condadosUS)} US counties with data for this category, and ${ordUS(p.rankUF)} of ${nUS(p.condadosUF)} in ${estado}.`;
  const lead = `${county.nome}, ${estado} had ${nUS(reg.e)} ${seg.curto} with paid employees in ${ano}, according to the U.S. Census Bureau's County Business Patterns. ${ranking}`;
  const faq = [
    {
      pergunta: `How many ${seg.curto} are there in ${county.nome}, ${st}?`,
      resposta: `${nUS(reg.e)} establishments with paid employees in ${ano}, according to Census Bureau County Business Patterns. Businesses with no employees, such as many owner-operated shops, are not counted.`,
    },
    { pergunta: `How does ${county.nome} compare with other counties?`, resposta: ranking },
    {
      pergunta: `How big are ${seg.curto} in ${county.nome}?`,
      resposta: `${micro} of them have fewer than 5 employees and ${grandes} have 20 or more, based on the number of employees per establishment.`,
    },
  ];
  return { titulo, descricao, lead, faq, soma };
}

function resolver(state: string, county: string, segment: string) {
  if (!temDadosUS()) return null;
  const sigla = siglaDeSlug(state);
  return sigla ? usPagina(sigla, county, segment) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, county, segment } = await params;
  const p = resolver(state, county, segment);
  if (!p) return { robots: { index: false } };
  const t = textos(p, usMeta().ano);
  const url = urlAbsoluta(`/us/${state}/${county}/${segment}`);
  return {
    title: { absolute: t.titulo },
    description: t.descricao,
    alternates: { canonical: url },
    openGraph: { title: t.titulo, description: t.descricao, url, type: 'article', locale: 'en_US', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.titulo, description: t.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { state, county, segment } = await params;
  const p = resolver(state, county, segment);
  if (!p) notFound();
  const meta = usMeta();
  const t = textos(p, meta.ano);
  const { seg, reg } = p;
  const st = p.county.state;
  const estado = ESTADOS_US[st];
  const outrosCondados = usTopCondados(seg.slug, 9, st).filter((x) => x.county.slug !== county).slice(0, 8);
  return (
    <>
      <JsonLd data={breadcrumb([
        { nome: 'US Index', caminho: '/us' },
        { nome: estado, caminho: `/us/${state}` },
        { nome: p.county.nome, caminho: `/us/${state}/${county}` },
        { nome: seg.nome, caminho: `/us/${state}/${county}/${segment}` },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `${seg.nome} in ${p.county.nome}, ${st}: establishments with paid employees`,
        description: t.descricao,
        url: urlAbsoluta(`/us/${state}/${county}/${segment}`),
        inLanguage: 'en',
        dateModified: meta.geradoEm,
        temporalCoverage: meta.ano,
        spatialCoverage: { '@type': 'Place', name: `${p.county.nome}, ${estado}, United States` },
        isBasedOn: meta.fonte.url,
        creator: publisher,
        publisher,
      }} />
      <Migalhas rotulo="You are here" itens={[
        { nome: 'US Index', href: '/us' },
        { nome: estado, href: `/us/${state}` },
        { nome: p.county.nome, href: `/us/${state}/${county}` },
        { nome: seg.nome },
      ]} />
      <h1>{seg.nome} in {p.county.nome}, {st}: how many are there?</h1>
      <p className="lead">{t.lead}</p>

      <div className="cards">
        <div className="card"><strong>{nUS(reg.e)}</strong><small>establishments with paid employees</small></div>
        <div className="card"><strong>{ordUS(p.rankUS)}</strong><small>of {nUS(p.condadosUS)} US counties</small></div>
        <div className="card"><strong>{ordUS(p.rankUF)}</strong><small>of {nUS(p.condadosUF)} counties in {estado}</small></div>
        {reg.emp ? <div className="card"><strong>~{nUS(reg.emp)}</strong><small>jobs, approximate</small></div> : null}
      </div>

      <h2>Establishments by number of employees</h2>
      <table>
        <caption>Establishments of {seg.curto} in {p.county.nome}, {st}, by employees per establishment ({meta.ano}).</caption>
        <thead><tr><th scope="col">Employees</th><th scope="col" className="num">Establishments</th><th scope="col" className="num">Share</th></tr></thead>
        <tbody>
          {FAIXAS.map((rot, i) => (
            <tr key={rot}><th scope="row">{rot}</th><td className="num">{nUS(reg.sz[i])}</td><td className="num">{pctUS(reg.sz[i], t.soma)}</td></tr>
          ))}
        </tbody>
      </table>
      {reg.emp ? (
        <p className="nota">Employment is approximate: the Census Bureau adds statistical noise to protect confidentiality. Establishment counts are not noised.</p>
      ) : null}

      <h2>Where {p.county.nome} fits in {estado}</h2>
      <p>
        {estado} has {nUS(p.totalUF)} {seg.curto} with paid employees across {nUS(p.condadosUF)} counties; {p.county.nome} has {pctUS(reg.e, p.totalUF)} of them.
        Nationally, the total is {nUS(p.totalUS)}.
      </p>
      {outrosCondados.length ? (
        <>
          <h3>Other counties in {estado}</h3>
          <ul className="lista">
            {outrosCondados.map(({ county: c, e }) => (
              <li key={c.slug}><Link href={`/us/${slugEstado(c.state)}/${c.slug}/${seg.slug}`}>{c.nome}</Link><span>{nUS(e)}</span></li>
            ))}
          </ul>
        </>
      ) : null}
      {p.outros.length ? (
        <>
          <h3>Other categories in {p.county.nome}</h3>
          <ul className="lista">
            {p.outros.slice(0, 8).map(({ seg: s, reg: r }) => (
              <li key={s.slug}><Link href={`/us/${state}/${county}/${s.slug}`}>{s.nome}</Link><span>{nUS(r.e)}</span></li>
            ))}
          </ul>
        </>
      ) : null}

      <Cta campanha={`us-${state}-${county}-${segment}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Customers choose ${seg.curto} in ${p.county.nome} by comparing Google ratings and reviews. See how your business looks.`} />
      <Faq titulo="Frequently asked questions" itens={t.faq} />
      <p className="nota">
        Source: {meta.fonte.nome}, {meta.ano}. Only establishments with paid employees are counted (NAICS {seg.naics.map((c) => c.replace(/\//g, '')).join(', ')}).{' '}
        <Link href="/us/methodology">Methodology and limits</Link>.
      </p>
    </>
  );
}
