import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { modeloDoRanking } from '@/lib/ranking-textos';
import { OG_IMAGE, urlAbsoluta } from '@/lib/seo';
import { RankingPagina } from '@/components/RankingPagina';

type Props = { params: Promise<{ segmento: string }> };

export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segmento } = await params;
  const m = modeloDoRanking(segmento);
  if (!m) return { robots: { index: false } };
  const url = urlAbsoluta(`/rankings/ativos/${segmento}`);
  return {
    title: { absolute: m.titulo },
    description: m.descricao,
    alternates: { canonical: url },
    openGraph: { title: m.titulo, description: m.descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: m.titulo, description: m.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { segmento } = await params;
  const m = modeloDoRanking(segmento);
  if (!m) notFound();
  return <RankingPagina m={m} caminho={`/rankings/ativos/${segmento}`} />;
}
