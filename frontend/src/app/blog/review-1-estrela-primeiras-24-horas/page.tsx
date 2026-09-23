import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Review 1★: o que fazer nas primeiras 24 horas',
  description:
    'Checklist operacional quando chega uma avaliação péssima: investigar, responder com calma, corrigir processo e proteger a reputação.',
  alternates: { canonical: '/blog/review-1-estrela-primeiras-24-horas' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Operação"
      title="Review 1★: o que fazer nas primeiras 24 horas"
      lead="Pânico não resolve. Processo sim. Use as primeiras horas para entender o fato e demonstrar cuidado — em público ou no privado."
    >
      <H2>1. Leia com calma e isole o fato</H2>
      <p>
        Separe emoção de problema concreto: atraso, produto, atendimento, cobrança. Anote horário, unidade e
        quem atendeu.
      </p>
      <H2>2. Se ainda estiver no painel (não no Google)</H2>
      <p>
        No Filtra.AI, notas 1–3★ ficam privadas. Contate o cliente pelo canal adequado, ofereça solução e
        registre o aprendizado no time.
      </p>
      <H2>3. Se já estiver público no Google</H2>
      <p>
        Responda em tom profissional, sem discutir em público. Convide para resolver offline. Não peça para
        “apagar em troca de brinde” — isso pode violar políticas.
      </p>
      <H2>4. Corrija a causa</H2>
      <p>
        Uma review isolada dói; o padrão dói mais. Ajuste o processo que gerou a reclamação e monitore a
        semana seguinte.
      </p>
    </BlogArticle>
  );
}
