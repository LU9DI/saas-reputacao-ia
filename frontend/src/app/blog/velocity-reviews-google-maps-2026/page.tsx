import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Como manter avaliações recentes no Google Maps em 2026',
  description:
    'Entenda por que uma rotina consistente de pedidos honestos, respostas e acompanhamento ajuda na gestão de avaliações e no SEO local.',
  alternates: { canonical: '/blog/velocity-reviews-google-maps-2026' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="SEO local · 2026"
      title="Como manter avaliações recentes no Google Maps em 2026"
      lead="Ter avaliações antigas sem novas interações dificulta acompanhar a percepção atual dos clientes. O objetivo é criar uma rotina consistente e autêntica."
    >
      <H2>O que é velocity</H2>
      <p>
        Velocity é a cadência de novas avaliações ao longo do tempo. Ela não substitui nota média, volume,
        qualidade do atendimento ou outros sinais de presença local, mas ajuda a mostrar a percepção mais
        recente dos clientes.
      </p>
      <H2>Por que a consistência importa</H2>
      <p>
        Em SEO local, não existe uma única métrica que garanta posição. Uma rotina consistente facilita
        monitorar mudanças na experiência, responder avaliações novas e manter o perfil atualizado com sinais
        recentes da operação.
      </p>
      <H2>Como operar de forma saudável</H2>
      <p>
        Convide clientes de forma não seletiva para compartilhar uma avaliação honesta após experiências reais.
        Use QR ou link próprio para reduzir atrito, sem comprar avaliações, oferecer incentivo por nota ou
        pedir uma classificação específica.
      </p>
      <H2>O papel do feedback privado</H2>
      <p>
        Um canal próprio também pode receber feedback de quem prefere falar diretamente com a empresa. Isso
        cria contexto para corrigir atendimento, prazo ou produto, enquanto o cliente continua livre para
        decidir se publica uma avaliação no Google.
      </p>
      <p>
        Para operações com vários clientes, veja também <Link href="/agencias" className="text-indigo-400 underline">gestão de reputação para agências de SEO local</Link> e o guia sobre <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">SEO local e Local Pack</Link>.
      </p>
    </BlogArticle>
  );
}
