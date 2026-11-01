import type { Metadata } from 'next';
import Link from 'next/link';
import { getMeta, getSegmentos } from '@/lib/data';
import { anosPublicadosDoSegmento, getPaginaRanking } from '@/lib/rankings';
import { n, mesPorExtenso, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, datasetDoRecorte, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'Rankings de aberturas por município e segmento no Brasil';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const meta = getMeta();
  const descricao = corta(
    `Rankings de municípios com mais estabelecimentos que iniciaram atividade, por segmento e ano fechado, calculados do cadastro aberto da Receita Federal. Competência ${mesPorExtenso(meta.competencia)}, dados gerados em ${dataCurta(meta.geradoEm)}.`,
    158,
  );
  const url = urlAbsoluta('/rankings/aberturas');
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
  const segmentos = getSegmentos()
    .map((seg) => ({ seg, anos: anosPublicadosDoSegmento(seg.slug) }))
    .filter(({ anos }) => anos.length > 0);
  const totalPaginas = segmentos.reduce((t, { anos }) => t + anos.length, 0);

  const faq: ItemFaq[] = [
    {
      pergunta: 'O que é um ranking de aberturas?',
      resposta: `É a lista de municípios com mais estabelecimentos que iniciaram atividade em um segmento e em um ano fechado, calculada do cadastro aberto da Receita Federal. Empates dividem a mesma posição. A abertura é um evento cadastral: não é saldo líquido nem mede reputação.`,
    },
    {
      pergunta: 'Por que só alguns anos têm ranking?',
      resposta: `Só anos fechados viram ranking: o ano da competência em processamento é parcial e não tem cobertura completa. São publicados os anos completos mais recentes de cada segmento. Anos mais antigos continuam na série anual das páginas de município.`,
    },
    {
      pergunta: 'Qual é a fonte e a data de referência dos rankings?',
      resposta: `A fonte é o Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos, da Receita Federal do Brasil. A competência é ${comp} e os dados foram gerados em ${dataCurta(meta.geradoEm)}.`,
    },
  ];

  const dataset = datasetDoRecorte({
    url: urlAbsoluta('/rankings/aberturas'),
    name: titulo,
    description: 'Lista de rankings de aberturas de estabelecimentos por município, segmento e ano fechado, calculados da base aberta do CNPJ.',
    espacial: 'Brasil',
    meta,
    variaveis: [
      { nome: 'Rankings publicados', valor: totalPaginas, unidade: 'páginas' },
      { nome: 'Segmentos com ranking', valor: segmentos.length, unidade: 'segmentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: 'Rankings de aberturas', caminho: '/rankings/aberturas' }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: 'Rankings de aberturas' }]} />

      <h1>{titulo}</h1>
      <p className="lead">
        Os rankings listam os municípios com mais estabelecimentos que iniciaram atividade em cada segmento, por ano
        fechado, calculados da mesma base do Índice (cadastro aberto da Receita Federal). São {n(totalPaginas)} páginas de
        ranking publicadas, cobrindo os anos completos mais recentes. Competência {comp}, dados gerados em {dataCurta(meta.geradoEm)}.
      </p>

      <Definicao termo="O que estes rankings contam">
        <ul>
          <li>Abertura é o início de atividade registrado no CNPJ no ano indicado, qualquer que seja a situação cadastral atual.</li>
          <li>A unidade é o estabelecimento (matriz e filial separadamente); não é o total de empresas do município.</li>
          <li>Só anos fechados geram ranking; o ano da competência é parcial e aparece apenas nas séries anuais.</li>
          <li>Não mede reputação, faturamento, qualidade nem demanda: mais aberturas não significam mercado melhor.</li>
        </ul>
      </Definicao>

      <h2>Rankings publicados por segmento</h2>
      <p className="nota">
        Para o estoque de estabelecimentos ativos, veja os{' '}
        <Link href="/rankings/ativos">rankings de ativos por segmento e estado</Link>.
      </p>
      <table>
        <caption>
          Anos fechados com página de ranking por segmento. Cada página traz o top 10 nacional, os líderes por estado e a
          série anual de aberturas no Brasil.
        </caption>
        <thead>
          <tr>
            <th scope="col">Segmento</th>
            <th scope="col">Último ano publicado</th>
            <th scope="col" className="num">Aberturas no último ano<small>unidades · Brasil</small></th>
            <th scope="col">Anos anteriores</th>
          </tr>
        </thead>
        <tbody>
          {segmentos.map(({ seg, anos }) => {
            const pagina = getPaginaRanking(seg.slug, String(anos[0]));
            const anteriores = anos.slice(1);
            return (
              <tr key={seg.slug}>
                <th scope="row">{seg.nome}<small>CNAE {seg.classes.join(', ')}</small></th>
                <td><Link href={`/rankings/aberturas/${seg.slug}/${anos[0]}`}>{anos[0]}</Link></td>
                <td className="num">{pagina ? n(pagina.ranking.total) : '—'}</td>
                <td>
                  {anteriores.length ? (
                    anteriores.map((ano) => <span key={ano}><Link href={`/rankings/aberturas/${seg.slug}/${ano}`}>{ano}</Link>{' '}</span>)
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="nota">
        O ano da competência ({meta.competencia.slice(0, 4)}) está em andamento na base processada e não gera ranking; as
        aberturas desse ano aparecem nas séries anuais como parciais. Empates dividem a mesma posição, e a base da Receita
        pode revisar registros retroativamente.
      </p>

      <Faq itens={faq} semJsonLd />

      <FonteDados />
      <Citacao caminho="/rankings/aberturas" titulo={titulo} />
      <Cta
        campanha="rankings-aberturas"
        texto={`Estes rankings contam aberturas cadastrais, não a reputação. Veja como está a reputação do seu negócio com a auditoria gratuita.`}
      />
    </>
  );
}
