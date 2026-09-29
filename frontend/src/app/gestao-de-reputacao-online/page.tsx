import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gestão de reputação online: transforme avaliações em crescimento',
  description: 'Gestão de reputação online com inteligência de clientes. Monitore avaliações, encontre padrões e transforme a voz do consumidor em ações de crescimento.',
  alternates: { canonical: '/gestao-de-reputacao-online' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Reputação online</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">Sua reputação online é uma fonte de crescimento.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">Cada avaliação pública influencia a percepção de futuros clientes e também revela informações sobre a experiência de quem já comprou. A Filtra.AI transforma esse fluxo de avaliações em inteligência para gestão.</p>
      <Link href="/auditoria-gratuita" className="mt-8 inline-block rounded-xl bg-indigo-500 px-5 py-3 font-semibold">Teste a Filtra.AI</Link>
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Reputação</h2><p className="mt-3 text-zinc-400">Entenda os temas que estão moldando a percepção da sua empresa.</p></article>
        <article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Experiência</h2><p className="mt-3 text-zinc-400">Identifique pontos de atrito e oportunidades recorrentes.</p></article>
        <article className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">Crescimento</h2><p className="mt-3 text-zinc-400">Converta a voz do consumidor em prioridades para melhorar o negócio.</p></article>
      </section>
    </main>
  );
}
