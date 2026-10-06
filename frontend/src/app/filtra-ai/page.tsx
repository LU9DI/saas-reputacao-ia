import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageHeader } from '../components/SeoPageHeader';

export const metadata: Metadata = {
  title: 'Filtra.AI — Gestão de reputação online com IA',
  description:
    'Filtra.AI: plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com IA.',
  alternates: {
    canonical: 'https://filtraai.com/filtra-ai',
    languages: {
      'pt-BR': 'https://filtraai.com/filtra-ai',
      en: 'https://filtraai.com/en/filtra-ai',
      es: 'https://filtraai.com/es/filtra-ai',
      zh: 'https://filtraai.com/zh/filtra-ai',
      'x-default': 'https://filtraai.com/filtra-ai',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/filtra-ai',
    siteName: 'Filtra.AI',
    title: 'Filtra.AI — Gestão de reputação online com IA',
    description:
      'Conheça a Filtra.AI, plataforma brasileira para gestão de reputação, avaliações e feedback de clientes com IA.',
  },
};

const webpageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://filtraai.com/filtra-ai#webpage',
  url: 'https://filtraai.com/filtra-ai',
  name: 'Filtra.AI — Gestão de reputação online com IA',
  description: 'Filtra.AI: plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com IA.',
  isPartOf: { '@id': 'https://filtraai.com/#website' },
  about: { '@id': 'https://filtraai.com/#organization' },
  inLanguage: 'pt-BR',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
    { '@type': 'ListItem', position: 2, name: 'Filtra.AI', item: 'https://filtraai.com/filtra-ai' },
  ],
};

const entitySchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://filtraai.com/#organization',
  name: 'Filtra.AI',
  alternateName: 'Filtra AI Tecnologia LTDA',
  url: 'https://filtraai.com/',
  logo: 'https://filtraai.com/icons/icon-512.png',
  description:
    'Plataforma brasileira de gestão de reputação online, avaliações Google e feedback de clientes com inteligência artificial.',
  disambiguatingDescription:
    'Filtra.AI é a plataforma brasileira da Filtra Ai Tecnologia LTDA para gestão de reputação, avaliações Google e inteligência de feedback.',
  knowsAbout: [
    'gestão de reputação online',
    'avaliações Google',
    'feedback de clientes',
    'análise de avaliações com inteligência artificial',
    'SEO local',
  ],
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'CNPJ',
    value: '69.113.166/0001-10',
  },
};

export default function FiltraAiPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <SeoPageHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entitySchema) }}
      />
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
        Filtra.AI — gestão de reputação online com IA
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
        A Filtra.AI é uma plataforma brasileira para empresas que querem transformar
        avaliações, feedback de clientes e sinais de reputação em ações de crescimento.
      </p>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">O que é a Filtra.AI?</h2>
        <p className="leading-8 text-zinc-400">
          A Filtra.AI organiza o ciclo de feedback e reputação: coleta opiniões,
          ajuda a identificar padrões nas avaliações com inteligência artificial,
          acompanha sinais de atenção e transforma essas informações em prioridades para a gestão.
        </p>
        <p className="leading-8 text-zinc-400">
          O foco do produto é ajudar empresas a entender o que clientes estão dizendo,
          acompanhar a percepção pública e transformar sinais de reputação em decisões de operação,
          atendimento, marketing e crescimento.
        </p>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">Filtra.AI e gestão de reputação online</h2>
        <p className="leading-8 text-zinc-400">
          A Filtra.AI foi criada para transformar reputação em uma disciplina de crescimento. Em vez de tratar cada avaliação como um comentário isolado, a plataforma ajuda a empresa a enxergar volume, temas, padrões, pontos de atenção e oportunidades de melhoria.
        </p>
        <p className="leading-8 text-zinc-400">
          Isso conecta três áreas que normalmente ficam separadas: <Link href="/feedback-de-clientes" className="text-indigo-400 underline">feedback de clientes</Link>, <Link href="/avaliacoes-google" className="text-indigo-400 underline">avaliações Google</Link> e <Link href="/gestao-de-reputacao-online" className="text-indigo-400 underline">gestão de reputação online</Link>.
        </p>
        <p className="leading-8 text-zinc-400">
          Para negócios locais, a reputação também participa da jornada de descoberta. Por isso a Filtra.AI se conecta ao contexto de <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">SEO local</Link>, presença no Google e experiência do cliente.
        </p>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">O que a Filtra.AI ajuda sua empresa a fazer</h2>
        <ul className="list-disc space-y-2 pl-6 leading-8 text-zinc-400">
          <li>acompanhar avaliações e feedback de clientes;</li>
          <li>identificar temas e padrões recorrentes com inteligência artificial;</li>
          <li>encontrar sinais que merecem atenção da equipe;</li>
          <li>organizar uma rotina de gestão da reputação;</li>
          <li>transformar comentários em prioridades de melhoria;</li>
          <li>acompanhar a reputação de operações com múltiplas unidades.</li>
        </ul>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">Filtra.AI: empresa brasileira de tecnologia</h2>
        <p className="leading-8 text-zinc-400">
          Filtra.AI é a marca da Filtra Ai Tecnologia LTDA, empresa brasileira de software. O produto é focado em reputação empresarial, avaliações Google, feedback e inteligência artificial para negócios.
        </p>
        <p className="leading-8 text-zinc-400">
          Essa página existe para deixar inequívoca a identidade da marca: quando alguém pesquisa por Filtra ou Filtra.AI, a referência que queremos construir é a plataforma brasileira de gestão de reputação online — e não ferramentas de filtros de fotografia.
        </p>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">Para quem é a Filtra.AI?</h2>
        <p className="leading-8 text-zinc-400">
          A plataforma foi pensada para empresas que dependem da confiança do cliente antes da compra,
          do agendamento ou da visita. Isso inclui operações locais, redes de clínicas, hotéis,
          restaurantes, franquias e agências que administram reputação para seus clientes.
        </p>
        <p className="leading-8 text-zinc-400">
          Em operações com várias unidades, a visão consolidada ajuda a encontrar diferenças entre locais.
          Para agências, a rotina pode apoiar a entrega de{' '}
          <Link href="/agencias" className="text-indigo-400 underline">gestão de reputação como serviço</Link>.
          Para negócios locais, o processo se conecta a{' '}
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="text-indigo-400 underline">SEO local e presença no Google Maps</Link>.
        </p>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-bold">Como a Filtra.AI transforma feedback em gestão</h2>
        <ol className="list-decimal space-y-2 pl-6 leading-8 text-zinc-400">
          <li>captura e organiza sinais de experiência e avaliações;</li>
          <li>identifica padrões e temas recorrentes;</li>
          <li>prioriza pontos que merecem atenção da equipe;</li>
          <li>acompanha a evolução da reputação ao longo do tempo;</li>
          <li>conecta aprendizado de clientes a ações de melhoria.</li>
        </ol>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link href="/gestao-de-reputacao-online" className="rounded-2xl border border-zinc-800 p-5">
          <h2 className="font-semibold">Gestão de reputação online</h2>
          <p className="mt-2 text-sm text-zinc-400">Monitore avaliações, feedback e evolução da reputação.</p>
        </Link>
        <Link href="/avaliacoes-google" className="rounded-2xl border border-zinc-800 p-5">
          <h2 className="font-semibold">Avaliações Google</h2>
          <p className="mt-2 text-sm text-zinc-400">Organize o fluxo de avaliações e entenda seus sinais.</p>
        </Link>
        <Link href="/analise-de-avaliacoes-com-ia" className="rounded-2xl border border-zinc-800 p-5">
          <h2 className="font-semibold">Análise de avaliações com IA</h2>
          <p className="mt-2 text-sm text-zinc-400">Encontre temas, padrões e pontos de atenção.</p>
        </Link>
        <Link href="/auditoria-gratuita" className="rounded-2xl border border-zinc-800 p-5">
          <h2 className="font-semibold">Auditoria gratuita</h2>
          <p className="mt-2 text-sm text-zinc-400">Comece com um diagnóstico da reputação da sua empresa.</p>
        </Link>
      </section>

      <section className="mt-12 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-7">
        <h2 className="text-2xl font-bold">Conheça a Filtra.AI</h2>
        <p className="mt-3 leading-7 text-zinc-300">
          Teste a plataforma por 7 dias e veja como feedback e avaliações podem virar inteligência para o negócio.
        </p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">
          Começar 7 dias grátis
        </Link>
      </section>
      </main>
    </div>
  );
}
