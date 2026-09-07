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

const dictionaries = { pt, en, es, zh } as const;
export type Dictionary = typeof pt;

const STORAGE_KEY = "filtra_lang";

function detectBrowserLang(): Language {
  if (typeof navigator === "undefined") return "pt";
  const raw = (navigator.language || (navigator as any).userLanguage || "pt").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("pt")) return "pt";
  return "en";
}

function normalizeLang(v: string | null | undefined): Language | null {
  const s = String(v || "").toLowerCase().slice(0, 2);
  if (s === "pt" || s === "en" || s === "es" || s === "zh") return s;
  return null;
}

interface LanguageContextData {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  /** alias legado */
  translations: Dictionary;
}

const LanguageContext = createContext<LanguageContextData>({} as LanguageContextData);

export const LanguageProvider: React.FC<{ children: ReactNode; initial?: Language }> = ({
  children,
  initial,
}) => {
  const [language, setLanguageState] = useState<Language>(initial || "pt");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = normalizeLang(
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    );
    const next = stored || initial || detectBrowserLang();
    setLanguageState(next);
    setHydrated(true);
    if (typeof document !== "undefined") {
      document.documentElement.lang =
        next === "pt" ? "pt-BR" : next === "zh" ? "zh-CN" : next;
    }
  }, [initial]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang =
        lang === "pt" ? "pt-BR" : lang === "zh" ? "zh-CN" : lang;
    }
  }, []);

  const t = useMemo(() => dictionaries[language] || dictionaries.pt, [language]);

  const value = useMemo(
    () => ({
      language: hydrated ? language : language,
      setLanguage,
      t,
      translations: t,
    }),
    [language, setLanguage, t, hydrated]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
