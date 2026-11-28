import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { temDadosUK, ukMeta, ukPagina, ukTopAutoridades, type UkPagina } from '@/lib/uk';
import { NACOES_UK, slugNacao } from '@/lib/uk-nations';
import { nUS, ordUS, pctUS, corta } from '@/lib/format';
import { ate } from '@/lib/rotulos';
import { JsonLd, urlAbsoluta, OG_IMAGE, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ nation: string; authority: string; segment: string }> };
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

const FAIXAS = ['0 to 4 employees', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100 or more'];

/** Fonte única dos textos: título, descrição, lead e FAQ saem daqui, então não divergem entre si nem do JSON-LD. */
function textos(p: UkPagina, ano: string) {
  const { auth, seg, reg } = p;
  const nome = NACOES_UK[auth.nation];
  const completa = reg.sz.every((x): x is number => x !== null);
  const soma = completa ? (reg.sz as number[]).reduce((t, x) => t + x, 0) : null;
  const distribuivel = completa && soma !== null && soma > 0;
  const micro = distribuivel ? pctUS((reg.sz[0] as number) + (reg.sz[1] as number), soma as number, 0) : null;
  const grandes = distribuivel ? pctUS((reg.sz[3] as number) + (reg.sz[4] as number) + (reg.sz[5] as number), soma as number, 0) : null;
  const titulo = `${seg.nome} in ${auth.nome}: how many local units are there?`;
  const tituloMeta = ate(60, titulo, `${seg.nome} in ${auth.nome}, ${nome}`, `${seg.nome} in ${auth.nome}`);
  const descricao = corta(
    `${auth.nome} has about ${nUS(reg.e)} local units in ${seg.curto} (ONS UK Business Counts ${ano}): ranked ${ordUS(p.rankUK)} of ${nUS(p.autoridadesUK)} UK local authorities. Size and ranking.`,
    158,
  );
  const ranking = `${auth.nome} ranks ${ordUS(p.rankUK)} among the ${nUS(p.autoridadesUK)} UK local authorities with data for this category, and ${ordUS(p.rankNacao)} of ${nUS(p.autoridadesNacao)} in ${nome}.`;
  const lead = `${auth.nome}, ${nome} had about ${nUS(reg.e)} local units (business sites) in ${seg.curto} in ${ano}, according to the Office for National Statistics UK Business Counts (rounded to the nearest 5). ${ranking}`;
  const faq = [
    {
      pergunta: `How many ${seg.curto} local units are there in ${auth.nome}?`,
      resposta: `About ${nUS(reg.e)} local units (business sites) in ${ano}, according to ONS UK Business Counts. Counts are rounded to the nearest 5, and businesses that are not VAT or PAYE registered are not included.`,
    },
    { pergunta: `How does ${auth.nome} compare with other local authorities?`, resposta: ranking },
    {
      pergunta: `How big are ${seg.curto} in ${auth.nome}?`,
      resposta: distribuivel
        ? `Around ${micro} have fewer than 10 employees and ${grandes} have 20 or more, based on the number of employees per local unit. Each figure is rounded, so shares are approximate.`
        : completa
          ? 'At this level the ONS rounded every size class to zero, so no meaningful share can be calculated. The local-unit total is still published and no class is treated as missing.'
          : 'The ONS withheld one or more size classes for this local authority, so a complete size distribution is not available. The local-unit total is still published; no missing class is treated as zero.',
    },
  ];
  return { titulo, tituloMeta, descricao, lead, faq, soma, completa };
}

function resolver(nation: string, authority: string, segment: string) {
  if (!temDadosUK()) return null;
  const slug = slugNacao(nation);
  return slug ? ukPagina(slug, authority, segment) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nation, authority, segment } = await params;
  const p = resolver(nation, authority, segment);
  if (!p) return { robots: { index: false } };
  const t = textos(p, ukMeta().ano);
  const url = urlAbsoluta(`/uk/${nation}/${authority}/${segment}`);
  return {
    title: { absolute: t.tituloMeta },
    description: t.descricao,
    alternates: { canonical: url },
    openGraph: { title: t.tituloMeta, description: t.descricao, url, type: 'article', locale: 'en_GB', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.tituloMeta, description: t.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { nation, authority, segment } = await params;
  const p = resolver(nation, authority, segment);
  if (!p) notFound();
  const meta = ukMeta();
  const t = textos(p, meta.ano);
  const { seg, reg } = p;
  const nome = NACOES_UK[p.auth.nation];
  const outras = ukTopAutoridades(seg.slug, 9, p.auth.nation).filter((x) => x.auth.slug !== authority).slice(0, 8);
  const caminho = `/uk/${nation}/${authority}/${segment}`;
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        '@id': `${urlAbsoluta(caminho)}#data`,
        name: `${seg.nome} in ${p.auth.nome}: local units`,
        description: t.descricao,
        url: urlAbsoluta(caminho),
        inLanguage: 'en-GB',
        license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        isAccessibleForFree: true,
        measurementTechnique: 'Count of local business units (VAT and/or PAYE registered) by local authority and UK SIC 2007 industry category, from the Office for National Statistics UK Business Counts, rounded to the nearest 5.',
        variableMeasured: [{ '@type': 'PropertyValue', name: 'Business sites (local units)', value: reg.e, unitText: 'local units' }],
        dateModified: meta.geradoEm,
        temporalCoverage: meta.ano,
        spatialCoverage: { '@type': 'Place', name: `${p.auth.nome}, ${nome}, United Kingdom` },
        isBasedOn: meta.fonte.url,
        creator: publisher,
        publisher,
      }} />
      <Migalhas
        indice
        caminhoAtual={caminho}
        rotulo="You are here"
        itens={[
          { nome: 'UK Index', href: '/uk' },
          { nome, href: `/uk/${nation}` },
          { nome: p.auth.nome, href: `/uk/${nation}/${authority}` },
          { nome: seg.nome },
        ]}
      />
      <h1>{seg.nome} in {p.auth.nome}: how many local units are there?</h1>
      <p className="lead">{t.lead}</p>

      <div className="cards">
        <div className="card"><strong>~{nUS(reg.e)}</strong><small>local units (business sites), rounded to the nearest 5</small></div>
        <div className="card"><strong>{ordUS(p.rankUK)}</strong><small>of {nUS(p.autoridadesUK)} UK local authorities</small></div>
        <div className="card"><strong>{ordUS(p.rankNacao)}</strong><small>of {nUS(p.autoridadesNacao)} in {nome}</small></div>
      </div>

      <h2>Local units by number of employees</h2>
      <table>
        <caption>Local units (business sites) of {seg.curto} in {p.auth.nome}, by employees per unit ({meta.ano}). Figures are rounded to the nearest 5.</caption>
        <thead><tr><th scope="col">Employees</th><th scope="col" className="num">Sites</th><th scope="col" className="num">Share</th></tr></thead>
        <tbody>
          {FAIXAS.map((rot, i) => {
            const valor = reg.sz[i];
            return (
              <tr key={rot}><th scope="row">{rot}</th><td className="num">{typeof valor === 'number' ? nUS(valor) : 'Not available'}</td><td className="num">{typeof valor === 'number' && t.soma !== null && t.soma > 0 ? pctUS(valor, t.soma) : '—'}</td></tr>
            );
          })}
        </tbody>
      </table>
      {!t.completa ? (
        <p className="nota">The ONS withheld one or more size classes for this local authority. Missing classes are shown as “Not available”, not as zero, and no share is inferred from an incomplete distribution.</p>
      ) : t.soma !== null && t.soma !== reg.e ? (
        <p className="nota">Size classes are rounded independently by the ONS and may not add up to the local-unit total ({nUS(reg.e)}). {t.soma === 0 ? 'At this level all classes rounded to zero, so no share is shown.' : 'Shares use the rounded class sum as the denominator.'}</p>
      ) : null}

      <h2>Where {p.auth.nome} fits in {nome}</h2>
      <p>
        {nome} has about {nUS(p.totalNacao)} {seg.curto} across {nUS(p.autoridadesNacao)} local authorities; {p.auth.nome} has {pctUS(reg.e, p.totalNacao)} of them.
        Across the UK, the total is about {nUS(p.totalUK)}.
      </p>
      <p className="nota">
        See the <Link href={`/uk/${nation}/${authority}`}>{p.auth.nome}</Link> hub, the{' '}
        <Link href={`/uk/${nation}`}>{nome}</Link> hub, or the <Link href="/uk">UK Index</Link>.
      </p>
      {outras.length ? (
        <>
          <h3>Other local authorities in {nome}</h3>
          <ul className="lista">
            {outras.map(({ auth: c, e }) => (
              <li key={c.slug}><Link href={`/uk/${c.nation}/${c.slug}/${seg.slug}`}>{c.nome}</Link><span>{nUS(e)}</span></li>
            ))}
          </ul>
        </>
      ) : null}
      {p.outros.length ? (
        <>
          <h3>Other categories in {p.auth.nome}</h3>
          <ul className="lista">
            {p.outros.slice(0, 8).map(({ seg: s, reg: r }) => (
              <li key={s.slug}><Link href={`/uk/${nation}/${authority}/${s.slug}`}>{s.nome}</Link><span>{nUS(r.e)}</span></li>
            ))}
          </ul>
        </>
      ) : null}

      <Cta campanha={`uk-${nation}-${authority}-${segment}`} botao="Run a free review audit" destino="https://filtraai.com/en/free-review-audit" texto={`Customers choose ${seg.curto} in ${p.auth.nome} by comparing Google ratings and reviews. See how your business looks.`} />
      <Faq titulo="Frequently asked questions" itens={t.faq} />
      <p className="nota">
        Source: {meta.fonte.nome}, {meta.ano}. Local units registered for VAT and/or PAYE (UK SIC 2007 {seg.sic.join(', ')}).{' '}
        <Link href="/uk/methodology">Methodology and limits</Link>.
      </p>
    </>
  );
}
