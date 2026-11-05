'use client';

/**
 * Banner de consentimento de medição.
 *
 * Só aparece quando existe Measurement ID configurado — sem GA4 não há cookie
 * de analytics para consentir. A decisão fica em `localStorage`
 * (`filtra_consent_v1`); enquanto não houver decisão, nenhuma tag é carregada.
 * Pode ser reaberto pela Política de Privacidade (`openConsentPreferences`).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../Contexts/LanguageContext';
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_OPEN_EVENT,
  isAnalyticsConfigured,
  readConsent,
  writeConsent,
} from '../lib/analytics';

const COPY = {
  pt: {
    title: 'Cookies de medição',
    text: 'O Google Analytics 4 usa cookies e identificadores do navegador para medir visitas e interações de forma estatística. Não usamos esses dados para anúncios personalizados. Você escolhe.',
    accept: 'Aceitar',
    deny: 'Recusar',
    more: 'Política de Privacidade',
  },
  en: {
    title: 'Measurement cookies',
    text: 'Google Analytics 4 uses cookies and browser identifiers to measure visits and interactions statistically. We do not use these data for personalized ads. It is your choice.',
    accept: 'Accept',
    deny: 'Decline',
    more: 'Privacy Policy',
  },
  es: {
    title: 'Cookies de medición',
    text: 'Google Analytics 4 utiliza cookies e identificadores del navegador para medir visitas e interacciones con fines estadísticos. No usamos estos datos para anuncios personalizados. Tú decides.',
    accept: 'Aceptar',
    deny: 'Rechazar',
    more: 'Política de Privacidad',
  },
  zh: {
    title: '分析 Cookie',
    text: 'Google Analytics 4 使用 Cookie 和浏览器标识符进行访问与交互统计。我们不会将这些数据用于个性化广告。由您决定。',
    accept: '接受',
    deny: '拒绝',
    more: '隐私政策',
  },
} as const;

export function CookieConsent() {
  const { language } = useLanguage();
  const copy = COPY[language] ?? COPY.pt;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê a decisão salva em localStorage só depois do mount (evita mismatch de hidratação em export estático)
    if (readConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  // Outra aba decidiu: mantém o banner coerente sem recarregar.
  useEffect(() => {
    const onChange = () => setOpen(false);
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

  if (!open) return null;

  const decide = (decision: 'granted' | 'denied') => {
    writeConsent(decision);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={copy.title}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-white/15 bg-zinc-950/95 p-4 text-zinc-200 shadow-2xl backdrop-blur sm:inset-x-6 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{copy.title}</p>
          <p className="text-xs leading-5 text-zinc-400">
            {copy.text}{' '}
            <Link href="/privacidade" className="text-indigo-300 underline">
              {copy.more}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide('denied')}
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
          >
            {copy.deny}
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
