import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getPagina, nomeSubclasse, type Pagina } from '@/lib/data';
import { anosPublicadosDoSegmento } from '@/lib/rankings';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, ord, pct, minuscula, mesPorExtenso, mesCurto, corta, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, datasetDoRecorte, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Barras } from '@/components/Barras';
import { Citacao } from '@/components/Citacao';
import { Cta } from '@/components/Cta';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

type Props = { params: Promise<{ uf: string; municipio: string; segmento: string }> };

// Páginas geradas na primeira visita e mantidas em cache (ISR); só existem combinações com
// estabelecimentos suficientes. Sem lista no build: as dezenas de milhares de URLs não são pré-renderizadas.
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

function resolver(uf: string, municipio: string, segmento: string) {
  const sigla = ufDeSlug(uf);
  if (!sigla) return null;
  const pagina = getPagina(sigla, municipio, segmento);
  return pagina ? { sigla, pagina } : null;
}

/** Fonte única dos textos: metadados, corpo, FAQ e JSON-LD saem daqui. */
function textos(p: Pagina, sigla: string) {
  const meta = getMeta();
  const nomeUF = UFS[sigla];
  const { mun, seg, reg } = p;
  const comp = mesPorExtenso(meta.competencia);
  const janela = `${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}`;
  const posUF = p.rankUF === 1 ? `o município com o maior número do segmento no estado de ${nomeUF}` : `o ${ord(p.rankUF)} maior número do estado de ${nomeUF}`;
  const posBR = p.rankBR === 1 ? 'o maior do Brasil' : `o ${ord(p.rankBR)} do Brasil`;
  const ranking = p.totalRankBR === 1
    ? `É ${posUF} e ${posBR}.`
    : `É ${posUF} e ${posBR}, entre ${n(p.totalRankBR)} municípios com ao menos um estabelecimento do segmento na base.`;
  const participacaoUF = pct(reg.a, p.totalUF);
  const participacaoBR = pct(reg.a, p.totalBR);
  const lead = `${mun.nome} (${sigla}) tem ${n(reg.a)} estabelecimentos com CNPJ ativo de ${seg.curto} na competência ${comp}, segundo o cadastro aberto da Receita Federal (dados gerados em ${dataCurta(meta.geradoEm)}). ${ranking}`;
  const titulo = `${seg.nome} em ${mun.nome} (${sigla}): ${n(reg.a)} estabelecimentos ativos`;
  const descricao = corta(
    `São ${n(reg.a)} estabelecimentos com CNPJ ativo de ${minuscula(seg.nome)} em ${mun.nome} (${sigla}), competência ${comp}. ${n(reg.ab)} abertos e ${n(reg.ba)} baixas em 12 meses.`,
    158,
  );
  const faq: ItemFaq[] = [
    {
      pergunta: `Quantos estabelecimentos de ${seg.curto} existem em ${mun.nome}?`,
      resposta: `Há ${n(reg.a)} estabelecimentos com CNPJ ativo na base aberta da Receita Federal (competência ${comp}), sendo ${n(reg.m)} matrizes e ${n(reg.a - reg.m)} filiais. Isso representa ${participacaoUF} do total do segmento no estado de ${nomeUF} (todos os municípios da base) e ${participacaoBR} do total no Brasil.`,
    },
    {
      pergunta: 'Como o Índice define um estabelecimento ativo?',
      resposta: `É um CNPJ com situação cadastral ativa na competência ${comp} e cuja atividade econômica principal está na classe CNAE ${seg.classes.join(', ')}. Matriz e filial contam separadamente. Negócios sem CNPJ, informais ou que exercem a atividade apenas como secundária não entram nessa contagem.`,
    },
    {
      pergunta: `Quantos estabelecimentos de ${seg.curto} abriram e quantos tiveram o CNPJ baixado em ${mun.nome} nos últimos 12 meses?`,
      resposta: `Entre ${janela}, ${n(reg.ab)} estabelecimentos iniciaram atividade e ${n(reg.ba)} tiveram o CNPJ baixado. Os dois números não formam um saldo: as aberturas incluem estabelecimentos que depois foram baixados, e baixa de CNPJ não significa necessariamente que o negócio fechou.`,
    },
    {
      pergunta: 'O Índice mede a reputação ou a qualidade desses estabelecimentos?',
      resposta: 'Não. O Índice conta estabelecimentos com situação cadastral ativa. Nota, comentários, faturamento, qualidade do atendimento e participação de mercado não fazem parte do conjunto de dados.',
    },
    {
      pergunta: 'Por que o número pode ser diferente de uma busca no Google?',
      resposta: `A contagem usa a atividade principal declarada no CNPJ e a situação cadastral da competência ${comp}. Uma busca no Google pode mostrar empresas com outra classificação CNAE, estabelecimentos já fechados, negócios sem CNPJ ou perfis sem correspondência direta com o cadastro. Os dois números medem coisas diferentes.`,
    },
  ];
  return { meta, nomeUF, comp, janela, ranking, lead, titulo, descricao, participacaoUF, participacaoBR, faq };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf, municipio, segmento } = await params;
  const r = resolver(uf, municipio, segmento);
  if (!r) return { robots: { index: false } };
  const t = textos(r.pagina, r.sigla);
  const url = urlAbsoluta(`/${uf}/${municipio}/${segmento}`);
  return {
    title: { absolute: t.titulo },
    description: t.descricao,
    alternates: { canonical: url },
    openGraph: { title: t.titulo, description: t.descricao, url, type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: t.titulo, description: t.descricao, images: [OG_IMAGE] },
  };
}

export default async function Page({ params }: Props) {
  const { uf, municipio, segmento } = await params;
  const r = resolver(uf, municipio, segmento);
  if (!r) notFound();
  const { sigla, pagina: p } = r;
  const t = textos(p, sigla);
  const { mun, seg, reg } = p;
  const caminho = `/${uf}/${municipio}/${segmento}`;
  const subclasses = Object.entries(reg.sub).sort((a, b) => b[1] - a[1]);
  const somaSubclasses = subclasses.reduce((soma, [, qtd]) => soma + qtd, 0);
  const anos = Object.keys(reg.ano).map(Number);
  const anoComp = Number(t.meta.competencia.slice(0, 4));
  // Só marca como parcial o ano da competência se ele existir na série; caso contrário,
  // a nota explica que o último ano é o mais recente com aberturas registradas.
  const anoParcial = anos.includes(anoComp) ? anoComp : undefined;
  const anosRanking = anosPublicadosDoSegmento(seg.slug);
  const ultimoAnoRanking = anosRanking.length > 0 ? anosRanking[0] : null;

  const dataset = datasetDoRecorte({
    url: urlAbsoluta(caminho),
    name: `${seg.nome} em ${mun.nome} (${sigla}): estabelecimentos ativos`,
    description: t.lead,
    espacial: `${mun.nome}, ${sigla}, Brasil`,
    meta: t.meta,
    variaveis: [
      { nome: 'Estabelecimentos ativos', valor: reg.a, unidade: 'estabelecimentos' },
      { nome: 'Matrizes entre os ativos', valor: reg.m, unidade: 'estabelecimentos' },
      { nome: 'Aberturas em 12 meses', valor: reg.ab, unidade: 'estabelecimentos' },
      { nome: 'Baixas de CNPJ em 12 meses', valor: reg.ba, unidade: 'estabelecimentos' },
    ],
  });

  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd
        data={breadcrumb([
          { nome: 'Índice', caminho: '/' },
          { nome: UFS[sigla], caminho: `/${uf}` },
          { nome: mun.nome, caminho: `/${uf}/${municipio}` },
          { nome: seg.nome, caminho },
        ])}
      />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: UFS[sigla], href: `/${uf}` }, { nome: mun.nome, href: `/${uf}/${municipio}` }, { nome: seg.nome }]} />

      <h1>{t.titulo}</h1>
      <p className="lead">{t.lead}</p>

      <div className="cards">
        <div className="card"><strong>{n(reg.a)}</strong><small>estabelecimentos ativos</small></div>
        <div className="card"><strong>{pct(reg.m, reg.a)}</strong><small>{n(reg.m)} matrizes e {n(reg.a - reg.m)} filiais</small></div>
        <div className="card"><strong>{n(reg.ab)}</strong><small>iniciaram atividade no segmento ({t.janela})</small></div>
        <div className="card"><strong>{n(reg.ba)}</strong><small>CNPJs do segmento baixados no mesmo período</small></div>
        <div className="card"><strong>{t.participacaoUF}</strong><small>do segmento no estado (todos os municípios da base)</small></div>
      </div>

      <Definicao termo="O que este número significa">
        <ul>
          <li>Conta estabelecimentos com CNPJ, não empresas controladoras: matriz e filial entram separadamente.</li>
          <li>Considera a situação cadastral ativa na competência {t.comp} e a atividade principal na classe CNAE {seg.classes.join(', ')}.</li>
          <li>Não inclui negócios sem CNPJ, informais ou que exercem a atividade apenas como secundária.</li>
          <li>Não mede reputação, faturamento, qualidade do atendimento nem participação de mercado.</li>
        </ul>
      </Definicao>

      <h2>Atividades dentro do segmento em {mun.nome}</h2>
      <table>
        <caption>
          Ativos por subclasse CNAE (7 dígitos), competência {t.comp}. A soma das subclasses é o total de ativos do
          segmento. A parcela usa como denominador os ativos do segmento no município.
        </caption>
        <thead>
          <tr><th scope="col">Atividade (CNAE)</th><th scope="col" className="num">Ativos<small>unidades</small></th><th scope="col" className="num">Parcela<small>% dos ativos do segmento</small></th></tr>
        </thead>
        <tbody>
          {subclasses.map(([cod, qtd]) => (
            <tr key={cod}><th scope="row">{nomeSubclasse(cod)} <small>{cod}</small></th><td className="num">{n(qtd)}</td><td className="num">{pct(qtd, reg.a)}</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row">Total</th><td className="num">{n(somaSubclasses)}</td><td className="num">100%</td></tr>
        </tfoot>
      </table>

      {anos.length > 0 && (
        <>
          <h2>Aberturas por ano em {mun.nome}</h2>
          <Barras
            serie={reg.ano}
            anoParcial={anoParcial}
            descricao={`Estabelecimentos de ${seg.curto} em ${mun.nome} por ano de início de atividade, de ${Math.min(...anos)} a ${Math.max(...anos)}.`}
          />
          <p className="nota">
            Cada barra conta estabelecimentos que iniciaram atividade naquele ano, inclusive os que depois foram baixados.
            A série cobre {Math.min(...anos)}–{Math.max(...anos)};{' '}
            {anoParcial ? `o ano de ${anoParcial} é parcial` : `o último ano com aberturas registradas é ${Math.max(...anos)}`}.
            Não é o estoque ativo.
          </p>
          {ultimoAnoRanking !== null && (
            <p className="nota">
              Veja o <Link href={`/rankings/aberturas/${seg.slug}/${ultimoAnoRanking}`}>ranking nacional de aberturas de {seg.curto} em {ultimoAnoRanking}</Link> por município.
            </p>
          )}
        </>
      )}

      {p.maisNaUF.length > 0 && (
        <>
          <h2>Outros municípios de {t.nomeUF} neste segmento</h2>
          <ul className="lista">
            {p.maisNaUF.map(({ mun: m, a }) => (
              <li key={m.slug}><Link href={`/${uf}/${m.slug}/${segmento}`}>{m.nome}</Link><span>{n(a)} ativos</span></li>
            ))}
          </ul>
        </>
      )}

      {p.outrosSegmentos.length > 0 && (
        <>
          <h2>Outros segmentos em {mun.nome}</h2>
          <ul className="lista">
            {p.outrosSegmentos.map(({ seg: s, reg: rr }) => (
              <li key={s.slug}><Link href={`/${uf}/${municipio}/${s.slug}`}>{s.nome}</Link><span>{n(rr.a)} ativos</span></li>
            ))}
          </ul>
        </>
      )}

      <Cta
        campanha={`${uf}-${municipio}-${segmento}`}
        texto={`Com ${n(reg.a)} estabelecimentos do segmento em ${mun.nome}, a nota e os comentários no Google costumam entrar na comparação do cliente. Veja como está a reputação do seu negócio.`}
      />

      <Faq itens={t.faq} />

      <FonteDados />
      <Citacao caminho={caminho} titulo={`${seg.nome} em ${mun.nome} (${sigla})`} />
    </>
  );
}
