'use client';

import Link from 'next/link';
import { useLanguage, type Language } from '../Contexts/LanguageContext';

const labels: Record<Language, { login: string }> = {
  pt: { login: 'Login' },
  en: { login: 'Login' },
  es: { login: 'Login' },
  zh: { login: '登录' },
};

export function PreviewNavigator() {
  const { language } = useLanguage();
  const l = labels[language] || labels.pt;

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#050507]/95 px-4 py-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-end text-xs">
        <nav aria-label={l.login}>
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            {l.login}
          </Link>
        </nav>
      </div>
    </div>
  );
}
