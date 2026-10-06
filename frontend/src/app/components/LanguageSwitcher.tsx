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
  { pt:'/hoteis', en:'/en/hotels', es:'/es/hoteles', zh:'/zh/hotels' },
  { pt:'/turismo', en:'/en/tourism', es:'/es/turismo', zh:'/zh/tourism' },
  { pt:'/agencias', en:'/en/agencies', es:'/es/agencias', zh:'/zh/agencias' },
  { pt:'/clinicas', en:'/en/clinics', es:'/es/clinicas', zh:'/zh/clinics' },
  { pt:'/franquias', en:'/en/franchises', es:'/es/franquicias', zh:'/zh/franchises' },
  { pt:'/associacoes', en:'/en/associations', es:'/es/asociaciones', zh:'/zh/associations' },
  { pt:'/restaurantes', en:'/en/restaurants', es:'/es/restaurantes', zh:'/zh/restaurants' },
  { pt:'/como-funciona', en:'/en/how-it-works', es:'/es/como-funciona', zh:'/zh/how-it-works' },
  { pt:'/parceiros', en:'/en/partners', es:'/es/socios', zh:'/zh/partners' },
  { pt:'/pedir-estrela-vs-filtrar', en:'/en/ask-for-stars-vs-filtering', es:'/es/pedir-estrellas-vs-filtrar', zh:'/zh/request-stars-vs-filter' },
  { pt:'/blog/como-conseguir-avaliacoes-google', en:'/en/blog/get-google-reviews', es:'/es/blog/conseguir-resenas-google', zh:'/zh/blog/google-reviews-guide' },
  { pt:'/blog/gestao-reputacao-online-guia', en:'/en/blog/online-reputation-management-guide', es:'/es/blog/guia-gestion-reputacion-online', zh:'/zh/blog/online-reputation-management-guide' },
  { pt:'/blog/feedback-cliente-para-reputacao', en:'/en/blog/customer-feedback-reputation', es:'/es/blog/feedback-clientes-reputacion', zh:'/zh/blog/customer-feedback-reputation' },
  { pt:'/blog/seo-local-avaliacoes-local-pack', en:'/en/blog/local-seo-google-reviews', es:'/es/blog/seo-local-resenas-google', zh:'/zh/blog/local-seo-google-reviews' },
  { pt:'/blog/agencia-vender-gestao-reputacao', en:'/en/blog/agency-reputation-management', es:'/es/blog/agencia-gestion-reputacion', zh:'/zh/blog/agency-reputation-management' },
  { pt:'/blog', en:'/en/blog', es:'/es/blog', zh:'/zh/blog' },
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
  const { language, tx } = useLanguage();
  const pathname = usePathname();
  const pathLang = (pathname || '/').match(/^\/(en|es|zh)(?:\/|$)/)?.[1] as Language | undefined;
  const current = pathLang || language;
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((item) => item.code === current) || SUPPORTED_LANGUAGES[0];

  /*
   * IMPORTANT:
   * Route changes are real document navigations through <a href>.
   * We deliberately do not use setLanguage(), router.push(), or
   * window.location inside the route-changing control. This makes the
   * language switcher independent from React state/rerenders and from
   * Next.js client navigation interception.
   */
  const links = SUPPORTED_LANGUAGES.map((item) => ({
    ...item,
    href: targetFor(pathname || '/', item.code),
  }));

  if (variant === 'flags') {
    return (
      <nav className={`inline-flex items-center gap-1 ${className}`} aria-label={tx('language', 'Idioma')}>
        {links.map((item) => (
          <a
            key={item.code}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={current === item.code ? 'page' : undefined}
            className={`text-sm px-2 py-1 rounded-lg border ${current === item.code ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
          >
            <span aria-hidden>{item.flag}</span>
            {!compact && <span className="ml-1 hidden sm:inline">{item.code.toUpperCase()}</span>}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <details className={`relative inline-block ${className}`}>
      <summary
        aria-label={tx('language', 'Idioma')}
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden>{currentLanguage.flag}</span>
        <span className={compact ? 'sr-only' : 'text-sm'}>{tx('language', 'Idioma')}</span>
        <span aria-hidden className="text-xs text-zinc-400">▾</span>
      </summary>
      <nav
        aria-label={tx('language', 'Idioma')}
        className="absolute right-0 top-full z-[60] mt-2 min-w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-2xl"
      >
        {links.map((item) => (
          <a
            key={item.code}
            href={item.href}
            aria-current={current === item.code ? 'page' : undefined}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${current === item.code ? 'bg-indigo-500/20 text-white' : 'text-zinc-300 hover:bg-white/10 hover:text-white'}`}
          >
            <span aria-hidden>{item.flag}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </details>
  );
}
