'use client';

import { usePathname } from 'next/navigation';
import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

/** Pares de rotas SEO PT ↔ EN/ES/ZH. */
export const SEO_FAMILIES: Array<Record<Language, string>> = [
  { pt: '/ia', en: '/en/ai', es: '/es/ia', zh: '/zh/ai' },
  { pt: '/filtra-ai', en: '/en/filtra-ai', es: '/es/filtra-ai', zh: '/zh/filtra-ai' },
  { pt: '/feedback-de-clientes', en: '/en/customer-feedback', es: '/es/feedback-clientes', zh: '/zh/customer-feedback' },
  { pt: '/analise-de-avaliacoes-com-ia', en: '/en/ai-review-analysis', es: '/es/analisis-resenas-ia', zh: '/zh/ai-review-analysis' },
  { pt: '/gestao-de-reputacao-online', en: '/en/online-reputation-management', es: '/es/gestion-reputacion-online', zh: '/zh/online-reputation-management' },
  { pt: '/avaliacoes-google', en: '/en/google-reviews', es: '/es/resenas-google', zh: '/zh/google-reviews' },
  { pt: '/reputacao-google', en: '/en/google-reputation', es: '/es/reputacion-google', zh: '/zh/google-reputation' },
  { pt: '/como-melhorar-avaliacoes-google', en: '/en/improve-google-reviews', es: '/es/mejorar-resenas-google', zh: '/zh/improve-google-reviews' },
  { pt: '/monitoramento-reputacao-online', en: '/en/online-reputation-monitoring', es: '/es/monitoreo-reputacion-online', zh: '/zh/online-reputation-monitoring' },
  { pt: '/gestao-de-feedback', en: '/en/customer-feedback-management', es: '/es/gestion-feedback-clientes', zh: '/zh/customer-feedback-management' },
  { pt: '/auditoria-gratuita', en: '/en/free-review-audit', es: '/es/auditoria-gratuita', zh: '/zh/free-review-audit' },
  { pt: '/hoteis', en: '/en/hotels', es: '/es/hoteles', zh: '/zh/hotels' },
  { pt: '/turismo', en: '/en/tourism', es: '/es/turismo', zh: '/zh/tourism' },
  { pt: '/agencias', en: '/en/agencies', es: '/es/agencias', zh: '/zh/agencies' },
  { pt: '/clinicas', en: '/en/clinics', es: '/es/clinicas', zh: '/zh/clinics' },
  { pt: '/franquias', en: '/en/franchises', es: '/es/franquicias', zh: '/zh/franchises' },
  { pt: '/associacoes', en: '/en/associations', es: '/es/asociaciones', zh: '/zh/associations' },
  { pt: '/restaurantes', en: '/en/restaurants', es: '/es/restaurantes', zh: '/zh/restaurants' },
  { pt: '/como-funciona', en: '/en/how-it-works', es: '/es/como-funciona', zh: '/zh/how-it-works' },
  { pt: '/parceiros', en: '/en/partners', es: '/es/socios', zh: '/zh/partners' },
  { pt: '/pedir-estrela-vs-filtrar', en: '/en/ask-for-stars-vs-filtering', es: '/es/pedir-estrellas-vs-filtrar', zh: '/zh/request-stars-vs-filter' },
  { pt: '/blog/como-conseguir-avaliacoes-google', en: '/en/blog/get-google-reviews', es: '/es/blog/conseguir-resenas-google', zh: '/zh/blog/google-reviews-guide' },
  { pt: '/blog/gestao-reputacao-online-guia', en: '/en/blog/online-reputation-management-guide', es: '/es/blog/guia-gestion-reputacion-online', zh: '/zh/blog/online-reputation-management-guide' },
  { pt: '/blog/feedback-cliente-para-reputacao', en: '/en/blog/customer-feedback-reputation', es: '/es/blog/feedback-clientes-reputacion', zh: '/zh/blog/customer-feedback-reputation' },
  { pt: '/blog/seo-local-avaliacoes-local-pack', en: '/en/blog/local-seo-google-reviews', es: '/es/blog/seo-local-resenas-google', zh: '/zh/blog/local-seo-google-reviews' },
  { pt: '/blog/agencia-vender-gestao-reputacao', en: '/en/blog/agency-reputation-management', es: '/es/blog/agencia-gestion-reputacion', zh: '/zh/blog/agency-reputation-management' },
  { pt: '/blog', en: '/en/blog', es: '/es/blog', zh: '/zh/blog' },
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const clean = pathname.split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
}

export function targetFor(pathname: string, language: Language): string {
  const normalized = normalizePath(pathname);
  const family = SEO_FAMILIES.find((item) =>
    Object.values(item).some((path) => normalizePath(path) === normalized),
  );
  if (family?.[language]) return family[language];

  const prefixed = normalized.match(/^\/(en|es|zh)(\/.*)?$/);
  if (prefixed) {
    const rest = prefixed[2] || '';
    if (language === 'pt') return rest || '/';
    return `/${language}${rest}`;
  }

  return normalized;
}

function isSeoArticlePath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return SEO_FAMILIES.some((item) =>
    Object.values(item).some((path) => normalizePath(path) === normalized),
  );
}

export function LanguageSwitcher({
  className = '',
  compact = false,
  variant = 'flags',
}: {
  className?: string;
  compact?: boolean;
  variant?: 'select' | 'flags';
}) {
  const { language, setLanguage, tx } = useLanguage();
  const pathname = usePathname() || '/';
  const pathLang = pathname.match(/^\/(en|es|zh)(?:\/|$)/)?.[1] as Language | undefined;
  const current = pathLang || language;
  const seoArticle = isSeoArticlePath(pathname);

  const goToLanguage = (next: Language) => {
    if (next === current && next === language) return;
    setLanguage(next);

    // Artigos SEO: navega para a URL no idioma escolhido
    if (seoArticle) {
      const href = targetFor(pathname, next);
      if (normalizePath(href) !== normalizePath(pathname)) {
        window.location.assign(href);
      }
      return;
    }

    // Home, login, painel, etc.: só muda o idioma da UI (sem mudar de página)
    // O context atualiza os textos; não força reload.
  };

  const btnClass = (active: boolean) =>
    `inline-flex items-center justify-center text-sm px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
      active
        ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50'
        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
    }`;

  if (compact) {
    return (
      <nav
        className={`inline-flex shrink-0 items-center gap-1 ${className}`}
        aria-label={tx('language', 'Idioma')}
        data-lang-switcher="compact"
      >
        {SUPPORTED_LANGUAGES.map((item) => {
          const active = current === item.code;
          const href = seoArticle ? targetFor(pathname, item.code) : undefined;

          if (seoArticle && href) {
            return (
              <a
                key={item.code}
                href={href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold transition ${active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}
              >
                {item.code.toUpperCase()}
              </a>
            );
          }

          return (
            <button
              key={item.code}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => goToLanguage(item.code)}
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold transition ${active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}
            >
              {item.code.toUpperCase()}
            </button>
          );
        })}
      </nav>
    );
  }

  if (variant === 'select') {
    return (
      <div className={`inline-flex shrink-0 items-center ${className}`} data-lang-switcher="select-v5">
        <label className="sr-only" htmlFor="filtra-language-select">
          {tx('language', 'Idioma')}
        </label>
        <select
          id="filtra-language-select"
          aria-label={tx('language', 'Idioma')}
          value={current}
          onChange={(e) => goToLanguage(e.target.value as Language)}
          className="h-9 min-w-[132px] cursor-pointer rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm font-medium text-zinc-100 outline-none transition hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        >
          {SUPPORTED_LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'flags' || seoArticle) {
    return (
      <nav
        className={`inline-flex shrink-0 items-center gap-1 relative z-20 pointer-events-auto ${className}`}
        aria-label={tx('language', 'Idioma')}
        data-lang-switcher="v4"
      >
        {SUPPORTED_LANGUAGES.map((item) => {
          const active = current === item.code;
          const href = seoArticle ? targetFor(pathname, item.code) : undefined;

          if (seoArticle && href) {
            return (
              <a
                key={item.code}
                href={href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goToLanguage(item.code);
                }}
                className={`inline-flex items-center justify-center rounded-lg border px-2 py-1 text-xs transition ${active ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'}`}
              >
                <span aria-hidden>{item.flag}</span>
                {!compact && (
                  <span className="ml-1 hidden sm:inline">{item.code.toUpperCase()}</span>
                )}
              </a>
            );
          }

          return (
            <button
              key={item.code}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => goToLanguage(item.code)}
              className={btnClass(active)}
            >
              <span aria-hidden>{item.flag}</span>
              {!compact && (
                <span className="ml-1 hidden sm:inline">{item.code.toUpperCase()}</span>
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return null;
}

// Cloudflare static deployment validation: 2026-10-06
