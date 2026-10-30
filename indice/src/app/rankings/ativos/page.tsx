import type { Metadata } from 'next';
import Link from 'next/link';
import { coberturaDoSegmento, getMeta, getSegmentos, resumoDoIndice } from '@/lib/data';
import { n, mesPorExtenso, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, datasetDoRecorte, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'Rankings de estabelecimentos ativos por segmento e estado';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const meta = getMeta();
  const descricao = corta(
    `Rankings de municípios com mais estabelecimentos ativos por segmento, no Brasil e por estado, calculados do cadastro aberto da Receita Federal. Competência ${mesPorExtenso(meta.competencia)}, dados gerados em ${dataCurta(meta.geradoEm)}.`,
    158,
  );
  const url = urlAbsoluta('/rankings/ativos');
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: descricao, url, type: 'website', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
  };
}

export default function Page() {
  const meta = getMeta();
  const comp = mesPorExtenso(meta.competencia);
  const segmentos = getSegmentos().map((seg) => ({ seg, cobertura: coberturaDoSegmento(seg.slug) }));
  const totalAtivos = segmentos.reduce((t, s) => t + s.cobertura.total, 0);
  const totalMunicipios = resumoDoIndice().municipiosComPagina;

  const faq: ItemFaq[] = [
    {
      pergunta: 'O que é o ranking de estabelecimentos ativos?',
      resposta: `É a lista de municípios com mais estabelecimentos com CNPJ ativo em um segmento, no Brasil ou dentro de um estado, na competência ${comp}. Empates dividem a mesma posição. O ranking mede estoque de estabelecimentos, não reputação nem demanda.`,
    },
    {
      pergunta: 'Como o ranking é calculado?',
      resposta: 'Cada município é ordenado pelo número de estabelecimentos com situação cadastral ativa e atividade principal no segmento. Matriz e filial contam separadamente. Só entram municípios com página publicada no Índice, ou seja, com pelo menos o mínimo de estabelecimentos ativos no segmento.',
    },
    {
      pergunta: 'Por que nem todo estado tem ranking?',
      resposta: 'O recorte por estado só é publicado quando há municípios suficientes para uma comparação útil. Estados com poucos municípios no segmento ficam apenas no ranking nacional.',
    },
    {
      pergunta: 'O ranking indica os melhores lugares para abrir um negócio?',
      resposta: 'Não. Ele conta estabelecimentos cadastrados. Demanda, concorrência por habitante, faturamento e reputação não fazem parte do conjunto de dados.',
    },
  ];

  const dataset = datasetDoRecorte({
    url: urlAbsoluta('/rankings/ativos'),
    name: titulo,
    description: 'Lista de rankings de estabelecimentos ativos por município e segmento, no Brasil e por estado, calculados da base aberta do CNPJ.',
    espacial: 'Brasil',
    meta,
    variaveis: [
      { nome: 'Estabelecimentos ativos nos segmentos', valor: totalAtivos, unidade: 'estabelecimentos' },
      { nome: 'Segmentos com ranking', valor: segmentos.length, unidade: 'segmentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: 'Rankings de ativos', caminho: '/rankings/ativos' }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: 'Rankings de ativos' }]} />

      <span className="pilula">Competência {comp}</span>
      <h1>{titulo}</h1>
      <p className="lead">
        Os rankings listam os municípios com mais estabelecimentos com CNPJ ativo em cada segmento, no Brasil e por
        estado, calculados da mesma base do Índice (cadastro aberto da Receita Federal). Competência {comp}, dados
        gerados em {dataCurta(meta.geradoEm)}. São contagens de estabelecimentos, não de empresas únicas, e não mede
        reputação.
      </p>

      <div className="cards">
        <div className="card"><strong>{n(totalAtivos)}</strong><small>estabelecimentos ativos nos {segmentos.length} segmentos, no Brasil</small></div>
        <div className="card"><strong>{segmentos.length}</strong><small>segmentos com ranking nacional</small></div>
        <div className="card"><strong>{n(totalMunicipios)}</strong><small>municípios com ao menos uma página de segmento</small></div>
      </div>

      <h2>Escolha um segmento</h2>
      <ul className="segmentos">
        {segmentos.map(({ seg, cobertura }) => (
          <li key={seg.slug}>
            <Link className="seg-card" href={`/rankings/ativos/${seg.slug}`}>
              <b>{seg.nome}</b>
              <span className="num-grande">{n(cobertura.total)}</span>
              <span>estabelecimentos ativos no Brasil · {n(cobertura.municipiosComPagina)} municípios com página</span>
              <span className="ir">Ver ranking</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Dados por segmento</h2>
      <div className="tabela">
        <table>
          <caption>
            Segmentos acompanhados, estabelecimentos ativos no Brasil e municípios com página publicada, competência {comp}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Segmento</th>
              <th scope="col" className="num">Ativos<small>Brasil</small></th>
              <th scope="col" className="num">Municípios com página</th>
              <th scope="col">Ranking</th>
            </tr>
          </thead>
          <tbody>
            {segmentos.map(({ seg, cobertura }) => (
              <tr key={seg.slug}>
                <th scope="row">{seg.nome}</th>
                <td className="num">{n(cobertura.total)}</td>
                <td className="num">{n(cobertura.municipiosComPagina)}</td>
                <td><Link href={`/rankings/ativos/${seg.slug}`}>Ver ranking</Link></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="num">{n(totalAtivos)}</td>
              <td className="num">—</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p>
        Para eventos de abertura por ano, veja os <Link href="/rankings/aberturas">rankings de aberturas</Link>. Para
        entender como os dados são coletados e o que não é medido, leia a <Link href="/metodologia">metodologia</Link>.
      </p>

      <Cta
        campanha="rankings-ativos"
        texto="Estar em um mercado com muitos estabelecimentos muda a comparação do cliente. Veja como está a reputação do seu negócio."
      />
      <Faq itens={faq} semJsonLd />
      <FonteDados />
      <Citacao caminho="/rankings/ativos" titulo={titulo} />
    </>
  );
}
