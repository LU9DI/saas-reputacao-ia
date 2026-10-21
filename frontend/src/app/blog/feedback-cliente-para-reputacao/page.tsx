import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';

const canonical = 'https://filtraai.com/blog/feedback-cliente-para-reputacao';

export const metadata: Metadata = {
  title: 'Feedback do cliente para reputação: como fechar o ciclo',
  description:
    'Como transformar feedback de clientes em um processo: coleta, análise, prioridade, ação e acompanhamento da reputação.',
  alternates: { canonical, languages: { 'pt-BR': canonical, en: 'https://filtraai.com/en/blog/customer-feedback-reputation', es: 'https://filtraai.com/es/blog/feedback-clientes-reputacion', 'x-default': canonical } },
  openGraph: { type: 'article', title: 'Feedback do cliente para reputação', description: 'Como fechar o ciclo entre feedback, operação e reputação.', url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter('Feedback do cliente para reputação', 'Como fechar o ciclo entre feedback, operação e reputação.'),
};

export default function Page() {
  return (
    <>
      <BlogSchema
        headline="Feedback do cliente para reputação: como fechar o ciclo"
        description="Como transformar feedback de clientes em um processo contínuo de melhoria e reputação."
        canonical={canonical}
        datePublished="2026-10-05"
        dateModified="2026-10-05"
      />
      <BlogArticle
        kicker="Feedback · reputação"
        title="Feedback do cliente para reputação: como fechar o ciclo"
        lead="Coletar opinião não é o fim do processo. O valor aparece quando a informação vira prioridade, ação e aprendizado."
      >
        <p>
          Empresas costumam acumular comentários em vários canais. Formulários, WhatsApp, Google, suporte e pesquisas produzem sinais diferentes. Sem uma rotina de organização, o volume de feedback cresce sem aumentar a capacidade de decisão.
        </p>
        <H2>1. Capture o sinal perto da experiência</H2>
        <p>
          Quanto mais distante do momento da experiência, maior a chance de perder contexto. O canal de coleta deve ser simples e encaixar no fluxo real do negócio.
        </p>
        <H2>2. Organize por tema e prioridade</H2>
        <p>
          Não trate todos os comentários como tarefas iguais. Classifique por assunto, impacto e recorrência. Um problema pequeno que aparece centenas de vezes pode merecer mais atenção que um caso isolado de alta intensidade.
        </p>
        <H2>3. Separe público e privado</H2>
        <p>
          Avaliações públicas ajudam o mercado a formar uma percepção sobre a empresa. Feedback privado é valioso para investigação e recuperação de experiência. Ter os dois canais claros melhora a gestão.
        </p>
        <H2>4. Feche o ciclo</H2>
        <p>
          A rotina deve terminar com uma ação registrada e uma revisão posterior. Sem esse passo, a coleta vira apenas armazenamento. Com ele, feedback começa a funcionar como sistema de melhoria.
        </p>
        <p>
          Aprofunde em <Link href="/feedback-de-clientes" className="text-indigo-300 underline">feedback de clientes</Link>, <Link href="/gestao-de-feedback" className="text-indigo-300 underline">gestão de feedback</Link> e <Link href="/analise-de-avaliacoes-com-ia" className="text-indigo-300 underline">análise com IA</Link>.
        </p>
      </BlogArticle>
    </>
  );
}