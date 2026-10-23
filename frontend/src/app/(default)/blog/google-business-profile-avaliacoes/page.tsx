import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../../components/BlogArticle';
import { BlogSchema } from '../../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../../lib/blogSchema';

const canonical = 'https://filtraai.com/blog/google-business-profile-avaliacoes';

export const metadata: Metadata = {
  title: 'Google Business Profile e avaliações: como criar uma rotina que funciona',
  description:
    'Como organizar uma rotina de avaliações no Google Business Profile sem depender de pedidos aleatórios: momento, canal, feedback e acompanhamento.',
  alternates: { canonical },
  openGraph: { type: 'article', title: 'Google Business Profile e avaliações', description: 'Como criar uma rotina consistente de avaliações no Google Business Profile.', url: canonical, images: [OG_IMAGE_META] },
  twitter: buildTwitter('Google Business Profile e avaliações', 'Como criar uma rotina consistente de avaliações no Google Business Profile.'),
};

export default function Page() {
  return (
    <>
      <BlogSchema
        headline="Google Business Profile e avaliações: como criar uma rotina que funciona"
        description="Como organizar uma rotina de avaliações no Google Business Profile com feedback e acompanhamento."
        canonical={canonical}
        datePublished="2026-10-05"
        dateModified="2026-10-05"
      />
      <BlogArticle
        kicker="Google Business Profile · SEO local"
        title="Google Business Profile e avaliações: como criar uma rotina que funciona"
        lead="Uma estratégia de avaliações não deveria depender de lembrar de pedir uma review depois de cada atendimento. O resultado melhora quando o processo vira rotina."
      >
        <p>
          O Google Business Profile é uma das principais superfícies de descoberta local. Mas presença no perfil não resolve sozinha um problema comum: empresas que têm alguns picos de avaliações e depois passam semanas sem gerar novos sinais.
        </p>
        <H2>1. Comece pelo momento da experiência</H2>
        <p>
          O pedido de avaliação funciona melhor quando está ligado a um momento real da jornada. Pode ser depois da entrega, do check-out, da consulta, da refeição ou da conclusão de um serviço. O objetivo é reduzir o intervalo entre a experiência e o convite para registrar a opinião.
        </p>
        <H2>2. Não trate toda resposta como igual</H2>
        <p>
          Uma nota alta pode indicar satisfação, mas o texto da avaliação traz mais informação. Procure temas recorrentes: atendimento, tempo, limpeza, preço percebido, localização, produto e resolução de problemas. Esses temas ajudam a decidir o que deve ser mantido e o que precisa de correção.
        </p>
        <H2>3. Crie um caminho de feedback antes da avaliação pública</H2>
        <p>
          Um canal de feedback privado permite que o negócio conheça uma frustração enquanto ainda existe espaço para agir. Isso não substitui avaliações públicas honestas; serve para fechar o ciclo interno e aprender com o que aconteceu.
        </p>
        <H2>4. Acompanhe volume, recência e temas</H2>
        <p>
          Não olhe apenas para a nota média. Observe quantas avaliações novas chegaram, se o fluxo está consistente e quais assuntos aparecem com mais frequência. Uma rotina simples de acompanhamento semanal já ajuda a separar mudança real de ruído.
        </p>
        <H2>5. Conecte reputação com operação</H2>
        <p>
          O valor da avaliação está na decisão que ela provoca. Se clientes repetem a mesma reclamação sobre espera, o problema deixa de ser “marketing” e vira uma prioridade operacional. É essa ligação entre voz do cliente e ação que transforma reputação em ativo de negócio.
        </p>
        <p>
          Para aprofundar a execução, veja <Link href="/avaliacoes-google" className="text-indigo-300 underline">gestão de avaliações Google</Link>, <Link href="/gestao-de-reputacao-online" className="text-indigo-300 underline">gestão de reputação online</Link> e faça uma <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
        <p>
          Se você atende múltiplos clientes ou unidades, veja também{' '}
          <Link href="/agencias" className="text-indigo-300 underline">
            gestão de reputação para agências de SEO local
          </Link>{' '}
          e o guia sobre{' '}
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-300 underline">
            pacotes de SEO local e Local Pack
          </Link>
          .
        </p>
      </BlogArticle>
    </>
  );
}