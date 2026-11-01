import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MIN_MUNICIPIOS_RANKING_UF, rankingDoSegmento } from '@/lib/data';
import { modeloDoRanking } from '@/lib/ranking-textos';
import { OG_IMAGE, urlAbsoluta } from '@/lib/seo';
import { ufDeSlug } from '@/lib/ufs';
import { RankingPagina } from '@/components/RankingPagina';

type Props = { params: Promise<{ segmento: string; uf: string }> };

export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(segmento: string, uf: string) {
  const sigla = ufDeSlug(uf);
  if (!sigla) return null;
  // Estados com poucos municípios no segmento não têm ranking publicado.
  if (rankingDoSegmento(segmento, 'a', sigla).length < MIN_MUNICIPIOS_RANKING_UF) return null;
  return modeloDoRanking(segmento, sigla);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segmento, uf } = await params;
  const m = resolver(segmento, uf);
  if (!m) return { robots: { index: false } };
  const url = urlAbsoluta(`/rankings/ativos/${segmento}/${uf}`);
  return {
    title: { absolute: m.titulo },
    description: m.descricao,
    alternates: { canonical: url },
    openGraph: { title: m.titulo, description: m.descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: m.titulo, description: m.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { segmento, uf } = await params;
  const m = resolver(segmento, uf);
  if (!m) notFound();
  return <RankingPagina m={m} caminho={`/rankings/ativos/${segmento}/${uf}`} />;
}
