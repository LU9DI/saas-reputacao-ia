import type { Metadata } from 'next';
import Link from 'next/link';

const canonical = 'https://filtraai.com/indice-reputacao-filtra';

export const metadata: Metadata = {
  title: 'Índice de Reputação Filtra: metodologia e transparência',
  description:
    'Conheça os critérios de qualidade, privacidade e transparência previstos para o Índice de Reputação Filtra. Os resultados serão publicados quando houver amostra suficiente e verificável.',
  alternates: { canonical },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Índice de Reputação Filtra: metodologia e transparência',
    description:
      'Metodologia, critérios de publicação e compromisso com dados verificáveis sobre reputação empresarial.',
    url: canonical,
    type: 'website',
  },
};

const principles = [
  {
    title: 'Dados verificáveis',
    body: 'Cada indicador deverá ter fonte documentada, período de coleta, regras de inclusão e processo de validação. Não publicaremos estimativas como se fossem observações.',
  },
  {
    title: 'Amostra suficiente',
    body: 'Como critério inicial de publicação por segmento, planejamos exigir ao menos 30 empresas distintas e 500 avaliações válidas, além de uma janela temporal claramente definida. Esses limites serão revistos conforme a cobertura e a qualidade dos dados.',
  },
  {
    title: 'Privacidade por padrão',
    body: 'Não serão publicados nomes de clientes da Filtra, comentários identificáveis ou recortes que permitam inferir dados de uma empresa específica. Dados de clientes só poderão contribuir quando houver base legal, transparência e autorização compatível com esse uso.',
  },
  {
    title: 'Método reproduzível',
    body: 'A metodologia explicará como tratamos duplicatas, avaliações de teste, datas ausentes, distribuição das notas, amostras pequenas e possíveis vieses de cobertura.',
  },
];

export default function IndiceReputacaoFiltraPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-14 text-zinc-100 sm:px-8 sm:py-20">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-400">
        <Link href="/" className="transition hover:text-white">Início</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">Índice de Reputação Filtra</span>
      </nav>

      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
          Pesquisa e transparência
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Índice de Reputação Filtra
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">
          Estamos estruturando uma referência pública sobre reputação empresarial baseada em
          dados verificáveis. Antes de divulgar números, precisamos garantir cobertura,
          qualidade, comparabilidade e proteção das empresas e pessoas envolvidas.
        </p>
      </header>

      <section
        aria-labelledby="status-title"
        className="mt-10 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-6 sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
          Estado atual
        </p>
        <h2 id="status-title" className="mt-2 text-2xl font-semibold">
          Resultados ainda não publicados
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
          A base atualmente auditada ainda não permite produzir comparações públicas por setor
          ou região com rigor. Por isso, esta página apresenta os critérios de publicação, não
          um ranking ou uma média de mercado. Nenhum resultado será estimado ou preenchido
          artificialmente para aparentar cobertura.
        </p>
      </section>

      <section aria-labelledby="principles-title" className="mt-14">
        <h2 id="principles-title" className="text-2xl font-semibold">
          Como pretendemos construir o índice
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {principles.map((principle, index) => (
            <article key={principle.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-medium text-indigo-300">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{principle.title}</h3>
              <p className="mt-2 leading-7 text-zinc-300">{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="metrics-title" className="mt-14 max-w-3xl">
        <h2 id="metrics-title" className="text-2xl font-semibold">
          O que poderá ser medido
        </h2>
        <ul className="mt-5 space-y-3 leading-7 text-zinc-300">
          <li><strong className="text-white">Distribuição das notas:</strong> frequência de cada nota e média, sempre acompanhadas do tamanho da amostra.</li>
          <li><strong className="text-white">Recência:</strong> período coberto e evolução temporal, quando houver histórico suficiente.</li>
          <li><strong className="text-white">Resposta às avaliações:</strong> somente quando a fonte disponibilizar esse dado de forma consistente.</li>
          <li><strong className="text-white">Temas de feedback:</strong> categorias agregadas com regras documentadas e revisão de qualidade.</li>
        </ul>
        <p className="mt-5 leading-7 text-zinc-400">
          O índice não será uma promessa de posição no Google, um selo de qualidade de uma
          empresa ou uma medida absoluta de satisfação. Comparações entre segmentos só serão
          feitas quando as diferenças de fonte, cobertura e período puderem ser explicadas.
        </p>
      </section>

      <section aria-labelledby="research-pages-title" className="mt-14">
        <h2 id="research-pages-title" className="text-2xl font-semibold">
          Frentes de pesquisa em preparação
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
          As páginas abaixo registram o escopo e os critérios de cada frente. Ainda não são
          relatórios de mercado e permanecem fora da indexação até a validação dos dados.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/indice-reputacao-filtra/setores" className="rounded-xl border border-white/10 p-5 transition hover:border-indigo-300/50">
            <h3 className="font-semibold">Índice por setor</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Taxonomia, cobertura e comparabilidade entre atividades econômicas.</p>
          </Link>
          <Link href="/indice-reputacao-filtra/regioes" className="rounded-xl border border-white/10 p-5 transition hover:border-indigo-300/50">
            <h3 className="font-semibold">Índice por região</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Localização verificável e critérios para comparações geográficas.</p>
          </Link>
          <Link href="/indice-reputacao-filtra/tendencias" className="rounded-xl border border-white/10 p-5 transition hover:border-indigo-300/50">
            <h3 className="font-semibold">Tendências</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Séries temporais com regras consistentes e histórico de alterações.</p>
          </Link>
          <Link href="/indice-reputacao-filtra/relatorio-anual" className="rounded-xl border border-white/10 p-5 transition hover:border-indigo-300/50">
            <h3 className="font-semibold">Relatório anual</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Descobertas auditáveis, limitações e metodologia versionada.</p>
          </Link>
        </div>
      </section>

      <section aria-labelledby="updates-title" className="mt-14 border-t border-white/10 pt-8">
        <h2 id="updates-title" className="text-xl font-semibold">Transparência e atualizações</h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
          Quando os critérios forem atendidos, publicaremos os resultados com data de corte,
          metodologia, limitações e histórico de revisões. Até lá, esta página permanecerá
          fora dos resultados de busca para evitar apresentar uma página de metodologia como
          se já fosse um relatório de mercado.
        </p>
        <Link
          href="/gestao-de-reputacao-online"
          className="mt-6 inline-flex rounded-xl border border-white/15 px-5 py-3 font-medium transition hover:border-indigo-300/60 hover:bg-white/5"
        >
          Conheça a gestão de reputação online
        </Link>
      </section>
    </main>
  );
}
