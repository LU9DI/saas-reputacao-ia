import Link from 'next/link';
import { getMeta, getSegmentos, MIN_MUNICIPIOS_RANKING_UF, minimo, rankingDoSegmento, type LinhaRanking } from '@/lib/data';
import { n, ord, pct } from '@/lib/format';
import { JsonLd, breadcrumb, datasetDoRecorte, urlAbsoluta } from '@/lib/seo';
import { LIMITE_RANKING, type ModeloRanking } from '@/lib/ranking-textos';
import { UFS } from '@/lib/ufs';
import { Citacao } from './Citacao';
import { Cta } from './Cta';
import { Faq } from './Faq';
import { FonteDados } from './FonteDados';
import { Migalhas } from './Migalhas';

const href = (l: LinhaRanking, seg: string) => `/${l.mun.uf.toLowerCase()}/${l.mun.slug}/${seg}`;

export function RankingPagina({ m, caminho }: { m: ModeloRanking; caminho: string }) {
  const { seg, uf } = m;
  const meta = getMeta();
  const outros = getSegmentos().filter((s) => s.slug !== seg.slug);
  const dataset = datasetDoRecorte({
    url: urlAbsoluta(caminho),
    name: m.titulo,
    description: m.descricao,
    espacial: uf ? UFS[uf] : 'Brasil',
    meta,
    variaveis: [
      { nome: `Estabelecimentos ativos ${m.escopo}`, valor: m.totalEscopo, unidade: 'estabelecimentos' },
      { nome: 'Municípios no ranking', valor: m.totalMunicipios, unidade: 'municípios' },
    ],
  });
  const trilha = [
    { nome: 'Índice', caminho: '/' },
    ...(uf ? [{ nome: UFS[uf], caminho: `/${uf.toLowerCase()}` }] : []),
    { nome: `Ranking de ${seg.curto}`, caminho },
  ];
  // Só linka o ranking de UF que existe (tem municípios suficientes).
  const ufComRanking = uf ? rankingDoSegmento(seg.slug, 'a').filter((l) => l.mun.uf === uf).length >= MIN_MUNICIPIOS_RANKING_UF : false;
  return (
    <>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumb(trilha)} />
      <Migalhas
        itens={[
          { nome: 'Índice', href: '/' },
          ...(uf ? [{ nome: UFS[uf], href: `/${uf.toLowerCase()}` }] : []),
          { nome: `Ranking de ${seg.curto}` },
        ]}
      />
      <h1>{m.titulo}</h1>
      <p className="lead">{m.lead}</p>

      <h2>Mais estabelecimentos ativos {m.escopo}</h2>
      <table>
        <caption>
          {m.porAtivos.length < m.totalMunicipios ? `Os ${n(LIMITE_RANKING)} primeiros de ${n(m.totalMunicipios)} municípios` : `${n(m.totalMunicipios)} municípios`}{' '}
          com pelo menos {n(minimo())} estabelecimentos ativos de {seg.curto}, competência {m.comp}. A parcela usa como denominador todos os ativos do segmento {m.escopo} na base.
        </caption>
        <thead>
          <tr>
            <th scope="col">Posição</th>
            <th scope="col">Município</th>
            <th scope="col" className="num">Ativos<small>unidades</small></th>
            <th scope="col" className="num">Parcela<small>% do segmento {m.escopo}</small></th>
          </tr>
        </thead>
        <tbody>
          {m.porAtivos.map((l) => (
            <tr key={`${l.mun.uf}/${l.mun.slug}`}>
              <td>{ord(l.pos)}</td>
              <th scope="row"><Link href={href(l, seg.slug)}>{l.mun.nome}</Link>{uf ? '' : <small> {l.mun.uf}</small>}</th>
              <td className="num">{n(l.a)}</td>
              <td className="num">{pct(l.a, m.totalEscopo)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Este ranking é por estoque de estabelecimentos ativos. Para eventos de abertura por ano, veja os{' '}
        <Link href="/rankings/aberturas">rankings de aberturas</Link>.
      </p>

      <h2>Outros rankings</h2>
      <ul className="lista">
        {uf ? (
          <li><Link href={`/rankings/ativos/${seg.slug}`}>{seg.nome} no Brasil</Link><span>ranking nacional</span></li>
        ) : null}
        {outros.map((s) => (
          <li key={s.slug}>
            <Link href={uf && ufComRanking ? `/rankings/ativos/${s.slug}/${uf.toLowerCase()}` : `/rankings/ativos/${s.slug}`}>{s.nome}{uf ? ` em ${UFS[uf]}` : ''}</Link>
            <span>{uf ? 'ranking do estado' : 'ranking nacional'}</span>
          </li>
        ))}
      </ul>

      <Cta
        campanha={`ranking-${seg.slug}${uf ? `-${uf.toLowerCase()}` : ''}`}
        texto={`Em um mercado com ${n(m.totalEscopo)} estabelecimentos de ${seg.curto}, entender como o cliente percebe o negócio ajuda a priorizar melhorias. Veja como está a reputação do seu negócio.`}
      />
      <Faq itens={m.faq} semJsonLd />
      <FonteDados />
      <Citacao caminho={caminho} titulo={m.titulo} />
    </>
  );
}
