import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'SEO local e avaliações: o que realmente ranqueia no Local Pack',
  description:
    'Proximidade, Google Business Profile e reviews (volume, nota, recência, respostas). Como encaixar reputação na estratégia de SEO local.',
  alternates: { canonical: '/blog/seo-local-avaliacoes-local-pack' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="SEO"
      title="SEO local e avaliações: o que realmente ranqueia no Local Pack"
      lead="Links ainda importam no orgânico amplo. No mapa, perfil completo e reviews costumam pesar mais para o negócio da esquina."
    >
      <H2>Três pilares clássicos</H2>
      <p>
        Relevância (categoria, serviços), distância (onde o usuário está) e destaque (autoridade, reviews,
        menções). Avaliações entram forte no “destaque”.
      </p>
      <H2>Sinais de review</H2>
      <p>
        Quantidade, nota média, velocity (novas por mês), texto com menções a serviços e respostas do dono.
        Negócio com fluxo recente tende a parecer mais confiável que perfil congelado.
      </p>
      <H2>Site + GBP</H2>
      <p>
        Mantenha NAP consistente, site rápido e perfil Google Meu Negócio completo. Reviews não substituem
        isso — multiplicam o efeito.
      </p>
      <H2>Operação de reputação</H2>
      <p>
        Ferramentas como o Filtra.AI ajudam a gerar velocity de 4–5★ no Google e a tratar 1–3★ antes de virar
        crise — encaixe natural na oferta de SEO local de agências e no dia a dia do dono.
      </p>
    </BlogArticle>
  );
}
