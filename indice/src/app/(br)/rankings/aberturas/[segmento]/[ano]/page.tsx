import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getRegistro, getSegmento, getSegmentos, minimo } from '@/lib/data';
import { anosPublicadosDoSegmento, getPaginaRanking, nomeDoMunicipio, type PaginaRanking } from '@/lib/rankings';
import { UFS } from '@/lib/ufs';
import { n, ord, pct, mesPorExtenso, mesCurto, corta, dataCurta, minuscula } from '@/lib/format';
import { JsonLd, breadcrumb, datasetDoRecorte, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Barras } from '@/components/Barras';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ segmento: string; ano: string }> };

export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(segmento: string, ano: string) {
  const pagina = getPaginaRanking(segmento, ano);
  return pagina ?? null;
}

/** Só vira link para a página do município quando a célula é publicada (ativos >= mínimo). */
function temPaginaDeMunicipio(uf: string, mun: string, seg: string): boolean {
  const reg = getRegistro(uf, mun, seg);
  return Boolean(reg && reg.a >= minimo());
}

function textos(p: PaginaRanking) {
  const meta = getMeta();
  const comp = mesPorExtenso(meta.competencia);
  const { seg, ano, ranking } = p;
  const titulo = `Ranking de aberturas de ${seg.nome} em ${ano} por município`;
  const descricao = corta(
    `Em ${ano}, ${n(ranking.total)} estabelecimentos de ${minuscula(seg.nome)} iniciaram atividade no Brasil, em ${n(ranking.municipiosComAbertura)} municípios. Competência ${comp}, dados gerados em ${dataCurta(meta.geradoEm)}.`,
    158,
  );
  const primeiro = ranking.ordenado[0];
  const empatadosNoTopo = ranking.ordenado.filter((item) => item.v === primeiro.v);
  const quem = empatadosNoTopo.length === 1
    ? `${nomeDoMunicipio(primeiro.uf, primeiro.municipio)} (${primeiro.uf})`
    : empatadosNoTopo.map((item) => `${nomeDoMunicipio(item.uf, item.municipio)} (${item.uf})`).join(' e ');
  const faq: ItemFaq[] = [
    {
      pergunta: `Qual município teve mais aberturas de ${seg.curto} em ${ano}?`,
      resposta: `${quem}, com ${n(primeiro.v)} estabelecimentos com início de atividade em ${ano} — ${pct(primeiro.v, ranking.total)} do total de ${n(ranking.total)} do segmento no Brasil, na base aberta da Receita Federal (competência ${comp}).`,
    },
    {
      pergunta: 'O que conta como abertura neste ranking?',
      resposta: `Estabelecimentos com CNPJ e data de início de atividade no ano de ${ano}, qualquer que seja a situação cadastral atual. Não é saldo líquido: a abertura inclui quem depois teve o CNPJ baixado, e baixa cadastral não equivale a fechamento do negócio.`,
    },
    {
      pergunta: 'Por que não há ranking do ano em curso?',
      resposta: `O ano da competência (${n(p.anoComp)}) está em andamento na base processada e teria cobertura parcial; só anos fechados viram ranking. As aberturas do ano parcial aparecem no gráfico da série, marcadas como parciais.`,
    },
    {
      pergunta: 'O ranking mede reputação, qualidade ou tamanho do mercado?',
      resposta: 'Não. Ele conta eventos cadastrais (início de atividade) por município. Nota, comentários, faturamento e qualidade não fazem parte do conjunto de dados, e mais aberturas não significam mercado melhor nem mais demanda.',
    },
  ];
  return { meta, comp, titulo, descricao, faq };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segmento, ano } = await params;
  const p = resolver(segmento, ano);
  if (!p) return { robots: { index: false } };
  const t = textos(p);
  const url = urlAbsoluta(`/rankings/aberturas/${segmento}/${ano}`);
  return {
    title: { absolute: t.titulo },
    description: t.descricao,
    alternates: { canonical: url },
    openGraph: { title: t.titulo, description: t.descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.titulo, description: t.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { segmento, ano } = await params;
  const p = resolver(segmento, ano);
  if (!p) notFound();
  const t = textos(p);
  const { seg, ranking } = p;
  const caminho = `/rankings/aberturas/${segmento}/${ano}`;
  const top10 = ranking.ordenado.slice(0, 10);
  const anos = Object.keys(p.serie).map(Number);
  const anoParcial = anos.includes(p.anoComp) ? p.anoComp : undefined;
  const outrosAnos = p.anosPublicados.filter((a) => a !== p.ano);
  const outrosSegmentos = getSegmentos()
    .filter((s) => s.slug !== seg.slug && anosPublicadosDoSegmento(s.slug).includes(p.ano))
    .map((s) => s.slug);

  const dataset = datasetDoRecorte({
    url: urlAbsoluta(caminho),
    name: `Ranking de aberturas de ${seg.nome} em ${p.ano} por município`,
    description: t.descricao,
    espacial: 'Brasil',
    meta: t.meta,
    temporal: `${p.ano}-01/${p.ano}-12`,
    variaveis: [
      { nome: `Aberturas no Brasil em ${p.ano}`, valor: ranking.total, unidade: 'estabelecimentos' },
      { nome: 'Municípios com abertura no ano', valor: ranking.municipiosComAbertura, unidade: 'municípios' },
      { nome: 'Aberturas do município líder', valor: ranking.ordenado[0].v, unidade: 'estabelecimentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd
        data={breadcrumb([
          { nome: 'Índice', caminho: '/' },
          { nome: 'Rankings de aberturas', caminho: '/rankings/aberturas' },
          { nome: seg.nome, caminho: caminho },
        ])}
      />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: 'Rankings de aberturas', href: '/rankings/aberturas' }, { nome: seg.nome, href: caminho }]} />

      <h1>{t.titulo}</h1>
      <p className="lead">{p.resposta}</p>

      <div className="cards">
        <div className="card"><strong>{n(ranking.total)}</strong><small>estabelecimentos iniciaram atividade no Brasil em {p.ano}</small></div>
        <div className="card"><strong>{n(ranking.municipiosComAbertura)}</strong><small>municípios com ao menos uma abertura no ano</small></div>
        <div className="card"><strong>{pct(ranking.ordenado[0].v, ranking.total)}</strong><small>das aberturas do ano no município líder</small></div>
        <div className="card"><strong>{n(ranking.porUF.length)}</strong><small>estados com abertura registrada no ano</small></div>
      </div>

      <Definicao termo="O que este ranking conta">
        <ul>
          <li>Conta estabelecimentos com CNPJ e data de início de atividade em {p.ano}, qualquer que seja a situação cadastral atual.</li>
          <li>A unidade é o estabelecimento: matriz e filial contam separadamente. Não é o total de empresas do município.</li>
          <li>O ano de {p.ano} é fechado; o ano da competência ({p.anoComp}) é parcial e não gera ranking.</li>
          <li>Não mede reputação, faturamento, qualidade nem demanda. Mais aberturas não significam mercado melhor.</li>
        </ul>
      </Definicao>

      <h2>Os 10 municípios com mais aberturas de {minuscula(seg.curto)} em {p.ano}</h2>
      <table>
        <caption>
          Estabelecimentos de {minuscula(seg.curto)} com início de atividade em {p.ano}, por município, em todo o Brasil.
          “Parcela” usa como denominador o total de aberturas do segmento no ano ({n(ranking.total)}). Empates dividem a
          mesma posição.
        </caption>
        <thead>
          <tr>
            <th scope="col">Posição</th>
            <th scope="col">Município</th>
            <th scope="col" className="num">Aberturas em {p.ano}<small>unidades</small></th>
            <th scope="col" className="num">Parcela<small>% do total no Brasil</small></th>
          </tr>
        </thead>
        <tbody>
          {top10.map((item) => (
            <tr key={`${item.uf}-${item.municipio}`}>
              <td className="num">{ord(item.posicao)}</td>
              <th scope="row">
                {temPaginaDeMunicipio(item.uf, item.municipio, seg.slug) ? (
                  <Link href={`/${item.uf.toLowerCase()}/${item.municipio}/${seg.slug}`}>{nomeDoMunicipio(item.uf, item.municipio)} ({item.uf})</Link>
                ) : (
                  <span>{nomeDoMunicipio(item.uf, item.municipio)} ({item.uf})</span>
                )}
              </th>
              <td className="num">{n(item.v)}</td>
              <td className="num">{pct(item.v, ranking.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2}>Total no Brasil em {p.ano}</th>
            <td className="num">{n(ranking.total)}</td>
            <td className="num">100%</td>
          </tr>
        </tfoot>
      </table>
      <p className="nota">
        O ranking inclui todos os municípios da base com ao menos uma abertura no ano, não apenas os que têm página
        publicada. Municípios maiores tendem a concentrar mais aberturas; para comparar tamanhos diferentes, use a parcela
        e o total. A base da Receita pode revisar registros retroativamente, e a próxima ingestão recalcula os números.
      </p>

      {anos.length > 0 && (
        <>
          <h2>Evolução anual de aberturas de {minuscula(seg.curto)} no Brasil</h2>
          <Barras
            serie={p.serie}
            anoParcial={anoParcial}
            descricao={`Estabelecimentos de ${seg.curto} no Brasil por ano de início de atividade, de ${Math.min(...anos)} a ${Math.max(...anos)}.`}
          />
          <p className="nota">
            Cada barra conta estabelecimentos que iniciaram atividade naquele ano, inclusive os que depois foram baixados.
            {anoParcial ? ` A barra de ${anoParcial} é parcial (início de atividade até ${mesCurto(t.meta.janela.fim)}) e por isso não gera ranking.` : ` O último ano com aberturas registradas é ${Math.max(...anos)}.`}
            Não é o estoque ativo.
          </p>
        </>
      )}

      <h2>Líderes por estado em {p.ano}</h2>
      <table>
        <caption>
          Município com mais aberturas de {minuscula(seg.curto)} em {p.ano} em cada estado, com o total do estado no ano.
          Estados sem abertura registrada no ano não aparecem. “Parcela na UF” usa como denominador o total de aberturas do
          segmento no estado.
        </caption>
        <thead>
          <tr>
            <th scope="col">Estado</th>
            <th scope="col">Município com mais aberturas</th>
            <th scope="col" className="num">Aberturas do líder<small>unidades</small></th>
            <th scope="col" className="num">Aberturas no estado<small>unidades</small></th>
            <th scope="col" className="num">Parcela na UF<small>% do estado</small></th>
          </tr>
        </thead>
        <tbody>
          {ranking.porUF.map((linha) => (
            <tr key={linha.uf}>
              <th scope="row">{UFS[linha.uf] ?? linha.uf} ({linha.uf})</th>
              <td>
                {linha.lider && temPaginaDeMunicipio(linha.uf, linha.lider.municipio, seg.slug) ? (
                  <Link href={`/${linha.uf.toLowerCase()}/${linha.lider.municipio}/${seg.slug}`}>{nomeDoMunicipio(linha.uf, linha.lider.municipio)}</Link>
                ) : linha.lider ? (
                  <span>{nomeDoMunicipio(linha.uf, linha.lider.municipio)}</span>
                ) : (
                  '—'
                )}
              </td>
              <td className="num">{linha.lider ? n(linha.lider.v) : '—'}</td>
              <td className="num">{n(linha.total)}</td>
              <td className="num">{linha.lider ? pct(linha.lider.v, linha.total) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="nota">
        A coluna de líderes compara municípios dentro do mesmo estado e do mesmo período; não compare estados entre si
        apenas pelo total, porque a base do segmento tem tamanhos diferentes em cada um.
      </p>

      {(outrosAnos.length > 0 || outrosSegmentos.length > 0) && (
        <>
          <h2>Outros rankings</h2>
          {outrosAnos.length > 0 && (
            <p>
              Anos fechados de {minuscula(seg.curto)}:{' '}
              {outrosAnos.map((a) => (
                <span key={a}><Link href={`/rankings/aberturas/${seg.slug}/${a}`}>{a}</Link>{' '}</span>
              ))}
            </p>
          )}
          {outrosSegmentos.length > 0 && (
            <p>
              Segmentos com ranking em {p.ano}:{' '}
              {outrosSegmentos.map((slug) => {
                const s = getSegmento(slug);
                return s ? <span key={slug}><Link href={`/rankings/aberturas/${slug}/${p.ano}`}>{s.nome}</Link>{' '}</span> : null;
              })}
            </p>
          )}
        </>
      )}

      <Faq itens={t.faq} semJsonLd />

      <FonteDados />
      <Citacao caminho={caminho} titulo={t.titulo} />
      <Cta
        campanha={`rankings-${seg.slug}-${p.ano}`}
        texto={`O ranking conta aberturas cadastrais, não a reputação dos negócios. Veja como está a reputação do seu negócio com a auditoria gratuita.`}
      />
    </>
  );
}
