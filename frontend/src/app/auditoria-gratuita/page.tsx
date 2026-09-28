import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Auditoria gratuita de reputação online',
  description: 'Veja como a Filtra.AI pode ajudar sua empresa a organizar avaliações, feedback e oportunidades de melhoria. Comece o teste de 7 dias.',
  alternates: { canonical: '/auditoria-gratuita' },
};

export default function AuditoriaGratuitaPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Filtra.AI</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Entenda onde sua reputação pode melhorar</h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-400">Use a Filtra.AI para organizar avaliações e feedback dos clientes, encontrar padrões e transformar sinais de reputação em ações.</p>
          <Link href="/" className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500">Começar teste de 7 dias</Link>
        </header>
        <section className="grid gap-5 md:grid-cols-3">
          {[['Avaliações','Centralize os sinais que seus clientes deixam nos canais públicos e no seu fluxo de feedback.'],['Padrões','Identifique temas recorrentes que merecem atenção antes que virem problemas maiores.'],['Ação','Transforme feedback em uma rotina mais clara para atendimento e melhoria da experiência.']].map(([title,text]) => <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></article>)}
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7 space-y-4">
          <h2 className="text-2xl font-semibold">Para quem é</h2>
          <p className="text-zinc-400 leading-7">Hotéis, restaurantes, clínicas, agências, redes e outras empresas que dependem de confiança, avaliações e experiência do cliente.</p>
          <div className="flex flex-wrap gap-3 text-sm"><Link href="/hoteis" className="underline text-indigo-400">Hotéis</Link><Link href="/restaurantes" className="underline text-indigo-400">Restaurantes</Link><Link href="/clinicas" className="underline text-indigo-400">Clínicas</Link><Link href="/agencias" className="underline text-indigo-400">Agências</Link><Link href="/parceiros" className="underline text-indigo-400">Parceiros</Link></div>
        </section>
      </div>
    </main>
  );
}
