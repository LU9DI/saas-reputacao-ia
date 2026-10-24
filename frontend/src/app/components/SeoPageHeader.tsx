'use client';

import Link from 'next/link';
import { BrandMark } from './BrandMark';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SeoPageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <BrandMark size="sm" subtitle="Reputação" />
        <div className="flex items-center gap-3">
          <nav aria-label="Navegação principal" className="hidden items-center gap-4 text-sm text-zinc-300 lg:flex">
            <Link href="/gestao-de-reputacao-online" className="hover:text-white">
              Gestão de reputação
            </Link>
            <Link href="/avaliacoes-google" className="hover:text-white">
              Avaliações Google
            </Link>
            <Link href="/analise-de-avaliacoes-com-ia" className="hover:text-white">
              Análise com IA
            </Link>
            <Link href="/auditoria-gratuita" className="hover:text-white">
              Auditoria gratuita
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/planos" className="hover:text-white">
              Planos
            </Link>
          </nav>
          <LanguageSwitcher compact variant="flags" />
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
