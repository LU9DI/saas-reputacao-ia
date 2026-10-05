'use client';

import { usePathname } from 'next/navigation';
import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

const SEO_FAMILIES: Array<Record<Language, string>> = [
  { pt:'/', en:'/en', es:'/es', zh:'/zh' },
  { pt:'/ia', en:'/en/ai', es:'/es/ia', zh:'/zh/ai' },
  { pt:'/filtra-ai', en:'/en/filtra-ai', es:'/es/filtra-ai', zh:'/zh/filtra-ai' },
  { pt:'/feedback-de-clientes', en:'/en/customer-feedback', es:'/es/feedback-clientes', zh:'/zh/customer-feedback' },
  { pt:'/analise-de-avaliacoes-com-ia', en:'/en/ai-review-analysis', es:'/es/analisis-resenas-ia', zh:'/zh/ai-review-analysis' },
  { pt:'/gestao-de-reputacao-online', en:'/en/online-reputation-management', es:'/es/gestion-reputacion-online', zh:'/zh/online-reputation-management' },
  { pt:'/avaliacoes-google', en:'/en/google-reviews', es:'/es/resenas-google', zh:'/zh/google-reviews' },
  { pt:'/reputacao-google', en:'/en/google-reputation', es:'/es/reputacion-google', zh:'/zh/google-reputation' },
  { pt:'/como-melhorar-avaliacoes-google', en:'/en/improve-google-reviews', es:'/es/mejorar-resenas-google', zh:'/zh/improve-google-reviews' },
  { pt:'/monitoramento-reputacao-online', en:'/en/online-reputation-monitoring', es:'/es/monitoreo-reputacion-online', zh:'/zh/online-reputation-monitoring' },
  { pt:'/gestao-de-feedback', en:'/en/customer-feedback-management', es:'/es/gestion-feedback-clientes', zh:'/zh/customer-feedback-management' },
  { pt:'/auditoria-gratuita', en:'/en/free-review-audit', es:'/es/auditoria-gratuita', zh:'/zh/free-review-audit' },
];

function targetFor(pathname: string, language: Language): string {
  const family = SEO_FAMILIES.find(item => Object.values(item).includes(pathname));
  if (family) return family[language];

  // SEO pages navigate to their localized canonical route; app pages keep the current URL.
  return pathname || '/';
}

export function LanguageSwitcher({
  className = '',
  compact = false,
  variant = 'select',
}: {
  className?: string;
  compact?: boolean;
  variant?: 'select' | 'flags';
}) {
  const { language, setLanguage, tx } = useLanguage();
  const pathname = usePathname();
  const current = (['pt', 'en', 'es', 'zh'] as Language[]).includes(language) ? language : 'pt';

  const choose = (code: Language) => {
    setLanguage(code);
  };

  if (variant === 'flags') {
    return (
      <nav
        className={`inline-flex items-center gap-1 ${className}`}
        aria-label={tx('language', 'Idioma')}
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <a
            key={l.code}
            href={targetFor(pathname || '/', l.code)}
            onClick={() => choose(l.code)}
            title={l.label}
            aria-label={l.label}
            aria-current={current === l.code ? 'page' : undefined}
            className={`text-sm px-2 py-1 rounded-lg border ${current === l.code ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
          >
            <span aria-hidden>{l.flag}</span>
            {!compact && <span className="ml-1 hidden sm:inline">{l.code.toUpperCase()}</span>}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <details className={`relative inline-block ${className}`}>
      <summary
        aria-label={tx('language', 'Idioma')}
        className="list-none cursor-pointer select-none rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100"
      >
        <span aria-hidden>{SUPPORTED_LANGUAGES.find((l) => l.code === current)?.flag}</span>
        {!compact && <span className="ml-1">{SUPPORTED_LANGUAGES.find((l) => l.code === current)?.label}</span>}
        <span aria-hidden className="ml-1 text-zinc-500">⌄</span>
      </summary>
      <nav
        aria-label={tx('language', 'Idioma')}
        className="absolute right-0 top-full z-[60] mt-2 min-w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <a
            key={l.code}
            href={targetFor(pathname || '/', l.code)}
            onClick={() => choose(l.code)}
            aria-current={current === l.code ? 'page' : undefined}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            <span aria-hidden>{l.flag}</span>
            <span>{l.label}</span>
            {current === l.code && <span className="ml-auto text-indigo-400">✓</span>}
          </a>
        ))}
      </nav>
    </details>
  );
}
