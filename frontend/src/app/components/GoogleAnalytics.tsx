'use client';

/**
 * Ponte React → GA4. Monta uma única vez no layout raiz:
 * - carrega a tag só depois do consentimento;
 * - registra `page_view` em cada mudança de rota do App Router (SPA);
 * - captura `contact` e `cta_click` por delegação de eventos, sem alterar
 *   cada link individualmente.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  CONSENT_CHANGE_EVENT,
  isAnalyticsConfigured,
  isEnvironmentTrackable,
  loadAnalytics,
  readConsent,
  trackEvent,
  trackPageView,
} from '../lib/analytics';
import { contactChannelFromHref, isPageViewPath } from '../lib/analyticsPolicy';

export function GoogleAnalytics() {
  const pathname = usePathname();

  // Mudança de rota (inclui a primeira carga): um page_view por rota pública.
  useEffect(() => {
    if (!pathname) return;
    if (readConsent() !== 'granted') return;
    if (!isPageViewPath(pathname)) return;
    void loadAnalytics();
    trackPageView(pathname);
  }, [pathname]);

  // Consentimento concedido depois do carregamento: mede a rota atual uma vez.
  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    const onConsent = () => {
      if (readConsent() !== 'granted') return;
      void loadAnalytics();
      if (pathname) trackPageView(pathname);
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent);
  }, [pathname]);

  // Delegação: `contact` para links de contato e `cta_click` para [data-ga-cta].
  useEffect(() => {
    if (!isAnalyticsConfigured() || !isEnvironmentTrackable()) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href], [data-ga-cta]') as HTMLElement | null;
      if (!anchor) return;
      const cta = anchor.getAttribute('data-ga-cta');
      if (cta) {
        trackEvent('cta_click', {
          cta,
          placement: anchor.getAttribute('data-ga-placement') || undefined,
        });
      }
      const href = anchor.getAttribute('href');
      const channel = contactChannelFromHref(href);
      if (channel) trackEvent('contact', { channel });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
