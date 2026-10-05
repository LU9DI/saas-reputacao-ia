import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageHeader } from '../components/SeoPageHeader';

export const metadata: Metadata = {
  title: 'Programa de parceiros Filtra.AI | Reputação e feedback',
  description:
    'Parcerias para consultorias, agências e entidades que atendem empresas preocupadas com reputação, avaliações e experiência do cliente.',
  alternates: { canonical: 'https://filtraai.com/parceiros' },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/parceiros',
    title: 'Programa de parceiros Filtra.AI | Reputação e feedback',
    description: 'Parcerias para consultorias, agências e entidades que atendem empresas preocupadas com reputação, avaliações e experiência do cliente.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Programa de parceiros Filtra.AI | Reputação e feedback',
    description: 'Parcerias para consultorias, agências e entidades que atendem empresas com foco em reputação e experiência.',
  },
};

export default function ParceirosPage() {
  return (
    <>
      <SeoPageHeader />
      <main className="min-h-screen bg-black text-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-14">
        <header className="space-y-6">
          <p className="text-sm uppercase tracking-widest text-indigo-400">Programa de parceiros</p>
          <h1 className="text-4xl font-bold md:text-6xl">Leve gestão de reputação para mais empresas</h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-400">
            Consultorias, agências, associações e profissionais que ajudam empresas a melhorar atendimento,
            experiência e presença digital podem incorporar o Filtra.AI à sua oferta.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ['Agências e SEO local', 'Acrescente acompanhamento de avaliações e feedback à operação que você já presta aos clientes.'],
            ['Consultorias', 'Use dados de feedback para apoiar diagnósticos, reuniões e projetos de experiência do cliente.'],
            ['Associações e entidades', 'Apresente uma ferramenta prática para empresas e associados que precisam organizar sua reputação.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
            </article>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-bold">Como uma parceria pode funcionar</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['1. Identificar', 'Encontre clientes ou associados que já recebem avaliações e precisam entender melhor os sinais de reputação.'],
              ['2. Apresentar', 'Mostre a auditoria e o fluxo de organização de feedback para que a empresa conheça a solução.'],
              ['3. Acompanhar', 'Use os aprendizados para apoiar a operação e manter uma rotina de acompanhamento da experiência.'],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-zinc-800 p-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-bold">O que o parceiro entrega ao cliente</h2>
          <p className="leading-8 text-zinc-300">
            A parceria pode complementar serviços de marketing, SEO local, atendimento e experiência do cliente.
            O parceiro ajuda a interpretar os sinais e conectar os aprendizados às prioridades do negócio, enquanto
            o Filtra.AI organiza o fluxo de avaliações e feedback.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-bold">Comece com um cliente piloto</h2>
          <p className="leading-8 text-zinc-300">
            Escolha uma empresa da sua carteira, use o período de teste de 7 dias e observe quais temas aparecem
            com mais frequência. O piloto permite validar o processo antes de ampliar para outros clientes.
          </p>
        </section>

        <nav className="flex flex-wrap gap-4 border-t border-zinc-800 pt-8 text-sm">
          <Link href="/agencias" className="underline">Filtra.AI para agências</Link>
          <Link href="/associacoes" className="underline">Filtra.AI para associações</Link>
          <Link href="/gestao-de-reputacao-online" className="underline">Gestão de reputação online</Link>
          <Link href="/auditoria-gratuita" className="underline">Auditoria gratuita</Link>
        </nav>

        <a href="mailto:projetosaas1@gmail.com" className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500">
          Quero falar sobre parceria
        </a>
      </div>
    </main>
    </>
  );
}
