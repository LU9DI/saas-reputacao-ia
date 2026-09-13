'use client';

import { useEffect } from 'react';
import { restoreStickyFromSession, apiFetch, getApiBase } from '../utils/apiFailover';

/**
 * Pré-aquece a API do Render assim que o app carrega.
 * - Restaura sticky base da sessão
 * - Ping em /api/health (acorda cold start em background)
 * - Re-ping a cada 4 min enquanto a aba estiver aberta
 * - dns-prefetch / preconnect no head
 */
export function ApiWarmup() {
  useEffect(() => {
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

    // imediato + um pouco depois (cobre cold start longo)
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
  }, []);

  return null;
}
