import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Agência: como vender gestão de reputação como serviço recorrente',
  description:
    'Posicione reviews e reputação no pacote de SEO local. Onboarding, narrativa de valor e trial Filtra.AI para clientes da agência.',
  alternates: { canonical: '/blog/agencia-vender-gestao-reputacao' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="B2B · Agências"
      title="Agência: como vender gestão de reputação como serviço recorrente"
      lead="Cliente de SEO local já paga por Maps e conteúdo. Reputação operacional é o add-on que aparece todo mês na reunião."
    >
      <H2>A promessa em uma frase</H2>
      <p>
        “Aumentamos reviews recentes no Google e reduzimos surpresas de nota baixa com um canal de feedback
        no ponto de venda.”
      </p>
      <H2>Empacote</H2>
      <p>
        Setup (QR + Google URL) · treinamento de 30 min · monitoramento mensal · relatório. Cobrança
        recorrente alinhada ao retainer de SEO.
      </p>
      <H2>Ferramenta</H2>
      <p>
        Use o trial Filtra.AI em um cliente piloto. Mostre o painel e o fluxo 4–5 / 1–3. Depois padronize na
        carteira.
      </p>
      <H2>Métricas que o cliente entende</H2>
      <p>
        Novos reviews no mês, nota média, temas de reclamação resolvidos, tempo de resposta. Menos vanity,
        mais operação.
      </p>
    </BlogArticle>
  );
}
