import type { Metadata } from 'next';
import Link from 'next/link';
import { getMeta, getSegmentos, topMunicipios, totalDoSegmento, ufsComDados } from '@/lib/data';
import { n, mesPorExtenso, mesCurto } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

export const revalidate = 86400;

const titulo = 'Índice Filtra.AI: quantas empresas existem por município e segmento';

export function generateMetadata(): Metadata {
  const meta = getMeta();
  const descricao = `Estabelecimentos ativos de restaurantes, clínicas, hotéis, academias e outros segmentos em todo o Brasil, por estado e município (CNPJ, ${mesCurto(meta.competencia)}).`;
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: urlAbsoluta('/') },
    openGraph: { title: titulo, description: descricao, url: urlAbsoluta('/'), type: 'website', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  const meta = getMeta();
  const ufs = ufsComDados();
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }])} />
      <Migalhas itens={[{ nome: 'Índice' }]} />
      <h1>Índice Filtra.AI: quantas empresas existem por município e segmento</h1>
      <p className="lead">
        Contagens de estabelecimentos ativos, aberturas e baixas em {getSegmentos().length} segmentos e {n(ufs.reduce((t, u) => t + u.municipios, 0))} municípios,
        calculadas a partir do cadastro aberto de CNPJ da Receita Federal (competência {mesPorExtenso(meta.competencia)}). Sem dados pessoais:
        só números agregados. <Link href="/metodologia">Veja como calculamos</Link>.
      </p>

      <h2>Escolha um estado</h2>
      <ul className="grade">
        {ufs.map((u) => (
          <li key={u.sigla}>
            <Link href={`/${u.sigla.toLowerCase()}`}>{u.nome}<small>{n(u.municipios)} municípios</small></Link>
          </li>
        ))}
      </ul>

      {getSegmentos().map((seg) => {
        const top = topMunicipios(seg.slug, 10);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h2>{seg.nome}: {n(totalDoSegmento(seg.slug))} estabelecimentos ativos no Brasil</h2>
            <ul className="lista">
              {top.map(({ mun, a }) => (
                <li key={`${mun.uf}-${mun.slug}`}>
                  <Link href={`/${mun.uf.toLowerCase()}/${mun.slug}/${seg.slug}`}>{mun.nome} ({mun.uf})</Link>
                  <span>{n(a)} ativos</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Cta campanha="home" texto="Empresas do mesmo segmento são comparadas pelo cliente. Veja como está a reputação do seu negócio no Google." />
    </>
  );
}
