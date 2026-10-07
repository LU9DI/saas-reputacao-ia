'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isLocalDev =
      process.env.NODE_ENV !== 'production' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Service workers must not control localhost development. A stale SW can
    // cache old Next chunks and make a healthy dev server appear broken.
    if (isLocalDev && 'serviceWorker' in navigator) {
      // Clean up workers/caches left by an earlier production/dev session.
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      );
      if ('caches' in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* silencioso se SW falhar */
      });
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) setInstalled(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setShow(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !show || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-xl backdrop-blur sm:left-auto">
      <p className="text-sm font-medium text-zinc-100">Instalar Filtra.IA</p>
      <p className="mt-1 text-xs text-zinc-400">
        Adicione à tela inicial e use como app no celular ou PC.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setShow(false);
            setDeferred(null);
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          className="rounded-xl border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          onClick={() => setShow(false)}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
