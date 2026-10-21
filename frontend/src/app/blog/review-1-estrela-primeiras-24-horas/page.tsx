import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';
import { BlogSchema } from '../../components/BlogSchema';
import { OG_IMAGE_META, buildTwitter } from '../../lib/blogSchema';

export const metadata: Metadata = {
  title: 'Review 1★: o que fazer nas primeiras 24 horas',
  description:
    'Checklist operacional quando chega uma avaliação negativa: investigar, responder com calma, corrigir processo e acompanhar a reputação.',
  alternates: { canonical: '/blog/review-1-estrela-primeiras-24-horas' },
  openGraph: {
    type: 'article',
    url: 'https://filtraai.com/blog/review-1-estrela-primeiras-24-horas',
    title: 'Review 1★: o que fazer nas primeiras 24 horas',
    description:
      'Checklist operacional quando chega uma avaliação negativa: investigar, responder com calma, corrigir processo e acompanhar a reputação.',
    images: [OG_IMAGE_META],
  },
  twitter: buildTwitter(
    'Review 1★: o que fazer nas primeiras 24 horas',
    'Checklist operacional quando chega uma avaliação negativa: investigar, responder com calma, corrigir processo e acompanhar a reputação.',
  ),
};

export default function Page() {
  return (
    <>
      <BlogSchema
        headline="Review 1★: o que fazer nas primeiras 24 horas"
        description="Checklist operacional quando chega uma avaliação negativa: investigar, responder com calma, corrigir processo e acompanhar a reputação."
        canonical="https://filtraai.com/blog/review-1-estrela-primeiras-24-horas"
        datePublished="2026-09-23"
        dateModified="2026-10-07"
      />
      <BlogArticle
      kicker="Operação"
      title="Review 1★: o que fazer nas primeiras 24 horas"
      lead="Pânico não resolve. Processo sim. Use as primeiras horas para entender o fato e demonstrar cuidado — em público ou no privado."
    >
      <H2>1. Leia com calma e isole o fato</H2>
      <p>
        Separe emoção de problema concreto: atraso, produto, atendimento ou cobrança. Anote horário, unidade
        e quem atendeu.
      </p>
      <H2>2. Se o cliente também deixou feedback privado</H2>
      <p>
        Responda pelo canal adequado, ofereça solução quando fizer sentido e registre o aprendizado no time.
        O feedback privado é um espaço complementar de acompanhamento, não uma substituição de avaliações
        públicas honestas.
      </p>
      <H2>3. Se a avaliação já estiver pública no Google</H2>
      <p>
        Responda em tom profissional, sem discutir em público. Convide para resolver offline quando
        apropriado. Não peça para apagar ou alterar a avaliação em troca de brinde ou benefício.
      </p>
      <H2>4. Corrija a causa</H2>
      <p>
        Uma avaliação isolada dói; o padrão dói mais. Ajuste o processo que gerou a reclamação e monitore a
        semana seguinte.
      </p>
      <H2>5. Conecte a crise a uma rotina de reputação</H2>
      <p>
        Uma resposta isolada resolve o episódio, mas a gestão precisa observar recorrência, temas e mudanças na
        percepção. Para estruturar essa rotina em uma operação local, veja o guia de{' '}
        <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">
          pacotes de SEO local e avaliações
        </Link>
        .
      </p>
      <p>
        Se quiser transformar esse processo em rotina, veja também a{' '}
        <Link href="/gestao-de-reputacao-online" className="text-indigo-400 underline">
          gestão de reputação online
        </Link>{' '}
        e o guia de{' '}
        <Link href="/gestao-de-feedback" className="text-indigo-400 underline">
          gestão de feedback de clientes
        </Link>
        .
      </p>
      </BlogArticle>
    </>
  );
}
