import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Como vender gestão de reputação recorrente | Filtra.AI',
  description:
    'Como vender gestão de reputação para clientes de SEO local: avaliações Google, monitoramento, relatórios e melhoria contínua como serviço recorrente.',
  alternates: {
    canonical: 'https://filtraai.com/blog/agencia-vender-gestao-reputacao',
    languages: {
      'pt-BR': 'https://filtraai.com/blog/agencia-vender-gestao-reputacao',
      en: 'https://filtraai.com/en/blog/agency-reputation-management',
      es: 'https://filtraai.com/es/blog/agencia-gestion-reputacion',
      zh: 'https://filtraai.com/zh/blog/agency-reputation-management',
      'x-default': 'https://filtraai.com/blog/agencia-vender-gestao-reputacao',
    },
  },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="B2B · Agências"
      title="Agência: como vender gestão de reputação como serviço recorrente"
      lead="Cliente de SEO local já paga por presença no Google. Reputação operacional transforma avaliações e feedback em uma rotina que aparece todo mês na reunião."
    >
      <H2>A promessa em uma frase</H2>
      <p>
        “Organizamos convites para avaliações genuínas, monitoramos os temas que os clientes citam e ajudamos
        a equipe a transformar feedback em melhoria operacional.”
      </p>
      <H2>Empacote</H2>
      <p>
        Setup (QR + Google URL) · treinamento de 30 min · monitoramento mensal · relatório. Cobrança
        recorrente alinhada ao retainer de SEO.
      </p>
      <H2>Ferramenta</H2>
      <p>
        Use o trial Filtra.AI em um cliente piloto. Mostre o painel, o fluxo de feedback e os indicadores de
        reputação. Depois padronize a rotina na carteira.
      </p>
      <p>
        Para estruturar a oferta por serviço, escopo e entregáveis, veja também{' '}
        <Link href="/agencias" className="text-indigo-400 underline">
          gestão de reputação para agências de SEO local
        </Link>
        .
      </p>
      <H2>Métricas que o cliente entende</H2>
      <p>
        Novas avaliações no mês, nota média, recência, temas de reclamação, tempo de resposta e melhorias
        implementadas. Menos vanity, mais operação. Para aprofundar a relação entre avaliações, reputação e
        presença local, consulte o guia de{' '}
        <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">
          pacotes de SEO local e Local Pack
        </Link>
        .
      </p>
    </BlogArticle>
  );
}
