'use client';

import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, FileText, Home, LockKeyhole, PlayCircle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage, type Language } from '../Contexts/LanguageContext';

const labels: Record<Language, {
  hub:string; landing:string; trial:string; dashboard:string; privacy:string; login:string; terms:string;
}> = {
  pt: { hub:'Hub de preview', landing:'Landing', trial:'Teste 7 dias', dashboard:'Painel', privacy:'Privacidade', login:'Login', terms:'Termos' },
  en: { hub:'Preview hub', landing:'Landing', trial:'7-day trial', dashboard:'Dashboard', privacy:'Privacy', login:'Login', terms:'Terms' },
  es: { hub:'Hub de preview', landing:'Landing', trial:'Prueba 7 días', dashboard:'Panel', privacy:'Privacidad', login:'Login', terms:'Términos' },
  zh: { hub:'预览中心', landing:'首页', trial:'7 天试用', dashboard:'面板', privacy:'隐私', login:'登录', terms:'条款' },
};

export function PreviewNavigator() {
  const { language } = useLanguage();
  const l = labels[language] || labels.pt;

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#050507]/95 px-4 py-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto text-xs">
        <Link href="/preview" aria-label={l.hub} className="flex shrink-0 items-center gap-1.5 font-semibold text-white hover:text-indigo-300">
          <ArrowLeft size={14} /> {l.hub}
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5" aria-label={l.hub}>
          <LanguageSwitcher variant="flags" compact={false} className="mr-1" />
          <Link href="/preview" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><Home size={13} className="mr-1 inline" />{l.landing}</Link>
          <Link href="/preview/teste" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><PlayCircle size={13} className="mr-1 inline" />{l.trial}</Link>
          <Link href="/painel/preview" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><LayoutDashboard size={13} className="mr-1 inline" />{l.dashboard}</Link>
          <Link href="/privacidade" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><LockKeyhole size={13} className="mr-1 inline" />{l.privacy}</Link>
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">{l.login}</Link>
          <Link href="/termos" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><FileText size={13} className="mr-1 inline" />{l.terms}</Link>
        </nav>
      </div>
    </div>
  );
}
