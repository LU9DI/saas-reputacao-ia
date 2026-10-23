import type { Metadata } from 'next';
import Link from 'next/link';
import { PlanCards } from '../../components/PlanCards';

export const metadata: Metadata = {
  title: { absolute: 'Planos e preços | Filtra.AI' },
  description:
    'Compare os planos da Filtra.AI para analisar avaliações Google com IA, organizar feedback de clientes e acompanhar a reputação online.',
  alternates: {
    canonical: 'https://filtraai.com/planos',
  },
  openGraph: {
    type: 'website',
    url: 'https://filtraai.com/planos',
    siteName: 'Filtra.AI',
    locale: 'pt_BR',
    title: 'Planos e preços | Filtra.AI',
    description:
      'Compare os planos da Filtra.AI para analisar avaliações Google com IA, organizar feedback de clientes e acompanhar a reputação online.',
    images: [
      {
        url: 'https://filtraai.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Planos e preços da Filtra.AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planos e preços | Filtra.AI',
    description:
      'Compare os planos da Filtra.AI para analisar avaliações Google com IA, organizar feedback de clientes e acompanhar a reputação online.',
    images: ['https://filtraai.com/og-image.png'],
  },
};

export default function PlanosPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-semibold tracking-tight text-white">Filtra.AI</Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-5 text-sm text-zinc-300 sm:flex">
            <Link href="/#como-funciona" className="hover:text-white">Como funciona</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <Link href="/#planos" className="hover:text-white">Planos na página inicial</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Planos Filtra.AI</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Escolha o plano certo para transformar avaliações em ação
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
          Compare opções para organizar feedback, analisar avaliações com inteligência artificial e acompanhar oportunidades de melhoria da reputação. Os recursos e limites de cada plano são apresentados abaixo.
        </p>
      </section>
      <section aria-labelledby="pricing-heading" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 id="pricing-heading" className="sr-only">Comparação de planos e preços</h2>
        <PlanCards />
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">Como escolher</h2>
          <p className="mt-3 leading-7 text-zinc-300">
            Considere o volume mensal de feedbacks, a quantidade de unidades e o nível de análise e acompanhamento que sua operação precisa. Planos superiores incluem recursos para equipes e operações com maior complexidade; confira os recursos listados em cada opção antes de contratar.
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Precisa conhecer a plataforma primeiro? <Link className="text-indigo-300 underline underline-offset-4 hover:text-indigo-200" href="/como-funciona">Veja como funciona</Link> ou volte para a <Link className="text-indigo-300 underline underline-offset-4 hover:text-indigo-200" href="/">página inicial</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
