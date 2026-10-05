import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageHeader } from '../components/SeoPageHeader';

export const metadata: Metadata = {
  title: 'Gestão de avaliações Google com IA | Filtra.AI',
  description: 'Organize o pedido de avaliações Google, entenda o feedback dos clientes e acompanhe a reputação da sua empresa no Google Maps com a Filtra.AI.',
  alternates: { canonical: 'https://filtraai.com/avaliacoes-google' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/avaliacoes-google',
    title: 'Gestão de avaliações Google com IA | Filtra.AI',
    description: 'Organize avaliações Google, feedback de clientes e sinais de reputação em um fluxo de gestão com IA.',
  },
};

const faqs = [
  ['O que é gestão de avaliações Google?', 'É o processo de acompanhar avaliações, entender temas recorrentes, responder quando necessário e usar o feedback para melhorar a experiência e a presença pública da empresa.'],
  ['A Filtra.AI ajuda a aumentar avaliações no Google?', 'A Filtra.AI organiza o fluxo de solicitação de feedback e avaliação para que a empresa tenha uma rotina estruturada de coleta. O resultado depende da experiência do cliente e da adesão ao processo.'],
  ['Posso analisar avaliações com IA?', 'Sim. A Filtra.AI ajuda a organizar avaliações e identificar padrões, temas e pontos de atenção para transformar comentários em informação útil para a gestão.'],
  ['A Filtra.AI substitui o Google Maps?', 'Não. O Google continua sendo o ambiente público das avaliações. A Filtra.AI funciona como uma camada de gestão e inteligência para organizar feedback, avaliações e sinais da experiência.'],
];

export default function Page() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
      { '@type': 'ListItem', position: 2, name: 'Avaliações Google', item: 'https://filtraai.com/avaliacoes-google' },
    ],
  };

  return (
    <>
      <SeoPageHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Google Reviews</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">Gestão de avaliações Google com IA</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">Transforme avaliações Google e feedback de clientes em uma rotina de gestão. Organize solicitações, identifique padrões e acompanhe os sinais que influenciam a percepção da sua empresa no Google Maps.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/auditoria-gratuita" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Fazer auditoria gratuita</Link>
        <Link href="/feedback-de-clientes" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Conhecer o fluxo de feedback</Link><Link href="/ia" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Filtra.AI para IA</Link>
      </div>

      <section className="mt-16 space-y-10">
        <div>
          <h2 className="text-3xl font-bold">Por que as avaliações Google importam?</h2>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Antes de escolher uma empresa, muitas pessoas consultam informações públicas sobre o negócio. As avaliações ajudam a mostrar experiências reais, mas também são uma fonte de sinais para a própria operação: atendimento, prazo, comunicação, ambiente, produto e outros temas aparecem repetidamente nos comentários.</p>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Por isso, gestão de avaliações Google não deve significar apenas acompanhar a nota. Uma operação consistente precisa entender volume, distribuição de estrelas, temas recorrentes e evolução ao longo do tempo.</p>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Do feedback à avaliação pública</h2>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">O Filtra.AI organiza uma jornada em que a empresa coleta feedback e cria um caminho claro para a manifestação pública. Clientes satisfeitos podem ser convidados a deixar uma avaliação pública, enquanto problemas e críticas podem ser registrados em um canal de atendimento adequado para análise e resolução.</p>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">O objetivo é entender a experiência do cliente e criar um processo contínuo de melhoria, sem substituir o espaço público das avaliações nem ocultar problemas que precisam ser tratados.</p>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Análise de avaliações com IA</h2>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma lista de estrelas não explica sozinha por que os clientes estão satisfeitos ou insatisfeitos. A análise com IA ajuda a agrupar temas e encontrar padrões que podem passar despercebidos quando a equipe lê cada comentário isoladamente.</p>
          <Link href="/analise-de-avaliacoes-com-ia" className="mt-4 inline-block underline">Conheça a análise de avaliações com IA →</Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Google Maps, reputação e SEO local</h2>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Avaliações fazem parte do ecossistema de presença local. Para empresas que dependem de descoberta regional, vale tratar Google Maps, reputação, experiência e conteúdo local como partes conectadas da operação.</p>
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="mt-4 inline-block underline">Leia sobre avaliações e SEO local →</Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          ['Solicite feedback', 'Crie uma rotina organizada para ouvir clientes depois da experiência.'],
          ['Entenda os sinais', 'Use IA para identificar temas recorrentes em avaliações e feedbacks.'],
          ['Acompanhe a reputação', 'Observe a evolução das avaliações e transforme aprendizados em ações.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-zinc-400">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold">Perguntas frequentes sobre avaliações Google</h2>
        <div className="mt-6 space-y-4">
          {faqs.map(([question, answer]) => (
            <details key={question} className="rounded-2xl border border-zinc-800 p-5">
              <summary className="cursor-pointer font-semibold">{question}</summary>
              <p className="mt-3 leading-7 text-zinc-400">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8">
        <h2 className="text-2xl font-bold">Descubra o que suas avaliações estão dizendo</h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">Faça uma auditoria gratuita e veja como a Filtra.AI pode ajudar sua empresa a transformar avaliações e feedback em uma rotina de gestão.</p>
        <Link href="/auditoria-gratuita" className="mt-6 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Começar auditoria gratuita</Link>
      </section>

      <nav className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/gestao-de-reputacao-online" className="underline">Gestão de reputação online</Link>
        <Link href="/feedback-de-clientes" className="underline">Feedback de clientes</Link>
        <Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link>
        <Link href="/blog/como-conseguir-avaliacoes-google" className="underline">Como conseguir avaliações Google</Link>
        <Link href="/blog/velocity-reviews-google-maps-2026" className="underline">Reviews e Google Maps</Link>
        <Link href="/blog/clinica-checklist-avaliacoes-google" className="underline">Checklist de avaliações Google</Link>
      </nav>
    </main>
    </>
  );
}
