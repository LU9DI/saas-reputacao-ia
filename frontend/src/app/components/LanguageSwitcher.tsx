'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  { pt:'/hoteis', en:'/en/hotels', es:'/es/hoteles', zh:'/zh/hotels' },
  { pt:'/turismo', en:'/en/tourism', es:'/es/turismo', zh:'/zh/tourism' },
  { pt:'/agencias', en:'/en/agencies', es:'/es/agencias', zh:'/zh/agencies' },
  { pt:'/clinicas', en:'/en/clinics', es:'/es/clinicas', zh:'/zh/clinics' },
  { pt:'/franquias', en:'/en/franchises', es:'/es/franquicias', zh:'/zh/franquicias' },
  { pt:'/associacoes', en:'/en/associations', es:'/es/asociaciones', zh:'/zh/associations' },
  { pt:'/restaurantes', en:'/en/restaurants', es:'/es/restaurantes', zh:'/zh/restaurants' },
  { pt:'/como-funciona', en:'/en/how-it-works', es:'/es/como-funciona', zh:'/zh/how-it-works' },
  { pt:'/parceiros', en:'/en/partners', es:'/es/socios', zh:'/zh/partners' },
  { pt:'/pedir-estrela-vs-filtrar', en:'/en/ask-for-stars-vs-filtering', es:'/es/pedir-estrellas-vs-filtrar', zh:'/zh/request-stars-vs-filter' },
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const clean = pathname.split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

function targetFor(pathname: string, language: Language): string {
  const normalized = normalizePath(pathname);
  const family = SEO_FAMILIES.find((item) =>
    Object.values(item).some((path) => normalizePath(path) === normalized)
  );
  return family?.[language] || normalized;
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
  const router = useRouter();
  const pathLang = (pathname || '/').match(/^\/(en|es|zh)(?:\/|$)/)?.[1] as Language | undefined;
  const current = pathLang || language;

  const choose = (code: Language) => {
    setLanguage(code);
    const target = targetFor(pathname || '/', code);
    if (target !== normalizePath(pathname || '/')) {
      router.push(target);
    }
  };

  if (variant === 'flags') {
    return (
      <nav className={`inline-flex items-center gap-1 ${className}`} aria-label={tx('language', 'Idioma')}>
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => choose(l.code)}
            title={l.label}
            aria-label={l.label}
            aria-current={current === l.code ? 'page' : undefined}
            className={`text-sm px-2 py-1 rounded-lg border ${current === l.code ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
          >
            <span aria-hidden>{l.flag}</span>
            {!compact && <span className="ml-1 hidden sm:inline">{l.code.toUpperCase()}</span>}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <label className={`inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 ${className}`}>
      <span aria-hidden>{SUPPORTED_LANGUAGES.find((l) => l.code === current)?.flag}</span>
      <span className={compact ? 'sr-only' : 'text-sm'}>{tx('language', 'Idioma')}</span>
      <select
        value={current}
        onChange={(e) => choose(e.target.value as Language)}
        aria-label={tx('language', 'Idioma')}
        className="cursor-pointer bg-transparent text-sm text-zinc-100 outline-none"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-zinc-950 text-zinc-100">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
