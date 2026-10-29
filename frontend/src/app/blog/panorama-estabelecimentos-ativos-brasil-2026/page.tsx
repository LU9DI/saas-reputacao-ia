import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';
import { serializeJsonLd } from '../../lib/safeJsonLd';
import snapshot from '../../../generated/indice-snapshot.json';

const canonical = 'https://filtraai.com/blog/panorama-estabelecimentos-ativos-brasil-2026';
const title = 'Panorama dos estabelecimentos ativos no Brasil (2026)';
const h1 = 'Panorama dos estabelecimentos ativos no Brasil (2026): 9 segmentos em números';
const description =
  'Quantos restaurantes, hotéis e clínicas têm CNPJ ativo no Brasil? Panorama do Índice Filtra.AI por segmento e estado, com fonte, competência e metodologia.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter('Panorama dos estabelecimentos ativos no Brasil', description),
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function mesPorExtenso(competencia: string) {
  const [ano, mes] = competencia.split('-');
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

const n = (valor: number) => valor.toLocaleString('pt-BR');
const pct = (parte: number, total: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
    total ? parte / total : 0,
  );

const competencia = mesPorExtenso(snapshot.competencia);
const segmentos = Object.entries(snapshot.segmentos);
const top = snapshot.todos.topEstados[0];

const faq = [
  {
    question: 'Quantos restaurantes, lanchonetes e bares têm CNPJ ativo no Brasil?',
    answer: `Na competência ${competencia}, o Índice Filtra.AI contabiliza ${n(snapshot.segmentos.restaurantes.ativos)} estabelecimentos com CNPJ ativo de restaurantes, lanchonetes e bares no Brasil. Matriz e filial são contadas separadamente.`,
  },
  {
    question: 'Quantos hotéis e quantas clínicas existem no Brasil?',
    answer: `São ${n(snapshot.segmentos.hoteis.ativos)} estabelecimentos de hotéis e similares e ${n(snapshot.segmentos.clinicas.ativos)} de clínicas médicas e odontológicas com CNPJ ativo, segundo o Índice Filtra.AI na competência ${competencia}.`,
  },
  {
    question: 'Esse total é o número de empresas brasileiras?',
    answer:
      'Não. O panorama cobre apenas os 9 segmentos acompanhados, definidos pela atividade econômica principal (CNAE). Ele conta estabelecimentos, não empresas únicas, e não inclui negócios sem CNPJ nem atividades que aparecem apenas como secundárias no cadastro.',
  },
  {
    question: 'Qual estado concentra mais estabelecimentos ativos?',
    answer: `Na competência ${competencia}, ${top.nome} (${top.uf}) lidera o recorte, com ${n(top.ativos)} estabelecimentos ativos nos 9 segmentos — ${pct(top.ativos, snapshot.todos.ativos)} do total.`,
  },
  {
    question: 'Com que frequência o panorama é atualizado?',
    answer:
      'A ingestão é mensal e a página informa a competência e a data real de geração. O dado pode ficar alguns dias atrás da publicação da Receita Federal; não há atualização em tempo real.',
  },
];

export default function Page() {
  return (
    <>
      <BlogSchema
        headline={h1}
        description={description}
        canonical={canonical}
        datePublished="2026-10-27"
        dateModified="2026-10-27"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }),
        }}
      />
      <BlogArticle
        kicker="Dados · CNPJ"
        title={h1}
        lead={`Resposta direta: o Índice Filtra.AI contabiliza ${n(snapshot.todos.ativos)} estabelecimentos com CNPJ ativo nos 9 segmentos acompanhados, em ${n(snapshot.todos.municipiosComPagina)} municípios com página publicada, na competência ${competencia}. São contagens diretas do cadastro aberto da Receita Federal — não estimativas e não o total de empresas do país.`}
      >
        <p>
          Este panorama reúne os totais por segmento e a concentração por estado usando a mesma base que
          alimenta as páginas do{' '}
          <Link href="/indice" className="text-indigo-300 underline">Índice Filtra.AI</Link>. O objetivo é
          dar um ponto de partida verificável para quem precisa dimensionar mercado local, comparar
          territórios e citar números com fonte.
        </p>

        <H2>O que este panorama mede</H2>
        <p>
          O recorte é de <strong>estabelecimentos com situação cadastral ativa</strong> no CNPJ,
          classificados pela atividade econômica principal (CNAE) em um dos 9 segmentos acompanhados.
          Matriz e filial contam separadamente. Aberturas e baixas usam a janela de 12 meses fechada antes
          da competência.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Fonte primária: cadastro aberto de CNPJ da Receita Federal.</li>
          <li>Competência: {competencia}; base gerada em {snapshot.geradoEm.slice(0, 10).split('-').reverse().join('/')}.</li>
          <li>Unidade: estabelecimento, não empresa única.</li>
          <li>Publicação: páginas apenas para combinações com {n(snapshot.minimoParaIndexar)} ou mais estabelecimentos ativos no segmento.</li>
        </ul>

        <H2>Estabelecimentos ativos por segmento</H2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Estabelecimentos com CNPJ ativo por segmento, competência {competencia}. Fonte: cadastro
              aberto de CNPJ da Receita Federal, compilado pelo Índice Filtra.AI.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Segmento</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Ativos</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Municípios com página</th>
                <th scope="col" className="py-2 text-right font-medium">Estados</th>
              </tr>
            </thead>
            <tbody>
              {segmentos.map(([slug, dados]) => (
                <tr key={slug} className="border-b border-zinc-900/80">
                  <th scope="row" className="py-2 pr-3 font-normal text-zinc-300">{dados.nome}</th>
                  <td className="py-2 pr-3 text-right tabular-nums text-zinc-100">{n(dados.ativos)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-zinc-100">{n(dados.municipiosComPagina)}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-100">{dados.estados}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="pt-3 pr-3 text-left font-semibold text-zinc-100">Total</th>
                <td className="pt-3 pr-3 text-right font-semibold tabular-nums text-zinc-100">{n(snapshot.todos.ativos)}</td>
                <td className="pt-3 pr-3 text-right font-semibold tabular-nums text-zinc-100">{n(snapshot.todos.municipiosComPagina)}</td>
                <td className="pt-3 text-right font-semibold tabular-nums text-zinc-100">{snapshot.todos.estados}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <H2>Onde estão os estabelecimentos ativos</H2>
        <p>
          A distribuição não é uniforme. Na competência {competencia}, os cinco estados com mais
          estabelecimentos ativos nos 9 segmentos concentram{' '}
          {pct(
            snapshot.todos.topEstados.reduce((soma, estado) => soma + estado.ativos, 0),
            snapshot.todos.ativos,
          )}{' '}
          do total. Isso não significa que os outros estados tenham menos oportunidade: significa que o
          volume de operações e a concorrência local mudam de escala.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Estados com mais estabelecimentos ativos nos 9 segmentos, competência {competencia}.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Estado</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Ativos</th>
                <th scope="col" className="py-2 text-right font-medium">Participação</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.todos.topEstados.map((estado) => (
                <tr key={estado.uf} className="border-b border-zinc-900/80">
                  <th scope="row" className="py-2 pr-3 font-normal text-zinc-300">
                    {estado.nome} ({estado.uf})
                  </th>
                  <td className="py-2 pr-3 text-right tabular-nums text-zinc-100">{n(estado.ativos)}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-100">
                    {pct(estado.ativos, snapshot.todos.ativos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>O que os números não dizem</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Não medem reputação, nota, faturamento, qualidade ou participação de mercado.</li>
          <li>Não são o total de empresas brasileiras: cobrem apenas os 9 segmentos acompanhados.</li>
          <li>Não incluem negócios sem CNPJ nem atividades que aparecem apenas como secundárias no cadastro.</li>
          <li>Situação cadastral ativa não garante que o estabelecimento esteja em funcionamento.</li>
        </ul>
        <p>
          Os limites completos, as fórmulas e o canal de contestação estão na{' '}
          <Link href="/indice/metodologia" className="text-indigo-300 underline">metodologia do Índice</Link>.
        </p>

        <H2>Como usar esses dados na reputação local</H2>
        <p>
          Número de estabelecimentos é contexto de mercado, não diagnóstico de reputação. Ele ajuda a
          dimensionar a concorrência de um segmento e a interpretar sinais de experiência: em um mercado
          com muitos estabelecimentos, avaliações e feedback recorrente ganham peso na decisão do cliente.
          Para aprofundar por segmento, veja as páginas de{' '}
          <Link href="/hoteis" className="text-indigo-300 underline">hotéis</Link>,{' '}
          <Link href="/restaurantes" className="text-indigo-300 underline">restaurantes</Link> e{' '}
          <Link href="/clinicas" className="text-indigo-300 underline">clínicas</Link>, ou a visão de{' '}
          <Link href="/gestao-de-reputacao-online" className="text-indigo-300 underline">gestão de reputação online</Link>.
        </p>

        <H2>Como citar</H2>
        <blockquote className="rounded-xl border-l-4 border-indigo-500 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
          Índice Filtra.AI, competência {competencia}, base gerada em{' '}
          {snapshot.geradoEm.slice(0, 10).split('-').reverse().join('/')}. Estabelecimentos com CNPJ ativo
          por segmento e estado. Disponível em https://filtraai.com/indice. Fonte primária: {snapshot.fonte.nome}.
        </blockquote>

        <H2>Perguntas frequentes</H2>
        <div className="space-y-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-100">{item.question}</summary>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{item.answer}</p>
            </details>
          ))}
        </div>

        <p>
          Para ver os recortes por estado e município, acesse o{' '}
          <Link href="/indice" className="text-indigo-300 underline">Índice Filtra.AI</Link>. Para entender
          como o Filtra.AI organiza avaliações e feedback, comece pela{' '}
          <Link href="/metodologia" className="text-indigo-300 underline">metodologia do produto</Link> ou
          pela <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
      </BlogArticle>
    </>
  );
}

