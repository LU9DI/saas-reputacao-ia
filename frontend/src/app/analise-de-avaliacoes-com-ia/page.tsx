import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Análise de avaliações com IA para empresas',
  description: 'Analise avaliações de clientes com IA, identifique padrões, riscos de reputação e oportunidades de melhoria para transformar a voz do consumidor em crescimento.',
  alternates: { canonical: '/analise-de-avaliacoes-com-ia' },
};

export default function Page() {
  const items = ['reclamações recorrentes', 'elogios que revelam diferenciais', 'problemas operacionais', 'riscos de reputação', 'oportunidades de melhoria', 'temas que impactam a experiência do cliente'];
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Análise de avaliações com IA</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">Transforme centenas de avaliações em decisões de crescimento.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">A análise manual de reviews consome tempo e deixa padrões importantes passarem. A Filtra.AI usa inteligência artificial para organizar a voz do consumidor e mostrar o que merece atenção.</p>
      <Link href="/auditoria-gratuita" className="mt-8 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Começar gratuitamente</Link>

      <section className="mt-16 space-y-10">
        <div>
          <h2 className="text-3xl font-bold">Como a análise de avaliações ajuda a gestão</h2>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Uma lista de reviews mostra comentários individuais. Uma análise estruturada permite enxergar recorrência, contexto e prioridade. Isso facilita identificar problemas que merecem investigação e pontos fortes que devem ser preservados.</p>
        </div>
        <div>
          <h2 className="text-3xl font-bold">O que a IA pode revelar nas suas avaliações?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {items.map(item => <div key={item} className="rounded-xl border border-zinc-800 p-5 text-zinc-300">✓ {item}</div>)}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold">Da análise para a decisão</h2>
        <p className="mt-4 max-w-3xl leading-8 text-zinc-400">Avaliações são uma fonte pública de inteligência sobre a experiência real dos clientes. Quando esses sinais são organizados e priorizados, a empresa consegue decidir onde agir antes que pequenos problemas se transformem em perda de clientes e reputação.</p>
      </section>

      <nav className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/feedback-de-clientes" className="underline">Feedback de clientes</Link>
        <Link href="/gestao-de-reputacao-online" className="underline">Gestão de reputação online</Link>
        <Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link>
      </nav>
    </main>
  );
}
