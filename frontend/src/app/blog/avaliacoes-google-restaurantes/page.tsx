import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

const canonical = 'https://filtraai.com/blog/avaliacoes-google-restaurantes';

export const metadata: Metadata = {
  title: 'Avaliações Google para restaurantes: rotina prática de feedback',
  description:
    'Como restaurantes podem organizar feedback, analisar avaliações Google e transformar reclamações recorrentes em melhorias de serviço.',
  alternates: { canonical },
  openGraph: { type: 'article', title: 'Avaliações Google para restaurantes', description: 'Rotina prática de feedback e reputação para restaurantes.', url: canonical },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Avaliações Google para restaurantes: rotina prática de feedback',
  description: 'Como restaurantes podem organizar feedback e analisar avaliações Google.',
  datePublished: '2026-10-05',
  dateModified: '2026-10-05',
  author: { '@type': 'Organization', name: 'Filtra.AI', url: 'https://filtraai.com' },
  publisher: { '@type': 'Organization', name: 'Filtra.AI', url: 'https://filtraai.com' },
  mainEntityOfPage: canonical,
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogArticle
        kicker="Restaurantes · Google Reviews"
        title="Avaliações Google para restaurantes: rotina prática de feedback"
        lead="Restaurante tem contato com o cliente em vários pontos da jornada. A estratégia de avaliações funciona melhor quando esses pontos viram uma rotina simples."
      >
        <p>
          Atendimento, tempo de espera, comida, temperatura, ambiente e resolução de problemas aparecem com frequência em avaliações de restaurantes. A melhor rotina não tenta apagar esses sinais: ela organiza o que o cliente está dizendo para que a equipe consiga agir.
        </p>
        <H2>Conecte feedback ao momento certo</H2>
        <p>
          Um QR code pode facilitar o registro de feedback próximo da experiência. O importante é que o canal seja simples, rápido e explique o que acontece com a informação recebida.
        </p>
        <H2>Leia temas, não apenas estrelas</H2>
        <p>
          Duas avaliações com a mesma nota podem representar experiências completamente diferentes. Agrupe comentários por assuntos como atendimento, espera, comida, ambiente e preço percebido para encontrar oportunidades mais concretas.
        </p>
        <H2>Use críticas para melhorar a operação</H2>
        <p>
          Se um problema aparece repetidamente, trate-o como um tema operacional. A pergunta passa a ser: o que precisa mudar no processo, treinamento ou capacidade para reduzir a recorrência?
        </p>
        <H2>Crie consistência</H2>
        <p>
          Não dependa de uma campanha isolada. O objetivo é estabelecer uma rotina contínua, medir o que está chegando e revisar os temas mais importantes com a equipe.
        </p>
        <p>
          Veja <Link href="/restaurantes" className="text-indigo-300 underline">gestão de reputação para restaurantes</Link>, <Link href="/pedir-estrela-vs-filtrar" className="text-indigo-300 underline">pedir estrelas vs. feedback</Link> e <Link href="/auditoria-gratuita" className="text-indigo-300 underline">auditoria gratuita</Link>.
        </p>
      </BlogArticle>
    </>
  );
}