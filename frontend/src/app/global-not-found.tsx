import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { rootViewport } from './lib/rootMetadata';

export const metadata: Metadata = {
  title: 'Página não encontrada | Filtra.AI',
  description: 'A página que você procura não existe ou foi movida.',
  robots: { index: false, follow: true },
};

export const viewport: Viewport = rootViewport;

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center px-6 py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">Erro 404</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Página não encontrada</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
            O endereço acessado não existe ou foi movido. Volte para a página inicial ou explore o conteúdo
            sobre reputação online e avaliações Google.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Ir para a página inicial
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              Ver o blog
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
