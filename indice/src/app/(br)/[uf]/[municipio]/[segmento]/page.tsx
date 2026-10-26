import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeta, getPagina, nomeSubclasse, type Pagina } from '@/lib/data';
import { ufDeSlug, UFS } from '@/lib/ufs';
import { n, ord, pct, capitaliza, minuscula, mesPorExtenso, mesCurto, corta } from '@/lib/format';
import { JsonLd, breadcrumb, baseDeDados, publisher, urlAbsoluta, OG_IMAGE } from '@/lib/seo';
import { Barras } from '@/components/Barras';
import { Faq, type ItemFaq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
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
  const ranking = `É ${posUF} e ${posBR}, entre ${n(p.totalRankBR)} municípios com registro.`;
  const lead = `${mun.nome} (${sigla}) tem ${n(reg.a)} estabelecimentos ativos de ${seg.curto} na base aberta de CNPJ da Receita Federal (competência ${comp}). ${ranking}`;
  const titulo = `${seg.nome} em ${mun.nome} (${sigla}): quantos há`;
  const descricao = corta(
    `${mun.nome} (${sigla}) tem ${n(reg.a)} estabelecimentos ativos de ${minuscula(seg.nome)} (CNPJ, ${mesCurto(meta.competencia)}): ${n(reg.ab)} abertos e ${n(reg.ba)} baixas em 12 meses. Veja ranking e evolução.`,
    158,
  );
  const faq: ItemFaq[] = [
    {
      pergunta: `Quantos estabelecimentos de ${seg.curto} existem em ${mun.nome}?`,
      resposta: `Há ${n(reg.a)} estabelecimentos ativos na base aberta de CNPJ da Receita Federal (competência ${comp}), sendo ${n(reg.m)} matrizes e ${n(reg.a - reg.m)} filiais. Isso representa ${pct(reg.a, p.totalUF)} do total do segmento no estado de ${nomeUF}.`,
    },
    {
      pergunta: `Quantos estabelecimentos de ${seg.curto} abriram e quantos tiveram o CNPJ baixado em ${mun.nome} nos últimos 12 meses?`,
      resposta: `Entre ${mesCurto(meta.janela.inicio)} e ${mesCurto(meta.janela.fim)}, ${n(reg.ab)} estabelecimentos iniciaram atividade e ${n(reg.ba)} tiveram o CNPJ baixado em ${mun.nome}. Os dois números não formam um saldo: as aberturas incluem estabelecimentos que depois foram baixados, e baixa de CNPJ não significa necessariamente que o negócio fechou.`,
    },
    {
      pergunta: 'De onde vêm esses números e quais são os limites?',
      resposta: `Vêm do cadastro aberto de CNPJ da Receita Federal, contando estabelecimentos cuja atividade principal está na classe CNAE ${seg.classes.join(', ')} e cuja situação cadastral é ativa. Não incluem negócios informais nem estabelecimentos que têm essa atividade apenas como secundária, e um CNPJ ativo não garante que o local esteja funcionando.`,
    },
  ];
  return { meta, nomeUF, comp, janela, ranking, lead, titulo, descricao, faq };
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
  const anos = Object.keys(reg.ano).map(Number);
  const anoComp = Number(t.meta.competencia.slice(0, 4));

  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${urlAbsoluta(caminho)}#dados`,
    name: `${seg.nome} em ${mun.nome} (${sigla}): estabelecimentos ativos, aberturas e baixas`,
    description: t.lead,
    url: urlAbsoluta(caminho),
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    creator: publisher,
    publisher,
    isBasedOn: baseDeDados,
    dateModified: t.meta.geradoEm.slice(0, 10),
    temporalCoverage: `${t.meta.janela.inicio}/${t.meta.janela.fim}`,
    spatialCoverage: { '@type': 'Place', name: `${mun.nome}, ${sigla}, Brasil` },
    measurementTechnique: `Contagem de estabelecimentos do cadastro aberto de CNPJ por atividade econômica principal (CNAE classe ${seg.classes.join(', ')}), município e situação cadastral.`,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Estabelecimentos ativos', value: reg.a, unitText: 'estabelecimentos' },
      { '@type': 'PropertyValue', name: 'Estabelecimentos abertos nos 12 meses anteriores à competência', value: reg.ab, unitText: 'estabelecimentos' },
      { '@type': 'PropertyValue', name: 'Baixas de CNPJ nos 12 meses anteriores à competência', value: reg.ba, unitText: 'estabelecimentos' },
    ],
  };

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

      <h1>{seg.nome} em {mun.nome} ({sigla})</h1>
      <p className="lead">{t.lead}</p>

      <div className="cards">
        <div className="card"><strong>{n(reg.a)}</strong><small>estabelecimentos ativos</small></div>
        <div className="card"><strong>{pct(reg.m, reg.a)}</strong><small>{n(reg.m)} matrizes e {n(reg.a - reg.m)} filiais</small></div>
        <div className="card"><strong>{n(reg.ab)}</strong><small>iniciaram atividade ({t.janela})</small></div>
        <div className="card"><strong>{n(reg.ba)}</strong><small>CNPJs baixados no mesmo período</small></div>
        <div className="card"><strong>{pct(reg.a, p.totalUF)}</strong><small>do segmento em {t.nomeUF}</small></div>
      </div>

      <h2>Atividades dentro do segmento</h2>
      <table>
        <thead><tr><th>Atividade (CNAE)</th><th className="num">Ativos</th><th className="num">Parcela</th></tr></thead>
        <tbody>
          {subclasses.map(([cod, qtd]) => (
            <tr key={cod}><td>{nomeSubclasse(cod)} <small>({cod})</small></td><td className="num">{n(qtd)}</td><td className="num">{pct(qtd, reg.a)}</td></tr>
          ))}
        </tbody>
      </table>

      {anos.length > 0 && (
        <>
          <h2>Aberturas por ano em {mun.nome}</h2>
          <Barras
            serie={reg.ano}
            anoParcial={anoComp}
            descricao={`Estabelecimentos de ${seg.curto} em ${mun.nome} por ano de início de atividade, de ${Math.min(...anos)} a ${Math.max(...anos)}.`}
          />
          <p className="nota">
            Conta todos os estabelecimentos que iniciaram atividade em cada ano, inclusive os que depois foram baixados.
            O ano de {anoComp} é parcial.
          </p>
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

      <p className="nota">
        Fonte: {t.meta.fonte.nome}, competência {t.comp}. Contagem de estabelecimentos com atividade principal na classe CNAE {seg.classes.join(', ')} e situação cadastral ativa.
        Janela de aberturas e baixas: {t.janela}. <Link href="/metodologia">Veja a metodologia completa</Link>.
      </p>
    </>
  );
}
