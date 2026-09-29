'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { restoreStickyFromSession, apiFetch, getApiBase } from '../utils/apiFailover';

/**
 * Pré-aquece a API do Render nas páginas que realmente precisam dela.
 * As rotas de demonstração locais são deliberadamente offline e não devem
 * tentar acessar 127.0.0.1:5000 nem qualquer backend.
 */
export function ApiWarmup() {
  const pathname = usePathname();

  useEffect(() => {
    const isOfflineDemo =
      pathname === '/preview' ||
      pathname.startsWith('/preview/') ||
      pathname === '/painel/preview';

    // No ambiente local, o warmup não deve gerar ruído nem tentar
    // acordar uma API em 127.0.0.1:5000 só para navegar pelas demos.
    const isLocalHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isOfflineDemo || isLocalHost) return;

    restoreStickyFromSession();

    const base = getApiBase();
    if (typeof document !== 'undefined' && base.startsWith('http')) {
      try {
        const origin = new URL(base).origin;
        const ensureLink = (rel: string) => {
          const sel = `link[rel="${rel}"][href="${origin}"]`;
          if (document.querySelector(sel)) return;
          const link = document.createElement('link');
          link.rel = rel;
          link.href = origin;
          if (rel === 'preconnect') link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        };
        ensureLink('dns-prefetch');
        ensureLink('preconnect');
      } catch {
        /* ignore */
      }
    }

    let cancelled = false;

    const warm = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      apiFetch('/api/health', {
        method: 'GET',
        timeoutMs: 15_000,
        cache: 'no-store',
      }).catch(() => {
        /* cold start ou offline — silencioso */
      });
    };

    warm();
    const t1 = window.setTimeout(warm, 2_500);
    const interval = window.setInterval(warm, 4 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') warm();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);

  return null;
}
