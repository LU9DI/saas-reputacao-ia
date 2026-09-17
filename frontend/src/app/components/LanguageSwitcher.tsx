'use client';

import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

type Props = {
  className?: string;
  compact?: boolean;
  /** botões de bandeira em vez de select */
  variant?: 'select' | 'flags';
};

export function LanguageSwitcher({
  className = '',
  compact = false,
  variant = 'select',
}: Props) {
  const { language, setLanguage, tx } = useLanguage();

  const onChange = (raw: string) => {
    const code = String(raw || '').toLowerCase().slice(0, 2) as Language;
    if (code === 'pt' || code === 'en' || code === 'es' || code === 'zh') {
      setLanguage(code);
    }
  };

  const current =
    language === 'pt' || language === 'en' || language === 'es' || language === 'zh'
      ? language
      : 'pt';

  if (variant === 'flags') {
    return (
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        role="group"
        aria-label={tx('language', 'Idioma')}
      >
        {SUPPORTED_LANGUAGES.map((l) => {
          const active = current === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onChange(l.code)}
              title={l.label}
              aria-label={l.label}
              aria-pressed={active}
              className={`text-sm px-2 py-1 rounded-lg border transition-colors ${
                active
                  ? 'border-indigo-500 bg-indigo-500/20 text-zinc-50'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <span aria-hidden>{l.flag}</span>
              {!compact && <span className="ml-1 hidden sm:inline">{l.code.toUpperCase()}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {!compact && (
        <span className="text-xs text-zinc-500 hidden sm:inline">{tx('language', 'Idioma')}</span>
      )}
      <select
        aria-label={tx('language', 'Idioma')}
        value={current}
        onChange={(e) => onChange(e.target.value)}
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
