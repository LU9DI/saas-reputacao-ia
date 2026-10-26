import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getMunicipio, segmentosDoMunicipio } from '@/lib/data';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, mesPorExtenso, mesCurto, corta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ uf: string; municipio: string }> };

export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(uf: string, municipio: string) {
  const sigla = ufDeSlug(uf);
  if (!sigla) return null;
  const mun = getMunicipio(sigla, municipio);
  const segs = mun ? segmentosDoMunicipio(sigla, municipio) : [];
  return mun && segs.length ? { sigla, mun, segs } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf, municipio } = await params;
  const r = resolver(uf, municipio);
  if (!r) return { robots: { index: false } };
  const meta = getMeta();
  const total = r.segs.reduce((t, x) => t + x.reg.a, 0);
  const titulo = `Empresas por segmento em ${r.mun.nome} (${r.sigla})`;
  const descricao = corta(
    `Quantos estabelecimentos ativos existem em ${r.mun.nome} (${r.sigla}) em ${r.segs.length} segmentos: ${n(total)} no total (CNPJ, ${mesCurto(meta.competencia)}). Abertos, baixas e ranking.`,
    158,
  );
  const url = urlAbsoluta(`/${uf}/${municipio}`);
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { uf, municipio } = await params;
  const r = resolver(uf, municipio);
  if (!r) notFound();
  const meta = getMeta();
  const { sigla, mun, segs } = r;
  const total = segs.reduce((t, x) => t + x.reg.a, 0);
  const maior = segs[0];
  const comp = mesPorExtenso(meta.competencia);
  const faq = [
    {
      pergunta: `Qual segmento tem mais estabelecimentos ativos em ${mun.nome}?`,
      resposta: `Entre os ${segs.length} segmentos acompanhados, o de ${maior.seg.curto} tem o maior número em ${mun.nome}: ${n(maior.reg.a)} estabelecimentos ativos, segundo o cadastro aberto de CNPJ da Receita Federal (competência ${comp}).`,
    },
    {
      pergunta: `Quantos estabelecimentos ativos existem em ${mun.nome} nos segmentos acompanhados?`,
      resposta: `São ${n(total)} estabelecimentos ativos somando os ${segs.length} segmentos com dados suficientes para publicação em ${mun.nome}. Não é o total de empresas do município, apenas dos segmentos acompanhados.`,
    },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: UFS[sigla], caminho: `/${uf}` }, { nome: mun.nome, caminho: `/${uf}/${municipio}` }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: UFS[sigla], href: `/${uf}` }, { nome: mun.nome }]} />
      <h1>Empresas por segmento em {mun.nome} ({sigla})</h1>
      <p className="lead">
        {mun.nome} tem {n(total)} estabelecimentos ativos nos {segs.length} segmentos acompanhados pelo Índice, segundo o cadastro aberto de CNPJ da Receita Federal
        (competência {comp}). O maior é {maior.seg.curto}, com {n(maior.reg.a)}.
      </p>
      <table>
        <thead>
          <tr><th>Segmento</th><th className="num">Ativos</th><th className="num">Abertos em 12 meses</th><th className="num">Baixas em 12 meses</th></tr>
        </thead>
        <tbody>
          {segs.map(({ seg, reg }) => (
            <tr key={seg.slug}>
              <td><Link href={`/${uf}/${municipio}/${seg.slug}`}>{seg.nome}</Link></td>
              <td className="num">{n(reg.a)}</td>
              <td className="num">{n(reg.ab)}</td>
              <td className="num">{n(reg.ba)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="nota">Janela de aberturas e baixas: {mesCurto(meta.janela.inicio)} a {mesCurto(meta.janela.fim)}. <Link href="/metodologia">Metodologia</Link>.</p>
      <Cta campanha={`${uf}-${municipio}`} texto={`Quem pesquisa uma empresa em ${mun.nome} compara notas e comentários. Veja como está a reputação do seu negócio no Google.`} />
      <Faq itens={faq} />
    </>
  );
}
