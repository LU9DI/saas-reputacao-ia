'use client';

/**
 * Runtime de analytics do Filtra.AI.
 *
 * Desenho (ver `docs/ANALYTICS_GA4.md`):
 * - a tag `gtag.js` só é carregada depois de consentimento explícito;
 * - o carregamento é idempotente (flag global + promise única), então não há
 *   tag duplicada mesmo com navegação SPA ou remontagem de componente;
 * - `page_view` é enviado manualmente (`send_page_view: false`), uma vez por
 *   rota, para não duplicar o page_view automático do GA4;
 * - todo evento passa por `sanitizeEventParams`, que descarta dado pessoal.
 */

import {
  GA4_EVENTS,
  canonicalPageLocation,
  createGtagShim,
  dedupeKey,
  isEventAllowedOnPath,
  isPageViewPath,
  isTrackableHost,
  normalizePath,
  resolveMeasurementId,
  sanitizeEventParams,
} from './analyticsPolicy';

export const CONSENT_STORAGE_KEY = 'filtra_consent_v1';
export const CONSENT_OPEN_EVENT = 'filtra:consent-open';
export const CONSENT_CHANGE_EVENT = 'filtra:consent-change';

export type ConsentDecision = 'granted' | 'denied';

type GtagFn = (...args: any[]) => void;

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[][];
  gtag?: GtagFn;
  __filtraGaLoaded?: boolean;
  __filtraGaLoading?: Promise<boolean>;
}

/**
 * ID efetivo: `NEXT_PUBLIC_GA_MEASUREMENT_ID` quando presente e válido, senão o
 * Measurement ID real da propriedade (ver `docs/ANALYTICS_GA4.md`).
 */
const MEASUREMENT_ID = resolveMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

const sentEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;
const sentPageViews = new Map<string, number>();

export function getMeasurementId(): string | null {
  return MEASUREMENT_ID;
}

/** Sem Measurement ID válido a instrumentação fica inerte (nada é enviado). */
export function isAnalyticsConfigured(): boolean {
  return Boolean(MEASUREMENT_ID);
}

function win(): AnalyticsWindow | null {
  if (typeof window === 'undefined') return null;
  return window as AnalyticsWindow;
}

function debugEnabled(): boolean {
  const w = win();
  if (!w) return false;
  try {
    return w.localStorage.getItem('filtra_ga_debug') === '1';
  } catch {
    return false;
  }
}

/** Só operamos no domínio canônico (ou em debug explicitamente ligado). */
export function isEnvironmentTrackable(): boolean {
  const w = win();
  if (!w) return false;
  return isTrackableHost(w.location.host, debugEnabled());
}

export function readConsent(): ConsentDecision | null {
  const w = win();
  if (!w) return null;
  try {
    const value = w.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(decision: ConsentDecision): void {
  const w = win();
  if (!w) return;
  try {
    w.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    /* storage bloqueado: segue sem medir */
  }
  w.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: decision }));
  if (decision === 'denied') revokeAnalytics();
}

/** Abre o banner de preferências (usado na Política de Privacidade). */
export function openConsentPreferences(): void {
  const w = win();
  if (!w) return;
  w.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}

function currentPath(): string {
  const w = win();
  if (!w) return '/';
  return normalizePath(w.location.pathname);
}

/**
 * Carrega `gtag.js` uma única vez. Consent Mode v2 fica com
 * `analytics_storage: granted` porque o carregamento já é pós-consentimento;
 * `ad_*` permanece negado — não fazemos publicidade.
 */
export function loadAnalytics(): Promise<boolean> {
  const w = win();
  if (!w || !MEASUREMENT_ID) return Promise.resolve(false);
  if (w.__filtraGaLoaded) return Promise.resolve(true);
  if (w.__filtraGaLoading) return w.__filtraGaLoading;

  w.__filtraGaLoading = new Promise<boolean>((resolve) => {
    w.dataLayer = w.dataLayer || [];
    if (!w.gtag) {
      // O shim precisa empurrar `arguments` (array-like), não Array: ver
      // createGtagShim em analyticsPolicy.ts.
      w.gtag = createGtagShim(w.dataLayer) as GtagFn;
    }
    w.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    w.gtag('consent', 'update', { analytics_storage: 'granted' });
    w.gtag('js', new Date());
    const debug = debugEnabled();
    w.gtag('config', MEASUREMENT_ID, {
      // page_view é enviado manualmente para não duplicar em rotas SPA.
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_flags: 'SameSite=Lax;Secure',
      // Sessões de validação ficam marcadas e não entram nos relatórios.
      ...(debug ? { debug_mode: true } : {}),
    });

    const script = w.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    script.dataset.filtraGtag = MEASUREMENT_ID;
    script.onload = () => {
      w.__filtraGaLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      w.__filtraGaLoading = undefined;
      resolve(false);
    };
    w.document.head.appendChild(script);
  });

  return w.__filtraGaLoading;
}

function canSend(): boolean {
  return isAnalyticsConfigured() && isEnvironmentTrackable() && readConsent() === 'granted';
}

/** `page_view` manual, com dedupe por rota (janela curta: cobre StrictMode/remontagem). */
export function trackPageView(path?: string): void {
  const w = win();
  if (!w || !canSend()) return;
  const route = normalizePath(path || currentPath());
  if (!isPageViewPath(route)) return;
  const location = canonicalPageLocation(w.location.origin, route);
  const now = Date.now();
  const last = sentPageViews.get(location);
  if (last && now - last < DEDUPE_WINDOW_MS) return;
  sentPageViews.set(location, now);
  void loadAnalytics().then((ready) => {
    if (!ready) {
      sentPageViews.delete(location);
      return;
    }
    w.gtag?.('event', 'page_view', { page_location: location, page_path: route });
  });
}

/**
 * Envia um evento do catálogo. Silencioso por desenho: analytics nunca pode
 * quebrar a interface.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  const w = win();
  if (!w || !canSend()) return;
  if (!(name in GA4_EVENTS)) return;
  const route = currentPath();
  if (!isEventAllowedOnPath(name, route)) return;

  const clean = sanitizeEventParams(name, params);
  const key = dedupeKey(name, clean, route);
  const now = Date.now();
  const last = sentEvents.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return;
  sentEvents.set(key, now);

  void loadAnalytics().then((ready) => {
    if (!ready) {
      sentEvents.delete(key);
      return;
    }
    w.gtag?.('event', name, clean);
  });
}

/** Revoga a medição: remove cookies `_ga*` do domínio e desliga a tag. */
function revokeAnalytics(): void {
  const w = win();
  if (!w) return;
  const hosts = [w.location.hostname, `.${w.location.hostname}`];
  const names = w.document.cookie
    .split(';')
    .map((part) => part.split('=')[0].trim())
    .filter((name) => name.startsWith('_ga') || name.startsWith('_gid'));
  for (const name of names) {
    for (const domain of hosts) {
      w.document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
    w.document.cookie = `${name}=; Max-Age=0; path=/`;
  }
  sentPageViews.clear();
  sentEvents.clear();
  try {
    w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  } catch {
    /* tag pode já ter sido removida */
  }
}

export { CONVERSION_EVENTS, GA4_EVENTS } from './analyticsPolicy';
