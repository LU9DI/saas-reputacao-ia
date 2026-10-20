import type { Metadata } from 'next';

const siteUrl = 'https://filtraai.com';
const pageUrl = `${siteUrl}/indice-reputacao`;

export const metadata: Metadata = {
  title: 'Índice de Reputação Online: metodologia e transparência',
  description:
    'Conheça a metodologia proposta pelo Filtra.AI para acompanhar tendências agregadas de reputação por setor. Sem notas inventadas, avaliações fictícias ou exposição de empresas.',
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'Filtra.AI',
    title: 'Índice de Reputação Online | Filtra.AI',
    description:
      'Metodologia, critérios de publicação e compromisso com dados agregados e verificáveis sobre reputação online.',
  },
  robots: { index: true, follow: true },
};

const questions = [
  {
    question: 'O índice já publica médias por setor ou cidade?',
    answer:
      'Ainda não. O Filtra.AI não publica médias setoriais enquanto não houver uma amostra real, suficientemente ampla e verificável para sustentar cada recorte. Não usamos números simulados para preencher lacunas.',
  },
  {
    question: 'Os dados permitem identificar uma empresa?',
    answer:
      'A proposta é publicar apenas resultados agregados, sem nomes, textos integrais de avaliações, e-mails, identificadores de clientes ou rankings de empresas individuais. Recortes pequenos não devem ser publicados.',
  },
  {
    question: 'Como os resultados serão calculados?',
    answer:
      'Cada publicação deverá informar período, setor, região quando aplicável, tamanho da amostra, origem dos dados, critérios de inclusão, tratamento de duplicatas e limitações. Comparações só serão feitas quando as amostras forem comparáveis.',
  },
  {
    question: 'O índice representa todas as empresas brasileiras?',
    answer:
      'Não necessariamente. A cobertura dependerá das fontes e da amostra disponível. Os resultados deverão descrever a população observada e não poderão ser apresentados como representativos do Brasil inteiro sem desenho amostral que sustente essa conclusão.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: 'Índice de Reputação Online: metodologia e transparência',
      description:
        'Metodologia pública para a publicação futura de indicadores agregados de reputação online.',
      inLanguage: 'pt-BR',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      mainEntity: { '@id': `${pageUrl}#methodology` },
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    },
    {
      '@type': 'CreativeWork',
      '@id': `${pageUrl}#methodology`,
      name: 'Metodologia do Índice de Reputação Online Filtra.AI',
      creator: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'pt-BR',
      description:
        'Critérios de transparência para publicar estatísticas agregadas somente quando houver dados reais e amostra adequada.',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Índice de Reputação', item: pageUrl },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: questions.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
};

export default function IndiceReputacaoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 text-slate-900 sm:px-8 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <a href="/" className="underline underline-offset-4">Início</a>
        <span aria-hidden="true"> / </span>
        <span>Índice de Reputação</span>
      </nav>

      <header className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Dados, método e transparência
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Índice de Reputação Online Filtra.AI
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Um projeto para acompanhar padrões de experiência do cliente por setor
          usando dados reais, agregados e contextualizados — sem inventar médias
          nem transformar amostras pequenas em rankings.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6" aria-labelledby="status-title">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">Estado atual</p>
        <h2 id="status-title" className="mt-2 text-xl font-bold text-slate-900">
          Indicadores públicos ainda não publicados
        </h2>
        <p className="mt-3 leading-7 text-slate-700">
          Neste momento, esta página apresenta a metodologia e os critérios de
          transparência. Não há médias setoriais ou tendências mensais publicadas
          aqui porque elas precisam ser calculadas a partir de uma base real,
          validada e suficientemente ampla. Números ilustrativos não serão
          apresentados como resultados do mercado.
        </p>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Princípios de publicação">
        <article className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold">O que poderá ser acompanhado</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-slate-700">
            <li>Distribuição de notas por setor e período, quando houver amostra suficiente.</li>
            <li>Temas recorrentes de feedback, com categorias consistentes e documentadas.</li>
            <li>Evolução temporal, distinguindo mudança real de alteração na composição da amostra.</li>
            <li>Diferenças regionais somente quando cobertura e volume permitirem comparação responsável.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold">O que não faremos</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-slate-700">
            <li>Inventar notas, percentuais, amostras ou tendências.</li>
            <li>Expor nomes de empresas, clientes ou textos identificáveis de avaliações.</li>
            <li>Publicar recortes pequenos que permitam inferir dados de um negócio.</li>
            <li>Tratar uma amostra voluntária como se representasse todo o mercado.</li>
          </ul>
        </article>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="method-title">
        <h2 id="method-title" className="text-2xl font-bold">Como cada publicação deverá ser auditável</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 leading-7 text-slate-700">
          <li><strong>Fonte e cobertura:</strong> declarar a origem dos dados, o período observado e quais setores ou regiões estão representados.</li>
          <li><strong>Amostra:</strong> divulgar quantidade de avaliações e negócios incluídos, com regras mínimas de publicação para reduzir risco de identificação.</li>
          <li><strong>Tratamento:</strong> documentar deduplicação, classificação de temas, dados ausentes e alterações metodológicas.</li>
          <li><strong>Comparabilidade:</strong> explicar limitações e evitar comparações entre amostras com composição ou fontes diferentes.</li>
          <li><strong>Atualizações:</strong> datar cada edição e manter histórico das mudanças de metodologia.</li>
        </ol>
        <p className="mt-5 leading-7 text-slate-600">
          A cobertura observada não será descrita como representativa de todo o
          Brasil, a menos que o desenho amostral sustente explicitamente essa
          conclusão. A metodologia será revisada antes de qualquer publicação
          de métricas públicas.
        </p>
      </section>

      <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mt-5 space-y-6">
          {questions.map(({ question, answer }) => (
            <article key={question}>
              <h3 className="text-lg font-semibold">{question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-slate-900 p-7 text-white sm:p-9">
        <h2 className="text-2xl font-bold">Quer analisar as avaliações da sua empresa?</h2>
        <p className="mt-3 max-w-2xl leading-7 text-slate-200">
          Faça uma auditoria gratuita com as avaliações que você fornecer. O
          diagnóstico não substitui os indicadores públicos do índice e não
          adiciona seus dados a estatísticas públicas sem uma política explícita
          e adequada para esse uso.
        </p>
        <a
          href="/auditoria-gratuita"
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
        >
          Fazer auditoria gratuita
        </a>
      </section>
    </main>
  );
}
