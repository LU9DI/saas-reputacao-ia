"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import pt from "../dictionaries/pt.json";
import en from "../dictionaries/en.json";
import es from "../dictionaries/es.json";
import zh from "../dictionaries/zh.json";

export type Language = "pt" | "en" | "es" | "zh";

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

/** Chaves de tradução — strings livres (evita conflito entre pt/en/es/zh no build). */
export type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  pt: pt as Dictionary,
  en: en as Dictionary,
  es: es as Dictionary,
  zh: zh as Dictionary,
};

const STORAGE_KEY = "filtra_lang";

function detectBrowserLang(): Language {
  if (typeof navigator === "undefined") return "pt";
  const raw = (navigator.language || (navigator as any).userLanguage || "pt").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("pt")) return "pt";
  return "pt";
}

function normalizeLang(v: string | null | undefined): Language | null {
  const s = String(v || "").toLowerCase().slice(0, 2);
  if (s === "pt" || s === "en" || s === "es" || s === "zh") return s;
  return null;
}

function applyDocumentLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang =
    lang === "pt" ? "pt-BR" : lang === "zh" ? "zh-CN" : lang;
}

/** Merge com PT para chaves faltantes em en/es/zh — evita texto vazio ao trocar idioma. */
function dictFor(lang: Language): Dictionary {
  if (lang === "pt") return dictionaries.pt;
  return { ...dictionaries.pt, ...(dictionaries[lang] || {}) };
}

interface LanguageContextData {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  /** alias legado */
  translations: Dictionary;
}

const defaultDict = dictionaries.pt;
const LanguageContext = createContext<LanguageContextData>({
  language: "pt",
  setLanguage: () => {
    /* no-op fora do provider */
  },
  t: defaultDict,
  translations: defaultDict,
});

export const LanguageProvider: React.FC<{ children: ReactNode; initial?: Language }> = ({
  children,
  initial,
}) => {
  const [language, setLanguageState] = useState<Language>(initial || "pt");

  useEffect(() => {
    let next: Language = initial || "pt";
    try {
      const stored = normalizeLang(localStorage.getItem(STORAGE_KEY));
      next = stored || initial || detectBrowserLang();
    } catch {
      next = initial || detectBrowserLang();
    }
    setLanguageState(next);
    applyDocumentLang(next);
  }, [initial]);

  const setLanguage = useCallback((lang: Language) => {
    const normalized = normalizeLang(lang) || "pt";
    setLanguageState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      /* */
    }
    applyDocumentLang(normalized);
  }, []);

  const t = useMemo(() => dictFor(language), [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      translations: t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextData => {
  const ctx = useContext(LanguageContext);
  // Sempre retorna objeto válido (nunca undefined)
  return ctx || {
    language: "pt" as Language,
    setLanguage: () => {},
    t: defaultDict,
    translations: defaultDict,
  };
};
