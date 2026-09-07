'use client';

import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className = '', compact = false }: Props) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {!compact && (
        <span className="text-xs text-zinc-500 hidden sm:inline">{t.language}</span>
      )}
      <select
        aria-label={t.language}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
