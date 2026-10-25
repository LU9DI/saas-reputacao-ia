import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getSegmentos, municipiosDaUF, topMunicipios, totalDoSegmento } from '@/lib/data';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, mesPorExtenso, mesCurto, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ uf: string }> };

export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(uf: string) {
  const sigla = ufDeSlug(uf);
  if (!sigla) return null;
  const municipios = municipiosDaUF(sigla);
  return municipios.length ? { sigla, municipios } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf } = await params;
  const r = resolver(uf);
  if (!r) return { robots: { index: false } };
  const meta = getMeta();
  const titulo = `Empresas por município e segmento no estado de ${UFS[r.sigla]}`;
  const descricao = corta(
    `Estabelecimentos ativos de restaurantes, clínicas, hotéis e outros segmentos em ${r.municipios.length} municípios de ${UFS[r.sigla]} (CNPJ, ${mesCurto(meta.competencia)}).`,
    158,
  );
  const url = urlAbsoluta(`/${uf}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { uf } = await params;
  const r = resolver(uf);
  if (!r) notFound();
  const meta = getMeta();
  const { sigla, municipios } = r;
  const nome = UFS[sigla];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome, caminho: `/${uf}` }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome }]} />
      <h1>Empresas por município e segmento no estado de {nome}</h1>
      <p className="lead">
        O Índice acompanha {getSegmentos().length} segmentos em {n(municipios.length)} municípios de {nome}, com dados do cadastro aberto de CNPJ da Receita Federal
        (competência {mesPorExtenso(meta.competencia)}). Veja os municípios com mais estabelecimentos ativos em cada segmento.
      </p>
      {getSegmentos().map((seg) => {
        const top = topMunicipios(seg.slug, 10, sigla);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome} em {nome}: {n(totalDoSegmento(seg.slug, sigla))} estabelecimentos ativos</h2>
            <ul className="lista">
              {top.map(({ mun, a }) => (
                <li key={mun.slug}><Link href={`/${uf}/${mun.slug}/${seg.slug}`}>{mun.nome}</Link><span>{n(a)} ativos</span></li>
              ))}
            </ul>
          </section>
        );
      })}
      <h2>Todos os municípios de {nome} no Índice</h2>
      <ul className="grade">
        {municipios.map(({ mun, total, segmentos }) => (
          <li key={mun.slug}>
            <Link href={`/${uf}/${mun.slug}`}>{mun.nome}<small>{n(total)} ativos em {segmentos} {segmentos === 1 ? 'segmento' : 'segmentos'}</small></Link>
          </li>
        ))}
      </ul>
      <Cta campanha={uf} texto={`Atua em ${nome}? Veja como está a reputação do seu negócio no Google.`} />
    </>
  );
}
