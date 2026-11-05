'use client';

/**
 * Botão "Preferências de cookies": reabre o banner para permitir revogar o
 * consentimento a qualquer momento (LGPD/GDPR). Vive na Política de Privacidade.
 */

import { openConsentPreferences } from '../lib/analytics';
import { useLanguage } from '../Contexts/LanguageContext';

const LABEL = {
  pt: 'Preferências de cookies',
  en: 'Cookie preferences',
  es: 'Preferencias de cookies',
  zh: 'Cookie 偏好设置',
} as const;

export function CookiePreferencesButton() {
  const { language } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => openConsentPreferences()}
      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5"
    >
      {LABEL[language] ?? LABEL.pt}
    </button>
  );
}
