import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';
import { serializeJsonLd } from '../../lib/safeJsonLd';

const canonical = 'https://filtraai.com/blog/quanto-custa-gestao-de-reputacao-online';
const title = 'Quanto custa gestão de reputação online?';
const h1 = 'Quanto custa gestão de reputação online? O que define o preço';
const description =
  'Entenda o que compõe o custo da gestão de reputação online, o que comparar em uma proposta e por que não existe preço único. Veja também os planos do Filtra.AI.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter(title, description),
};

const faq = [
  {
    question: 'Quanto custa a gestão de reputação online?',
    answer:
      'Não existe preço único. O valor depende do escopo (só monitoramento ou operação completa), do volume de avaliações e feedback, do número de unidades, da frequência de análise e do nível de suporte. Peça uma proposta que detalhe cada um desses itens.',
  },
  {
    question: 'Existe versão gratuita?',
    answer:
      'O Filtra.AI oferece teste de 7 dias sem cartão de crédito. Depois do período, a empresa escolhe um plano ou cancela. Condições e preços vigentes estão na página de planos.',
  },
  {
    question: 'É melhor contratar uma agência ou usar um software?',
    answer:
      'Depende de quem executa a rotina. O software organiza avaliações, feedback e temas para a equipe interna; a agência executa e assume a operação. É possível combinar os dois, desde que responsabilidades e indicadores fiquem claros.',
  },
  {
    question: 'O serviço garante que a nota vai melhorar?',
    answer:
      'Não. Nenhuma ferramenta ou agência séria deve garantir nota, posição no Google ou prazo. O que se pode contratar é processo: acompanhamento, resposta com contexto, correção de causas e indicadores de execução.',
  },
  {
    question: 'O que pedir na proposta comercial?',
    answer:
      'Peça escopo detalhado, canais cobertos, frequência de análise, quem responde e revisa, indicadores acompanhados, limites do serviço, prazo de implementação e condições de cancelamento. Desconfie de proposta que promete nota ou posição.',
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
        kicker="Compras · reputação"
        title={h1}
        lead="Resposta direta: não existe preço único para gestão de reputação online. O custo varia com escopo, volume de avaliações e feedback, número de unidades, frequência de análise e suporte. Uma proposta séria separa a entrega recorrente da promessa de resultado — nota, posição no Google e prazo não devem ser vendidos como garantia."
      >
        <p>
          A pergunta “quanto custa?” costuma esconder outra: “o que exatamente eu estou comprando?”.
          Gestão de reputação pode significar desde o acompanhamento manual de avaliações até uma operação
          com canal de feedback, classificação por IA, fluxo de resposta e relatórios por unidade. O preço
          muda porque o escopo muda.
        </p>

        <H2>Por que não existe preço único</H2>
        <p>
          Duas empresas com a mesma nota podem precisar de operações completamente diferentes. Uma recebe
          poucas avaliações por mês e quer organizar respostas; outra tem dezenas de unidades, volume alto
          de feedback e exige comparação entre lojas. O trabalho, o risco e o tempo de operação não são os
          mesmos.
        </p>

        <H2>O que muda o custo</H2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Fatores que alteram o custo de uma operação de reputação. Use a última coluna para comparar propostas.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Fator</th>
                <th scope="col" className="py-2 pr-3 font-medium">Por que muda o custo</th>
                <th scope="col" className="py-2 font-medium">O que perguntar</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Escopo</th>
                <td className="py-3 pr-3 text-zinc-400">Monitorar é diferente de operar respostas, feedback e relatórios.</td>
                <td className="py-3 text-zinc-400">Quais entregas são recorrentes e quais são pontuais?</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Volume</th>
                <td className="py-3 pr-3 text-zinc-400">Mais avaliações e feedback exigem mais triagem e revisão.</td>
                <td className="py-3 text-zinc-400">Qual o volume mensal incluído? O que acontece se passar?</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Unidades</th>
                <td className="py-3 pr-3 text-zinc-400">Comparar lojas adiciona configuração, relatório e contexto.</td>
                <td className="py-3 text-zinc-400">O preço é por unidade, por volume ou fixo?</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Frequência</th>
                <td className="py-3 pr-3 text-zinc-400">Análise semanal custa mais tempo do que revisão mensal.</td>
                <td className="py-3 text-zinc-400">Qual a cadência de análise, resposta e reunião?</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Canais</th>
                <td className="py-3 pr-3 text-zinc-400">Google, feedback próprio e outros canais têm regras e fluxos diferentes.</td>
                <td className="py-3 text-zinc-400">Quais canais entram e como cada um é tratado?</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Suporte</th>
                <td className="py-3 pr-3 text-zinc-400">Treinamento, gestor dedicado e suporte ampliam o custo.</td>
                <td className="py-3 text-zinc-400">Quem responde dúvidas e em quanto tempo?</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>O que uma entrega recorrente costuma incluir</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Diagnóstico inicial e linha de base: nota, volume, distribuição, temas e unidades.</li>
          <li>Canal de feedback e convite para avaliação, sem selecionar clientes por satisfação.</li>
          <li>Acompanhamento de novas avaliações e classificação de temas recorrentes.</li>
          <li>Sugestão de respostas com revisão humana antes da publicação.</li>
          <li>Relatório com indicadores de execução e reunião de acompanhamento.</li>
          <li>Treinamento da equipe para lidar com casos sensíveis e dados pessoais.</li>
        </ul>

        <H2>O que não deveria fazer parte do preço</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Compra de avaliações ou incentivo condicionado à nota.</li>
          <li>Promessa de nota, posição no Google ou prazo de resultado.</li>
          <li>Remoção de avaliação legítima fora dos canais da plataforma.</li>
          <li>Seleção de clientes satisfeitos para a avaliação pública (review gating).</li>
          <li>Publicação de respostas sem revisão da empresa.</li>
        </ul>

        <H2>Como comparar propostas</H2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Coloque lado a lado escopo, volume, unidades, frequência e canais.</li>
          <li>Peça exemplos de entregáveis: relatório, fluxo de resposta e critérios de priorização.</li>
          <li>Defina indicadores de execução, não só a nota: tempo de resposta, temas resolvidos e cobertura de unidades.</li>
          <li>Verifique quem faz o quê: ferramenta, equipe interna, agência ou operação compartilhada.</li>
          <li>Confirme condições de cancelamento, propriedade dos dados e exportação.</li>
        </ol>

        <H2>Quanto custa no Filtra.AI</H2>
        <p>
          Os planos e as condições vigentes estão publicados em{' '}
          <Link href="/planos" className="text-indigo-300 underline">filtraai.com/planos</Link>, com teste
          de 7 dias sem cartão. O valor depende do escopo contratado. O Filtra.AI não vende garantia de
          nota ou posição: organiza avaliações, feedback e temas para que a equipe execute a melhoria com
          contexto.
        </p>

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
          Para comparar o processo antes de contratar, veja{' '}
          <Link href="/blog/como-escolher-software-de-gestao-de-reputacao" className="text-indigo-300 underline">
            como escolher um software de gestão de reputação
          </Link>{' '}
          ou conheça a{' '}
          <Link href="/gestao-de-reputacao-online" className="text-indigo-300 underline">gestão de reputação online</Link>{' '}
          do Filtra.AI. Se preferir um diagnóstico inicial, use a{' '}
          <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
      </BlogArticle>
    </>
  );
}
