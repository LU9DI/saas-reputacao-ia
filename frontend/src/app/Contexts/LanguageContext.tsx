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

export type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  pt: pt as Dictionary,
  en: en as Dictionary,
  es: es as Dictionary,
  zh: zh as Dictionary,
};

/** Única fonte de verdade no cliente — sem backend. */
export const STORAGE_KEY = "filtra_lang";
const COOKIE_KEY = "filtra_lang";
const EVENT_NAME = "filtra:lang";
const CHANNEL_NAME = "filtra_lang_channel";

export function normalizeLang(v: string | null | undefined): Language | null {
  const s = String(v || "")
    .toLowerCase()
    .trim()
    .slice(0, 2);
  if (s === "pt" || s === "en" || s === "es" || s === "zh") return s;
  return null;
}

export function detectBrowserLang(): Language {
  if (typeof navigator === "undefined") return "pt";
  const raw = (navigator.language || (navigator as any).userLanguage || "pt").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("pt")) return "pt";
  return "pt";
}

function applyDocumentLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang =
    lang === "pt" ? "pt-BR" : lang === "zh" ? "zh-CN" : lang;
  document.documentElement.setAttribute("data-filtra-lang", lang);
}

function writeCookie(lang: Language) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${COOKIE_KEY}=${lang};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* */
  }
}

function readCookie(): Language | null {
  if (typeof document === "undefined") return null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)filtra_lang=([a-z]{2})/i);
    return m ? normalizeLang(m[1]) : null;
  } catch {
    return null;
  }
}

/** Merge PT + idioma atual — nunca deixa chave vazia. */
export function dictFor(lang: Language): Dictionary {
  if (lang === "pt") return dictionaries.pt;
  return { ...dictionaries.pt, ...(dictionaries[lang] || {}) };
}

/** Traduz fora de componentes React (só cliente). */
export function translateKey(
  key: string,
  lang?: Language,
  fallback?: string
): string {
  const resolved =
    lang ||
    (typeof window !== "undefined"
      ? normalizeLang(localStorage.getItem(STORAGE_KEY)) || detectBrowserLang()
      : "pt");
  const dict = dictFor(resolved);
  const value = dict[key];
  if (value && String(value).trim()) return String(value);
  return fallback || key;
}

function persistLang(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* */
  }
  writeCookie(lang);
  applyDocumentLang(lang);
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { language: lang } }));
  } catch {
    /* */
  }
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage({ language: lang });
      ch.close();
    }
  } catch {
    /* */
  }
}

interface LanguageContextData {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Dicionário do idioma atual (acesso por chave: t.login). */
  t: Dictionary;
  /** Função segura: tx('login', 'Entrar'). */
  tx: (key: string, fallback?: string) => string;
  /** alias legado */
  translations: Dictionary;
}

const defaultDict = dictionaries.pt;
const LanguageContext = createContext<LanguageContextData>({
  language: "pt",
  setLanguage: () => {},
  t: defaultDict,
  tx: (key, fallback) => defaultDict[key] || fallback || key,
  translations: defaultDict,
});

export const LanguageProvider: React.FC<{ children: ReactNode; initial?: Language }> = ({
  children,
  initial,
}) => {
  const [language, setLanguageState] = useState<Language>(initial || "pt");

  // Boot: localStorage → cookie → browser → initial
  useEffect(() => {
    let next: Language = initial || "pt";
    try {
      const stored = normalizeLang(localStorage.getItem(STORAGE_KEY));
      const cookie = readCookie();
      next = stored || cookie || initial || detectBrowserLang();
    } catch {
      next = initial || detectBrowserLang();
    }
    setLanguageState(next);
    applyDocumentLang(next);
    writeCookie(next);
  }, [initial]);

  // Sync entre abas (storage) + mesma aba (custom event) + BroadcastChannel
  useEffect(() => {
    const apply = (raw: string | null | undefined) => {
      const n = normalizeLang(raw);
      if (!n) return;
      setLanguageState((prev) => (prev === n ? prev : n));
      applyDocumentLang(n);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) apply(e.newValue);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      apply(detail?.language);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_NAME, onCustom as EventListener);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (msg) => apply(msg?.data?.language);
      }
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_NAME, onCustom as EventListener);
      try {
        channel?.close();
      } catch {
        /* */
      }
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    const normalized = normalizeLang(lang) || "pt";
    setLanguageState(normalized);
    persistLang(normalized);
  }, []);

  const dict = useMemo(() => dictFor(language), [language]);

  const tx = useCallback(
    (key: string, fallback?: string) => {
      const value = dict[key];
      if (value && String(value).trim()) return String(value);
      return fallback || key;
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: dict,
      tx,
      translations: dict,
    }),
    [language, setLanguage, dict, tx]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextData => {
  const ctx = useContext(LanguageContext);
  return (
    ctx || {
      language: "pt" as Language,
      setLanguage: () => {},
      t: defaultDict,
      tx: (key, fallback) => defaultDict[key] || fallback || key,
      translations: defaultDict,
    }
  );
};
