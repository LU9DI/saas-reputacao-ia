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
        <div role="dialog" aria-live="polite" aria-label="Cookies de medição" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 shadow-xl">
          <p className="text-sm font-semibold">Cookies de medição</p>
          <p className="mt-1 text-xs leading-5">O Índice Filtra.AI pode usar o Google Analytics para medir o uso das páginas. A medição só começa se você aceitar. Consulte nossa <a href="https://filtraai.com/privacidade" className="underline">Política de Privacidade</a>.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => decide('denied')} className="rounded-lg border px-4 py-2 text-xs font-semibold">Recusar</button>
            <button type="button" onClick={() => decide('granted')} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white">Aceitar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 right-3 z-40 rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-700 shadow" aria-label="Configurar cookies">Cookies</button>
      )}
    </>
  );
}
