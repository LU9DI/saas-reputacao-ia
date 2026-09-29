'use client';

import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, FileText, Home, LockKeyhole, PlayCircle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PreviewNavigator() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#050507]/90 px-4 py-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto text-xs">
        <Link href="/preview" className="flex shrink-0 items-center gap-1.5 font-semibold text-white hover:text-indigo-300">
          <ArrowLeft size={14} /> Hub de preview
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher variant="flags" compact className="mr-1" />
          <Link href="/preview" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><Home size={13} className="mr-1 inline" />Landing</Link>
          <Link href="/preview/teste" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><PlayCircle size={13} className="mr-1 inline" />Teste 7 dias</Link>
          <Link href="/painel/preview" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><LayoutDashboard size={13} className="mr-1 inline" />Painel</Link>
          <Link href="/privacidade" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><LockKeyhole size={13} className="mr-1 inline" />Privacidade</Link>
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">Login</Link>
          <Link href="/termos" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><FileText size={13} className="mr-1 inline" />Termos</Link>
        </nav>
      </div>
    </div>
  );
}
