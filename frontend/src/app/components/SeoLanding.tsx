import Link from 'next/link';
import { BrandMark } from './BrandMark';

type Section = { heading: string; body: string };

export function SeoLanding({
  h1,
  lead,
  sections,
  ctaHref = '/',
  ctaLabel = 'Começar teste gratuito (7 dias)',
}: {
  h1: string;
  lead: string;
  sections: Section[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Reputação" href="/" />
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          Trial grátis
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">Início</Link>
          <span className="mx-2">/</span>
          <span aria-current="page" className="text-zinc-400">{h1}</span>
        </nav>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">{h1}</h1>
          <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">{lead}</p>
        </div>
        {sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-100">{s.heading}</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{s.body}</p>
          </section>
        ))}
        <div className="pt-4">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 text-sm"
          >
            {ctaLabel}
          </Link>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 pt-6 border-t border-zinc-800">
          <Link href="/feedback-de-clientes" className="hover:text-zinc-300">
            Feedback de clientes
          </Link>
          <Link href="/analise-de-avaliacoes-com-ia" className="hover:text-zinc-300">
            Análise de avaliações com IA
          </Link>
          <Link href="/gestao-de-reputacao-online" className="hover:text-zinc-300">
            Reputação online
          </Link>
          <Link href="/auditoria-gratuita" className="hover:text-zinc-300">
            Auditoria gratuita
          </Link>
          <Link href="/como-funciona" className="hover:text-zinc-300">
            Como funciona
          </Link>
          <Link href="/restaurantes" className="hover:text-zinc-300">
            Restaurantes
          </Link>
          <Link href="/clinicas" className="hover:text-zinc-300">
            Clínicas
          </Link>
          <Link href="/agencias" className="hover:text-zinc-300">
            Agências
          </Link>
          <Link href="/hoteis" className="hover:text-zinc-300">
            Hotéis
          </Link>
          <Link href="/turismo" className="hover:text-zinc-300">
            Turismo
          </Link>
          <Link href="/associacoes" className="hover:text-zinc-300">
            Associações
          </Link>
          <Link href="/franquias" className="hover:text-zinc-300">
            Franquias
          </Link>
          <Link href="/parceiros" className="hover:text-zinc-300">
            Parceiros
          </Link>
          <Link href="/pedir-estrela-vs-filtrar" className="hover:text-zinc-300">
            Pedir vs filtrar
          </Link>
          <Link href="/blog/como-conseguir-avaliacoes-google" className="hover:text-zinc-300">
            Blog
          </Link>
        </nav>
      </main>
    </div>
  );
}
