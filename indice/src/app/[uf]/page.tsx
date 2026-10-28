import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { coberturaDoSegmento, getMeta, getSegmentos, municipiosDaUF, topMunicipios } from '@/lib/data';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, pct, mesPorExtenso, mesCurto, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, datasetDoRecorte } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
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
  const titulo = `Estabelecimentos ativos por segmento no estado de ${UFS[r.sigla]} (${r.sigla})`;
  const descricao = corta(
    `Contagens de estabelecimentos com CNPJ ativo em ${r.municipios.length} municípios de ${UFS[r.sigla]}, por segmento. Fonte: Receita Federal, competência ${mesCurto(meta.competencia)}.`,
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
  const comp = mesPorExtenso(meta.competencia);
  const coberturas = getSegmentos()
    .map((seg) => ({ seg, c: coberturaDoSegmento(seg.slug, sigla) }))
    .filter(({ c }) => c.totalNasPaginas > 0);
  const totalEstado = coberturas.reduce((t, x) => t + x.c.total, 0);
  const totalPublicado = coberturas.reduce((t, x) => t + x.c.totalNasPaginas, 0);
  const coberturaEstado = totalEstado ? pct(totalPublicado, totalEstado) : '0%';

  const faq: ItemFaq[] = [
    {
      pergunta: `Quantos estabelecimentos ativos o Índice cobre em ${nome}?`,
      resposta: `São ${n(totalPublicado)} estabelecimentos com CNPJ ativo nas páginas publicadas de ${nome}, em ${n(municipios.length)} municípios. Esse total cobre ${coberturaEstado} dos ${n(totalEstado)} estabelecimentos dos segmentos acompanhados em todos os municípios do estado na competência ${comp}.`,
    },
    {
      pergunta: `O total de ${nome} é o total de empresas do estado?`,
      resposta: `Não. O Índice cobre apenas ${coberturas.length} segmentos definidos por atividade econômica principal (CNAE), conta estabelecimentos (matriz e filial separadamente) e só publica páginas para combinações com pelo menos ${n(meta.minimoParaIndexar)} estabelecimentos ativos. Empresas de outras atividades, negócios sem CNPJ e atividades secundárias ficam fora.`,
    },
    {
      pergunta: `Quais municípios de ${nome} têm página no Índice?`,
      resposta: `Os ${n(municipios.length)} municípios listados nesta página têm ao menos uma combinação município × segmento com ${n(meta.minimoParaIndexar)} ou mais estabelecimentos ativos. Municípios abaixo desse limite não recebem página, mas continuam incluídos nos totais estaduais e brasileiros do segmento.`,
    },
    {
      pergunta: 'De onde vêm os dados e qual é o período?',
      resposta: `Do Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos, da Receita Federal do Brasil. A competência é ${comp}, os dados foram gerados em ${dataCurta(meta.geradoEm)} e a janela de aberturas e baixas vai de ${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}.`,
    },
  ];

  const dataset = datasetDoRecorte({
    url: urlAbsoluta(`/${uf}`),
    name: `Estabelecimentos ativos por segmento no estado de ${nome} (${sigla})`,
    description: `Contagens de estabelecimentos com CNPJ ativo nos segmentos acompanhados pelo Índice em ${nome}, com totais do estado e das páginas publicadas.`,
    espacial: `${nome}, ${sigla}, Brasil`,
    meta,
    variaveis: [
      { nome: 'Estabelecimentos ativos nas páginas publicadas', valor: totalPublicado, unidade: 'estabelecimentos' },
      { nome: 'Estabelecimentos ativos nos segmentos em todo o estado', valor: totalEstado, unidade: 'estabelecimentos' },
      { nome: 'Municípios com página publicada', valor: municipios.length, unidade: 'municípios' },
      { nome: 'Segmentos com página publicada', valor: coberturas.length, unidade: 'segmentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome, caminho: `/${uf}` }])} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome }]} />
      <h1>Estabelecimentos ativos por segmento no estado de {nome} ({sigla})</h1>
      <p className="lead">
        O Índice acompanha {coberturas.length} segmentos em {n(municipios.length)} municípios de {nome} com página publicada.
        São {n(totalPublicado)} estabelecimentos com CNPJ ativo nas páginas do estado, de {n(totalEstado)} nos segmentos
        acompanhados em todos os municípios da base ({coberturaEstado}). Competência {comp}, dados gerados em {dataCurta(meta.geradoEm)}.
      </p>

      <Definicao termo={`O que o Índice conta em ${nome}?`}>
        <p>
          O recorte estadual reúne contagens de estabelecimentos com CNPJ ativo, classificados pela atividade econômica
          principal (CNAE) e localizados por município. A unidade é o estabelecimento: matriz e filial do mesmo grupo contam
          separadamente. O total não representa todas as empresas do estado. O Índice não mede reputação, faturamento nem
          qualidade do atendimento.
        </p>
      </Definicao>

      <div className="cards">
        <div className="card"><strong>{n(totalPublicado)}</strong><small>ativos nas páginas publicadas</small></div>
        <div className="card"><strong>{n(municipios.length)}</strong><small>municípios com página</small></div>
        <div className="card"><strong>{coberturas.length}</strong><small>segmentos com página</small></div>
        <div className="card"><strong>{coberturaEstado}</strong><small>dos ativos do estado nos segmentos</small></div>
      </div>

      <h2>Estabelecimentos ativos por segmento em {nome}</h2>
      <table>
        <caption>
          Competência {comp}. “Ativos no estado” inclui todos os municípios da base; “ativos nas páginas” inclui apenas os
          municípios com página publicada. A cobertura usa como denominador os ativos do segmento no estado.
        </caption>
        <thead>
          <tr>
            <th scope="col">Segmento</th>
            <th scope="col" className="num">Ativos no estado<small>unidades</small></th>
            <th scope="col" className="num">Municípios no segmento<small>unidades</small></th>
            <th scope="col" className="num">Municípios com página<small>unidades</small></th>
            <th scope="col" className="num">Ativos nas páginas<small>unidades</small></th>
            <th scope="col" className="num">Cobertura<small>% do segmento</small></th>
          </tr>
        </thead>
        <tbody>
          {coberturas.map(({ seg, c }) => (
            <tr key={seg.slug}>
              <th scope="row">{seg.nome}<small>CNAE {seg.classes.join(', ')}</small></th>
              <td className="num">{n(c.total)}</td>
              <td className="num">{n(c.municipiosNoSegmento)}</td>
              <td className="num">{n(c.municipiosComPagina)}</td>
              <td className="num">{n(c.totalNasPaginas)}</td>
              <td className="num">{pct(c.totalNasPaginas, c.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{n(totalEstado)}</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">{n(totalPublicado)}</td>
            <td className="num">{coberturaEstado}</td>
          </tr>
        </tfoot>
      </table>
      <p className="nota">
        As colunas de municípios não somam: um município pode ter página em mais de um segmento. O total do estado inclui
        municípios sem página, que entram nos totais do segmento mas não geram página própria.
      </p>

      <h2>Maiores municípios por segmento em {nome}</h2>
      {coberturas.map(({ seg }) => {
        const top = topMunicipios(seg.slug, 5, sigla);
        if (!top.length) return null;
        return (
          <section key={seg.slug}>
            <h3>{seg.nome}</h3>
            <ul className="lista">
              {top.map(({ mun, a }) => (
                <li key={mun.slug}><Link href={`/${uf}/${mun.slug}/${seg.slug}`}>{mun.nome}</Link><span>{n(a)} ativos</span></li>
              ))}
            </ul>
          </section>
        );
      })}

      <h2>Todos os municípios de {nome} com página no Índice</h2>
      <table>
        <caption>
          Ativos somados apenas nos segmentos com página publicada em cada município. Competência {comp}. O rodapé soma a
          coluna de ativos publicados no estado.
        </caption>
        <thead>
          <tr>
            <th scope="col">Município</th>
            <th scope="col" className="num">Ativos nas páginas<small>unidades</small></th>
            <th scope="col" className="num">Segmentos com página<small>unidades</small></th>
          </tr>
        </thead>
        <tbody>
          {municipios.map(({ mun, total, segmentos }) => (
            <tr key={mun.slug}>
              <th scope="row"><Link href={`/${uf}/${mun.slug}`}>{mun.nome}</Link></th>
              <td className="num">{n(total)}</td>
              <td className="num">{n(segmentos)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{n(totalPublicado)}</td>
            <td className="num">—</td>
          </tr>
        </tfoot>
      </table>
      <p className="nota">
        O total do rodapé soma os ativos das páginas publicadas; a coluna de segmentos não é somada porque o mesmo município
        pode aparecer em vários segmentos.
      </p>

      <Faq itens={faq} />

      <FonteDados />
      <Citacao caminho={`/${uf}`} titulo={`Estabelecimentos ativos por segmento em ${nome} (${sigla})`} />
      <Cta campanha={uf} texto={`Atua em ${nome}? Veja como está a reputação do seu negócio no Google.`} />
    </>
  );
}
