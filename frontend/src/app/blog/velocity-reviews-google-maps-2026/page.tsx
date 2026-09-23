import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Por que a velocidade de reviews importa no Google Maps em 2026',
  description:
    'Reviews recentes pesam mais que estoque antigo no Local Pack. Entenda velocity, frescor e como manter fluxo mensal de avaliações Google.',
  alternates: { canonical: '/blog/velocity-reviews-google-maps-2026' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="SEO local · 2026"
      title="Por que a velocidade de reviews importa no Google Maps em 2026"
      lead="Ter 200 avaliações de 2022 e zero nos últimos meses envia um sinal fraco. O Google — e as respostas de IA — valorizam negócio ativo."
    >
      <H2>O que é velocity</H2>
      <p>
        Velocity é a cadência de reviews novas (por exemplo, 5 a 15 por mês). Não substitui nota média nem
        volume total, mas complementa: mostra que clientes reais continuam interagindo com o perfil.
      </p>
      <H2>Por que isso subiu de importância</H2>
      <p>
        No Local Pack, sinais de Google Business Profile e reviews estão entre os mais citados por estudos
        de ranking local. Em paralelo, resumos de IA usam texto e recência de avaliações para decidir o que
        recomendar.
      </p>
      <H2>Como operar velocity de forma saudável</H2>
      <p>
        Peça avaliação no momento da satisfação (mesa, consulta, entrega). Use QR ou link próprio. Evite
        picos artificiais seguidos de silêncio — o padrão estável vence o “rajada e some”.
      </p>
      <H2>Papel do filtro</H2>
      <p>
        Um canal como o Filtra.AI aumenta a chance de capturar o cliente satisfeito (4–5★ → Google) e trata
        1–3★ no painel, sem depender só da sorte no Maps.
      </p>
    </BlogArticle>
  );
}
