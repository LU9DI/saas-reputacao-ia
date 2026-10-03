import type { Metadata } from 'next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Análise de avaliações com IA para empresas',
  description: 'Analise avaliações de clientes com IA para identificar temas, sentimento, riscos e oportunidades de melhoria com mais rapidez.',
  alternates: { canonical: 'https://filtraai.com/analise-de-avaliacoes-com-ia' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/analise-de-avaliacoes-com-ia',
    title: 'Análise de avaliações com IA para empresas | Filtra.AI',
    description: 'Analise avaliações de clientes com IA para identificar temas, sentimento, riscos e oportunidades de melhoria com mais rapidez.',
  },
};

export default function Page() {
  const items = ['reclamações recorrentes', 'elogios que revelam diferenciais', 'problemas operacionais', 'riscos de reputação', 'oportunidades de melhoria', 'temas que impactam a experiência do cliente'];
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-8 flex justify-end">
        <LanguageSwitcher />
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://filtraai.com/' },
          { '@type': 'ListItem', position: 2, name: 'Análise de avaliações com IA', item: 'https://filtraai.com/analise-de-avaliacoes-com-ia' },
        ],
      }) }} />
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Análise de avaliações com IA</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">Transforme centenas de avaliações em decisões de crescimento.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">A análise manual de reviews consome tempo e deixa padrões importantes passarem. A Filtra.AI usa inteligência artificial para organizar a voz do consumidor e mostrar o que merece atenção.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/auditoria-gratuita" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Começar gratuitamente</Link><Link href="/ia" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Filtra.AI para IA</Link></div>

      <section className="mt-16 space-y-10">
        <div><h2 className="text-3xl font-bold">Como a análise de avaliações ajuda a gestão</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma lista de reviews mostra comentários individuais. Uma análise estruturada permite enxergar recorrência, contexto e prioridade. Isso facilita identificar problemas que merecem investigação e pontos fortes que devem ser preservados.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">A inteligência artificial é especialmente útil quando o volume cresce. O sistema pode organizar grandes conjuntos de texto por temas, sinais de sentimento e contexto, reduzindo o trabalho de triagem e síntese. A equipe continua responsável pela decisão.</p></div>
        <div><h2 className="text-3xl font-bold">O que a IA pode revelar nas suas avaliações?</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(item => <div key={item} className="rounded-xl border border-zinc-800 p-5 text-zinc-300">✓ {item}</div>)}</div></div>
        <div><h2 className="text-3xl font-bold">De comentários soltos a temas recorrentes</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Considere cem avaliações de uma empresa. Uma leitura manual pode perceber alguns problemas, mas é fácil perder frequência, variações por período ou a relação entre uma reclamação e outra. Uma análise estruturada procura agrupamentos como atendimento, prazo, preço, qualidade, ambiente, comunicação e produto.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400">O objetivo não é criar uma classificação abstrata. É tornar a evidência mais fácil de consultar para que a equipe possa perguntar qual problema aparece mais, em que contexto aparece e que ação faz sentido investigar.</p></div>
      </section>

      <section className="mt-16 space-y-8">
        <div><h2 className="text-3xl font-bold">Como usar a análise no dia a dia</h2><ol className="mt-4 max-w-3xl space-y-3 leading-8 text-zinc-400"><li><strong className="text-zinc-200">1. Reunir:</strong> concentre avaliações e feedbacks.</li><li><strong className="text-zinc-200">2. Organizar:</strong> agrupe sinais por temas, notas, períodos ou unidades.</li><li><strong className="text-zinc-200">3. Priorizar:</strong> identifique padrões relevantes.</li><li><strong className="text-zinc-200">4. Agir:</strong> transforme achados em ações e responsáveis.</li><li><strong className="text-zinc-200">5. Medir:</strong> volte às avaliações para verificar mudanças.</li></ol></div>
        <div><h2 className="text-3xl font-bold">IA não substitui contexto</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma classificação automática pode errar ironia, contexto ou situações específicas. Por isso, resultados devem ser tratados como apoio à análise, não como verdade isolada. Quanto melhor a qualidade das avaliações e do contexto fornecido, mais útil tende a ser a síntese.</p></div>
        <div><h2 className="text-3xl font-bold">Da análise para a decisão</h2><p className="mt-4 max-w-3xl leading-8 text-zinc-400">Quando os sinais são organizados e priorizados, a empresa consegue decidir onde agir antes que pequenos problemas se transformem em perda de clientes e reputação.</p><p className="mt-4 max-w-3xl leading-8 text-zinc-400"><Link href="/blog/gestao-reputacao-online-guia" className="underline">Leia o guia de gestão de reputação online</Link> e <Link href="/blog/como-responder-avaliacoes-negativas" className="underline">aprenda a responder avaliações negativas</Link>.</p></div>
      </section>

      <section className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8"><h2 className="text-2xl font-bold">Veja o que existe por trás das notas</h2><p className="mt-3 leading-7 text-zinc-300">Comece com uma auditoria gratuita e descubra os temas, riscos e oportunidades presentes nas avaliações que você fornecer.</p><Link href="/auditoria-gratuita" className="mt-6 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Fazer auditoria gratuita</Link></section>
      <nav className="mt-12 flex flex-wrap gap-4 text-sm"><Link href="/feedback-de-clientes" className="underline">Feedback de clientes</Link><Link href="/gestao-de-reputacao-online" className="underline">Gestão de reputação online</Link><Link href="/avaliacoes-google" className="underline">Avaliações Google</Link><Link href="/ia" className="underline">Filtra.AI para IA</Link><Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link><Link href="/blog/gestao-reputacao-online-guia" className="underline">Guia de gestão de reputação</Link><Link href="/blog/como-responder-avaliacoes-negativas" className="underline">Guia de avaliações negativas</Link></nav>
    </main>
  );
}
