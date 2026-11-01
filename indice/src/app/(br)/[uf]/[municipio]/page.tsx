import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getMunicipio, segmentosDoMunicipio } from '@/lib/data';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, pct, mesPorExtenso, mesCurto, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, datasetDoRecorte } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
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
  const titulo = `Estabelecimentos ativos por segmento em ${r.mun.nome} (${r.sigla})`;
  const descricao = corta(
    `${n(total)} estabelecimentos com CNPJ ativo nos ${r.segs.length} segmentos com página em ${r.mun.nome} (${r.sigla}). Fonte: Receita Federal, competência ${mesCurto(meta.competencia)}.`,
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
  const matrizes = segs.reduce((t, x) => t + x.reg.m, 0);
  const abertos = segs.reduce((t, x) => t + x.reg.ab, 0);
  const baixas = segs.reduce((t, x) => t + x.reg.ba, 0);
  const maior = segs[0];
  const comp = mesPorExtenso(meta.competencia);
  const janela = `${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}`;
  const plural = segs.length === 1 ? 'segmento com página publicada' : 'segmentos com página publicada';

  const faq: ItemFaq[] = [
    {
      pergunta: `Qual segmento tem mais estabelecimentos ativos em ${mun.nome}?`,
      resposta: `Entre os ${segs.length} ${plural}, o de ${maior.seg.curto} tem o maior número em ${mun.nome}: ${n(maior.reg.a)} estabelecimentos com CNPJ ativo, segundo o cadastro aberto da Receita Federal (competência ${comp}).`,
    },
    {
      pergunta: `Quantos estabelecimentos ativos existem em ${mun.nome} nos segmentos acompanhados?`,
      resposta: `São ${n(total)} estabelecimentos ativos somando os ${segs.length} ${plural} em ${mun.nome}. Não é o total de empresas do município: ficam fora as atividades não acompanhadas e as combinações com menos de ${n(meta.minimoParaIndexar)} estabelecimentos ativos.`,
    },
    {
      pergunta: `Quantos abriram e quantos tiveram baixa em ${mun.nome} nos últimos 12 meses?`,
      resposta: `Entre ${janela}, ${n(abertos)} estabelecimentos iniciaram atividade e ${n(baixas)} tiveram o CNPJ baixado nos segmentos com página. Os números não formam um saldo: a abertura inclui quem depois foi baixado, e a baixa cadastral não equivale necessariamente ao fechamento do negócio.`,
    },
    {
      pergunta: 'O Índice mede a reputação ou a qualidade desses estabelecimentos?',
      resposta: 'Não. O Índice conta estabelecimentos com situação cadastral ativa. Nota, comentários, faturamento, qualidade do atendimento e participação de mercado não fazem parte do conjunto de dados.',
    },
    {
      pergunta: 'De onde vêm os dados e qual é o período?',
      resposta: `Do Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos, da Receita Federal do Brasil. Competência ${comp}; dados gerados em ${dataCurta(meta.geradoEm)}. Aberturas e baixas usam a janela de 12 meses de ${janela}.`,
    },
  ];

  const dataset = datasetDoRecorte({
    url: urlAbsoluta(`/${uf}/${municipio}`),
    name: `Estabelecimentos ativos por segmento em ${mun.nome} (${sigla})`,
    description: `Contagens de estabelecimentos com CNPJ ativo nos segmentos acompanhados pelo Índice em ${mun.nome}, somando apenas as combinações com página publicada.`,
    espacial: `${mun.nome}, ${sigla}, Brasil`,
    meta,
    variaveis: [
      { nome: 'Estabelecimentos ativos nas páginas publicadas', valor: total, unidade: 'estabelecimentos' },
      { nome: 'Matrizes entre os ativos', valor: matrizes, unidade: 'estabelecimentos' },
      { nome: 'Aberturas em 12 meses', valor: abertos, unidade: 'estabelecimentos' },
      { nome: 'Baixas de CNPJ em 12 meses', valor: baixas, unidade: 'estabelecimentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: UFS[sigla], caminho: `/${uf}` }, { nome: mun.nome, caminho: `/${uf}/${municipio}` }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: UFS[sigla], href: `/${uf}` }, { nome: mun.nome }]} />
      <h1>Estabelecimentos ativos por segmento em {mun.nome} ({sigla})</h1>
      <p className="lead">
        {mun.nome} tem {n(total)} estabelecimentos com CNPJ ativo nos {segs.length} {plural}, segundo o cadastro aberto da
        Receita Federal (competência {comp}, dados gerados em {dataCurta(meta.geradoEm)}). O maior é {maior.seg.curto}, com {n(maior.reg.a)}.
      </p>

      <Definicao termo={`O que o Índice conta em ${mun.nome}?`}>
        <p>
          Os números são contagens de estabelecimentos, não de empresas únicas: matriz e filial do mesmo grupo contam
          separadamente quando têm CNPJ próprio. O total abaixo cobre apenas os segmentos com página publicada neste
          município, não todas as atividades econômicas locais. Situação cadastral ativa não garante operação em
          funcionamento. O Índice não mede reputação, faturamento nem qualidade do atendimento.
        </p>
      </Definicao>

      <div className="cards">
        <div className="card"><strong>{n(total)}</strong><small>estabelecimentos ativos nos segmentos com página</small></div>
        <div className="card"><strong>{pct(matrizes, total)}</strong><small>{n(matrizes)} matrizes e {n(total - matrizes)} filiais</small></div>
        <div className="card"><strong>{n(abertos)}</strong><small>iniciaram atividade nos segmentos com página ({janela})</small></div>
        <div className="card"><strong>{n(baixas)}</strong><small>CNPJs baixados nos segmentos com página no mesmo período</small></div>
      </div>

      <h2>Estabelecimentos por segmento em {mun.nome}</h2>
      <table>
        <caption>
          Competência {comp}; aberturas e baixas na janela de {janela}. “Parcela do total” usa como denominador a soma dos
          ativos dos segmentos publicados neste município.
        </caption>
        <thead>
          <tr>
            <th scope="col">Segmento</th>
            <th scope="col" className="num">Ativos<small>unidades</small></th>
            <th scope="col" className="num">Matrizes<small>% dos ativos</small></th>
            <th scope="col" className="num">Abertos em 12 meses<small>unidades · {janela}</small></th>
            <th scope="col" className="num">Baixas em 12 meses<small>unidades · {janela}</small></th>
            <th scope="col" className="num">Parcela do total<small>% dos ativos publicados</small></th>
          </tr>
        </thead>
        <tbody>
          {segs.map(({ seg, reg }) => (
            <tr key={seg.slug}>
              <th scope="row"><Link href={`/${uf}/${municipio}/${seg.slug}`}>{seg.nome}</Link><small>CNAE {seg.classes.join(', ')}</small></th>
              <td className="num">{n(reg.a)}</td>
              <td className="num">{pct(reg.m, reg.a)}</td>
              <td className="num">{n(reg.ab)}</td>
              <td className="num">{n(reg.ba)}</td>
              <td className="num">{pct(reg.a, total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{n(total)}</td>
            <td className="num">{pct(matrizes, total)}</td>
            <td className="num">{n(abertos)}</td>
            <td className="num">{n(baixas)}</td>
            <td className="num">100%</td>
          </tr>
        </tfoot>
      </table>
      <p className="nota">
        A soma de aberturas e baixas não é um saldo líquido: são eventos contados em universos diferentes e a base pode
        revisar registros retroativamente. <Link href="/metodologia">Veja a metodologia completa</Link>.
      </p>

      <Faq itens={faq} />

      <FonteDados />
      <Citacao caminho={`/${uf}/${municipio}`} titulo={`Estabelecimentos ativos por segmento em ${mun.nome} (${sigla})`} />
      <Cta campanha={`${uf}-${municipio}`} texto={`Quem pesquisa uma empresa em ${mun.nome} compara nota e comentários. Veja como está a reputação do seu negócio no Google.`} />
    </>
  );
}
