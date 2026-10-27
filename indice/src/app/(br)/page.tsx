import type { Metadata } from 'next';
import Link from 'next/link';
import { coberturaDoSegmento, getMeta, getSegmentos, resumoDoIndice, topMunicipios, ufsComDados } from '@/lib/data';
import { n, pct, mesPorExtenso, mesCurto, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, datasetDoIndice } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

export const revalidate = 86400;

const titulo = 'Índice Filtra.AI: estabelecimentos ativos por município e segmento';

export function generateMetadata(): Metadata {
  const meta = getMeta();
  const r = resumoDoIndice();
  const descricao = corta(
    `Contagens de ${n(r.ativosNosSegmentos)} estabelecimentos com CNPJ ativo em ${r.segmentos} segmentos, por estado e município. Fonte: Receita Federal, competência ${mesCurto(meta.competencia)}.`,
    158,
  );
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
  const segmentos = getSegmentos();
  const ufs = ufsComDados();
  const resumo = resumoDoIndice();
  const coberturaGeral = resumo.ativosNosSegmentos ? pct(resumo.ativosNasPaginas, resumo.ativosNosSegmentos) : '0%';
  const comp = mesPorExtenso(meta.competencia);

  const faq: ItemFaq[] = [
    {
      pergunta: 'O que é o Índice Filtra.AI?',
      resposta: `É um levantamento mensal de estabelecimentos com CNPJ ativo nos ${resumo.segmentos} segmentos acompanhados, agregados por estado e município a partir do cadastro aberto da Receita Federal. Conta estabelecimentos, não empresas únicas, e não mede reputação, faturamento ou qualidade.`,
    },
    {
      pergunta: 'Quantos estabelecimentos ativos o Índice cobre?',
      resposta: `Na competência ${comp}, os ${resumo.segmentos} segmentos somam ${n(resumo.ativosNosSegmentos)} estabelecimentos com CNPJ ativo em todos os municípios da base. As páginas publicadas cobrem ${n(resumo.ativosNasPaginas)} deles (${coberturaGeral}), em ${n(resumo.municipiosComPagina)} municípios.`,
    },
    {
      pergunta: 'Os números são o total de empresas brasileiras?',
      resposta: `Não. O Índice cobre apenas ${resumo.segmentos} segmentos definidos por atividade econômica principal (CNAE) e só publica páginas para combinações com pelo menos ${n(meta.minimoParaIndexar)} estabelecimentos ativos. Atividades fora desses segmentos, negócios sem CNPJ e empresas com a atividade apenas como secundária não entram na contagem.`,
    },
    {
      pergunta: 'De onde vêm os dados e qual é a competência?',
      resposta: `Do Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos, da Receita Federal do Brasil. A competência é ${comp} e os dados foram gerados em ${dataCurta(meta.geradoEm)}.`,
    },
    {
      pergunta: 'Com que frequência o Índice é atualizado?',
      resposta: `A ingestão é mensal e a página exibe a competência e a data de geração efetivamente processadas. O conteúdo pode ficar alguns dias atrás da publicação da Receita; não há atualização em tempo real.`,
    },
    {
      pergunta: 'O Índice mede a reputação das empresas?',
      resposta: 'Não. Ele conta estabelecimentos com situação cadastral ativa. Nota, comentários, faturamento, qualidade do atendimento e participação de mercado não fazem parte do conjunto de dados.',
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }])} />
      <JsonLd data={datasetDoIndice(meta)} />
      <Migalhas itens={[{ nome: 'Índice' }]} />
      <h1>Estabelecimentos ativos por município e segmento no Brasil</h1>
      <p className="lead">
        O Índice Filtra.AI reúne contagens mensais de estabelecimentos com CNPJ ativo nos {resumo.segmentos} segmentos acompanhados,
        por estado e município. Fonte: cadastro aberto da Receita Federal, competência {comp}.
      </p>

      <Definicao termo="O que é o Índice Filtra.AI?">
        <p>
          O Índice Filtra.AI é um levantamento de estabelecimentos com CNPJ ativo, classificados pela atividade econômica
          principal (CNAE) e localizados por município. Ele conta unidades cadastradas — matrizes e filiais separadamente —
          e não mede reputação, faturamento nem o total de empresas brasileiras.
        </p>
      </Definicao>

      <div className="cards">
        <div className="card"><strong>{n(resumo.ativosNosSegmentos)}</strong><small>estabelecimentos ativos nos {resumo.segmentos} segmentos (Brasil)</small></div>
        <div className="card"><strong>{n(resumo.municipiosComPagina)}</strong><small>municípios com página publicada</small></div>
        <div className="card"><strong>{resumo.ufs}</strong><small>estados com dados</small></div>
        <div className="card"><strong>{coberturaGeral}</strong><small>dos ativos está em municípios com página</small></div>
      </div>

      <h2>O que o Índice cobre</h2>
      <table>
        <caption>
          Estabelecimentos ativos por segmento, competência {comp}. “Ativos no Brasil” inclui todos os municípios da base;
          “ativos nas páginas” inclui só os municípios com página publicada. A cobertura usa como denominador os ativos do
          segmento no Brasil.
        </caption>
        <thead>
          <tr>
            <th scope="col">Segmento</th>
            <th scope="col" className="num">Ativos no Brasil<small>unidades</small></th>
            <th scope="col" className="num">Municípios com página<small>unidades</small></th>
            <th scope="col" className="num">Ativos nas páginas<small>unidades</small></th>
            <th scope="col" className="num">Cobertura<small>% do segmento</small></th>
          </tr>
        </thead>
        <tbody>
          {segmentos.map((seg) => {
            const c = coberturaDoSegmento(seg.slug);
            return (
              <tr key={seg.slug}>
                <th scope="row">{seg.nome}<small>CNAE {seg.classes.join(', ')}</small></th>
                <td className="num">{n(c.total)}</td>
                <td className="num">{n(c.municipiosComPagina)}</td>
                <td className="num">{n(c.totalNasPaginas)}</td>
                <td className="num">{pct(c.totalNasPaginas, c.total)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{n(resumo.ativosNosSegmentos)}</td>
            <td className="num">{n(resumo.municipiosComPagina)}<small>municípios distintos</small></td>
            <td className="num">{n(resumo.ativosNasPaginas)}</td>
            <td className="num">{coberturaGeral}</td>
          </tr>
        </tfoot>
      </table>
      <p className="nota">
        A coluna de municípios soma páginas por segmento; o total do rodapé conta municípios distintos, pois um município pode
        ter página em mais de um segmento. Páginas só são publicadas a partir de {n(meta.minimoParaIndexar)} estabelecimentos
        ativos na combinação município × segmento.
      </p>

      <h2>Escolha um estado</h2>
      <ul className="grade">
        {ufs.map((u) => (
          <li key={u.sigla}>
            <Link href={`/${u.sigla.toLowerCase()}`}>{u.nome}<small>{n(u.municipios)} municípios com página</small></Link>
          </li>
        ))}
      </ul>

      <h2>Maiores municípios por segmento</h2>
      <p className="nota">
        Posição entre os municípios com ao menos um estabelecimento ativo do segmento na base. Cada página de município e
        segmento mostra a posição e a participação no estado e no Brasil.
      </p>
      {segmentos.map((seg) => {
        const top = topMunicipios(seg.slug, 5);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h3>{seg.nome}</h3>
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

      <h2>Como ler os números</h2>
      <ul>
        <li><strong>Estabelecimento não é empresa.</strong> Matriz e filiais do mesmo grupo contam separadamente, desde que tenham CNPJ próprio.</li>
        <li><strong>Ativo no cadastro não significa em funcionamento.</strong> A situação cadastral pode estar ativa mesmo com a operação parada.</li>
        <li><strong>A atividade principal define o segmento.</strong> Quem tem a atividade como secundária não é contado nesse segmento.</li>
        <li><strong>Abertura e baixa não formam um saldo.</strong> São eventos do período, contados em universos diferentes.</li>
      </ul>

      <Faq itens={faq} />

      <FonteDados />
      <Citacao caminho="/" />
      <Cta campanha="home" texto="Quem pesquisa uma empresa compara nota, comentários e presença no Google. Veja como está a reputação do seu negócio." />
    </>
  );
}
