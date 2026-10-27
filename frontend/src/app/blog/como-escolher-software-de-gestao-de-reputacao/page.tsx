import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';
import { serializeJsonLd } from '../../lib/safeJsonLd';

const canonical = 'https://filtraai.com/blog/como-escolher-software-de-gestao-de-reputacao';
const title = 'Como escolher software de gestão de reputação';
const h1 = 'Como escolher software de gestão de reputação: 8 critérios';
const description =
  'Checklist para comparar softwares de gestão de reputação: canais, análise, fluxo de resposta, relatórios, segurança, suporte e limites. Evite promessas de nota.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: 'article', title, description, url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter(title, description),
};

const faq = [
  {
    question: 'O que um software de gestão de reputação faz?',
    answer:
      'Organiza avaliações e feedback, classifica temas e sentimento, apoia respostas e gera relatórios para acompanhar a evolução. Ele não cria avaliações, não garante nota e não substitui a decisão da equipe.',
  },
  {
    question: 'Software substitui uma agência?',
    answer:
      'Não necessariamente. O software dá estrutura para a operação interna; a agência executa e assume a rotina. Muitas empresas combinam os dois, desde que responsabilidades e indicadores fiquem explícitos.',
  },
  {
    question: 'Como avaliar a qualidade da análise com IA?',
    answer:
      'Teste com comentários reais e casos difíceis: ironia, gíria regional, texto curto e reclamação ambígua. Verifique se a ferramenta permite revisão humana, correção de tema e auditoria da classificação.',
  },
  {
    question: 'Preciso integrar com o Google?',
    answer:
      'Pergunte ao fornecedor quais canais são integrados automaticamente e quais dependem de importação ou ação manual. Integração não é sinônimo de qualidade: o fluxo de revisão e a resposta continuam sendo da empresa.',
  },
  {
    question: 'Quanto custa?',
    answer:
      'Depende de escopo, volume, unidades, frequência e suporte. Veja o guia sobre custo de gestão de reputação online e os planos publicados do Filtra.AI.',
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
        kicker="Compras · software"
        title={h1}
        lead="Resposta direta: escolha pelo processo que o software permite operar, não pela promessa de nota. Os critérios que mais mudam o resultado são canais cobertos, qualidade da classificação, fluxo de resposta com revisão humana, relatórios por unidade, controle de acesso, exportação de dados, suporte e limites claros sobre o que a ferramenta não faz."
      >
        <p>
          Ferramentas de reputação parecem iguais em uma demonstração: painel, gráfico de nota, lista de
          avaliações. A diferença aparece na rotina — quem responde, com que contexto, o que é medido e o
          que acontece quando o volume cresce ou um caso sensível aparece.
        </p>

        <H2>Os 8 critérios que importam</H2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Critérios para comparar softwares de gestão de reputação. A coluna de teste ajuda a sair da demonstração genérica.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Critério</th>
                <th scope="col" className="py-2 pr-3 font-medium">Como testar</th>
                <th scope="col" className="py-2 font-medium">Sinal de alerta</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">1. Canais cobertos</th>
                <td className="py-3 pr-3 text-zinc-400">Peça a lista exata de canais e o que é automático versus manual.</td>
                <td className="py-3 text-zinc-400">“Integra tudo” sem detalhar o fluxo.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">2. Classificação</th>
                <td className="py-3 pr-3 text-zinc-400">Teste com ironia, gíria e comentário curto; veja se dá para corrigir o tema.</td>
                <td className="py-3 text-zinc-400">Promete 100% de acerto ou esconde a limitação.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">3. Fluxo de resposta</th>
                <td className="py-3 pr-3 text-zinc-400">Veja quem sugere, quem revisa e quem publica; confira o histórico.</td>
                <td className="py-3 text-zinc-400">Publicação automática sem aprovação.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">4. Relatórios</th>
                <td className="py-3 pr-3 text-zinc-400">Peça um relatório real por unidade e por período.</td>
                <td className="py-3 text-zinc-400">Só mostra nota média e não permite comparar períodos.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">5. Acesso e LGPD</th>
                <td className="py-3 pr-3 text-zinc-400">Confira papéis, permissões, retenção e tratamento de dados pessoais.</td>
                <td className="py-3 text-zinc-400">Todo mundo vê tudo ou não há política clara.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">6. Exportação</th>
                <td className="py-3 pr-3 text-zinc-400">Teste exportar avaliações, feedback e relatórios.</td>
                <td className="py-3 text-zinc-400">Seus dados ficam presos na ferramenta.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">7. Suporte</th>
                <td className="py-3 pr-3 text-zinc-400">Pergunte onboarding, treinamento e tempo de resposta.</td>
                <td className="py-3 text-zinc-400">Suporte só por e-mail e sem plano de implantação.</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">8. Limites</th>
                <td className="py-3 pr-3 text-zinc-400">Peça a metodologia e o que a ferramenta não mede.</td>
                <td className="py-3 text-zinc-400">Garante nota, posição ou prazo de resultado.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Perguntas para fazer na demonstração</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Quais canais entram automaticamente e quais dependem de trabalho manual?</li>
          <li>Como a ferramenta lida com ironia, gíria e comentário ambíguo?</li>
          <li>Quem aprova a resposta antes da publicação? Existe histórico de alterações?</li>
          <li>Como comparar unidades e períodos sem transformar realidades diferentes em ranking?</li>
          <li>Quais dados posso exportar e o que acontece se eu cancelar?</li>
          <li>O que a ferramenta não mede? Onde estão os limites documentados?</li>
        </ul>

        <H2>Sinais de alerta</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Garantia de nota, posição no Google ou prazo de resultado.</li>
          <li>Compra de avaliações ou incentivo condicionado à nota.</li>
          <li>Promessa de remover avaliação legítima fora dos canais da plataforma.</li>
          <li>Publicação automática de respostas sem revisão da empresa.</li>
          <li>Ausência de exportação, de política de privacidade ou de metodologia pública.</li>
        </ul>

        <H2>Planilha, agência ou software?</H2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Comparação de abordagens. Não são excludentes: a escolha depende de quem executa a rotina.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Abordagem</th>
                <th scope="col" className="py-2 pr-3 font-medium">Funciona quando</th>
                <th scope="col" className="py-2 font-medium">Limita quando</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Planilha</th>
                <td className="py-3 pr-3 text-zinc-400">O volume é baixo e uma pessoa mantém a rotina.</td>
                <td className="py-3 text-zinc-400">Cresce o volume, há várias unidades ou troca de responsável.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Agência</th>
                <td className="py-3 pr-3 text-zinc-400">A empresa não quer executar e precisa de alguém responsável pela operação.</td>
                <td className="py-3 text-zinc-400">A empresa quer controle direto do histórico e da resposta.</td>
              </tr>
              <tr className="border-b border-zinc-900/80">
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Software</th>
                <td className="py-3 pr-3 text-zinc-400">A equipe interna executa e precisa de estrutura, análise e histórico.</td>
                <td className="py-3 text-zinc-400">Ninguém assume a rotina de revisar e responder.</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-3 align-top font-normal text-zinc-300">Combinação</th>
                <td className="py-3 pr-3 text-zinc-400">A agência opera e a empresa mantém visibilidade e aprovação.</td>
                <td className="py-3 text-zinc-400">Responsabilidades e indicadores não estão escritos.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Como o Filtra.AI se encaixa</H2>
        <p>
          O Filtra.AI é a camada de organização: reúne feedback e avaliações, classifica temas e sentimento,
          sugere respostas e apoia a leitura por unidade. A equipe revisa, decide e assume a comunicação.
          A metodologia é pública em{' '}
          <Link href="/metodologia" className="text-indigo-300 underline">filtraai.com/metodologia</Link>, e
          os planos estão em{' '}
          <Link href="/planos" className="text-indigo-300 underline">filtraai.com/planos</Link>, com teste de
          7 dias sem cartão.
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
          Se a dúvida for orçamento, veja{' '}
          <Link href="/blog/quanto-custa-gestao-de-reputacao-online" className="text-indigo-300 underline">
            quanto custa gestão de reputação online
          </Link>
          . Para comparar a operação com a sua realidade, comece pela{' '}
          <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
      </BlogArticle>
    </>
  );
}
