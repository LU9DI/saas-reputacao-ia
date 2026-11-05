'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const ID = 'G-DCY9RH8NPJ';
const KEY = 'filtra_indice_consent_v1';
type Consent = 'granted' | 'denied' | null;

declare global {
  interface Window { dataLayer?: IArguments[]; gtag?: (...args: unknown[]) => void; }
}

function initGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) window.gtag = function gtag() { window.dataLayer!.push(arguments); };
}

export function AnalyticsConsent() {
  const pathname = usePathname() || '/';
  const [consent, setConsent] = useState<Consent>(null);
  const [open, setOpen] = useState(false);
  const initialized = useRef(false);
  const lastConsent = useRef<Consent>(null);
  const lastPath = useRef('');

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === 'granted' || saved === 'denied') setConsent(saved);
    else setOpen(true);
  }, []);

  useEffect(() => {
    if (consent === null) return;
    localStorage.setItem(KEY, consent);
    if (consent === 'denied') {
      if (initialized.current && window.gtag) window.gtag('consent', 'update', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      lastConsent.current = 'denied';
      lastPath.current = '';
      return;
    }
    initGtag();
    if (!initialized.current) {
      window.gtag!('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      window.gtag!('js', new Date());
      window.gtag!('config', ID, { send_page_view: false });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
      script.dataset.filtraIndiceGa4 = 'true';
      document.head.appendChild(script);
      initialized.current = true;
    }
    if (lastConsent.current !== 'granted') {
      window.gtag!('consent', 'update', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      lastConsent.current = 'granted';
    }
    const routePath = pathname.split('?')[0].split('#')[0] || '/';
    const path = routePath === '/indice' || routePath.startsWith('/indice/')
      ? routePath
      : `/indice${routePath === '/' ? '' : routePath}`;
    if (lastPath.current !== path) {
      window.gtag!('event', 'page_view', {
        page_location: 'https://filtraai.com' + path,
        page_path: path,
        page_title: document.title,
      });
      lastPath.current = path;
    }
  }, [consent, pathname]);

  const decide = (value: Exclude<Consent, null>) => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <>
      {open ? (
        <section
          role="dialog"
          aria-live="polite"
          aria-label="Preferências de cookies"
          aria-describedby="indice-cookie-description"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white/95 p-4 text-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">Sua privacidade, suas escolhas</p>
              <p id="indice-cookie-description" className="mt-1 max-w-xl text-xs leading-5 text-zinc-600 sm:text-[13px]">
                O Google Analytics ajuda a entender o uso do Índice. Ele só será ativado se você aceitar.
                Saiba mais na <a href="https://filtraai.com/privacidade" className="font-medium text-zinc-800 underline underline-offset-2 hover:text-black">Política de Privacidade</a>.
              </p>
            </div>
            <div className="flex shrink-0 flex-row-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => decide('granted')}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
              >
                Aceitar
              </button>
              <button
                type="button"
                onClick={() => decide('denied')}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
              >
                Recusar
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-3 right-3 z-40 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 text-xs font-medium text-zinc-600 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          aria-label="Configurar cookies"
        >
          Preferências de cookies
        </button>
      )}
    </>
  );
}
