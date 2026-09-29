import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Feedback de clientes: transforme opiniões em crescimento',
  description: 'Entenda o que seus clientes estão dizendo, encontre padrões nas avaliações e transforme feedback em decisões para crescer, reter clientes e proteger sua reputação.',
  alternates: { canonical: '/feedback-de-clientes' },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Filtra.AI · Inteligência de clientes</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Feedback de clientes não é só opinião. É dado de crescimento.</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">Seus clientes já estão mostrando o que funciona, o que afasta compradores e onde sua empresa pode melhorar. A Filtra.AI organiza esse sinal e transforma avaliações e feedback em prioridades práticas.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/auditoria-gratuita" className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white">Faça uma auditoria gratuita</Link>
          <Link href="/planos" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Conheça a Filtra.AI</Link>
        </div>
      </header>
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          ['Encontre padrões', 'Descubra reclamações, elogios e temas recorrentes que ficam escondidos em centenas de avaliações.'],
          ['Priorize problemas', 'Separe sinais importantes do ruído e transforme a voz do cliente em prioridades de ação.'],
          ['Cresça com inteligência', 'Use a experiência do cliente para melhorar reputação, retenção, aquisição e resultado.'],
        ].map(([title, text]) => <article key={title} className="rounded-2xl border border-zinc-800 p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-zinc-400">{text}</p></article>)}
      </section>
      <section className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8">
        <h2 className="text-2xl font-bold">O que seus clientes estão dizendo que você ainda não percebeu?</h2>
        <p className="mt-3 leading-7 text-zinc-300">A Filtra.AI ajuda empresas a transformar avaliações em informação acionável, em vez de deixar milhares de comentários parados em plataformas diferentes.</p>
      </section>
    </main>
  );
}
