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

/**
 * v2: ignora auto-detecção antiga que gravava 'en' pelo idioma do Chrome.
 * Padrão do produto = português.
 */
export const STORAGE_KEY = "filtra_lang_v2";
const COOKIE_KEY = "filtra_lang_v2";
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

/** Só para referência — NÃO usado no boot automático. */
export function detectBrowserLang(): Language {
  if (typeof navigator === "undefined") return "pt";
  const raw = (navigator.language || (navigator as any).userLanguage || "pt").toLowerCase();
  if (raw.startsWith("pt")) return "pt";
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("en")) return "en";
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
    const m = document.cookie.match(/(?:^|;\s*)filtra_lang_v2=([a-z]{2})/i);
    return m ? normalizeLang(m[1]) : null;
  } catch {
    return null;
  }
}

function pickValue(dict: Dictionary | undefined, key: string): string | null {
  if (!dict) return null;
  const v = dict[key];
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

/**
 * Fallback: idioma atual → português (sempre) → fallback explícito → chave.
 * Nunca força inglês quando o idioma é pt.
 */
export function resolveTranslation(
  key: string,
  lang: Language,
  explicitFallback?: string
): string {
  const primary = pickValue(dictionaries[lang], key);
  if (primary) return primary;

  // Base do produto: português
  if (lang !== "pt") {
    const ptVal = pickValue(dictionaries.pt, key);
    if (ptVal) return ptVal;
  }

  if (explicitFallback != null && String(explicitFallback).trim()) {
    return String(explicitFallback);
  }
  return key;
}

export function dictFor(lang: Language): Dictionary {
  const target = dictionaries[lang] || dictionaries.pt;
  return new Proxy(target, {
    get(_obj, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop === "then" || prop === "toJSON" || prop === "$$typeof") return undefined;
      return resolveTranslation(prop, lang);
    },
    has(_obj, prop) {
      if (typeof prop !== "string") return false;
      return prop in dictionaries.pt || prop in (dictionaries[lang] || {});
    },
    ownKeys() {
      const keys = new Set([
        ...Object.keys(dictionaries.pt),
        ...Object.keys(dictionaries[lang] || {}),
      ]);
      return [...keys];
    },
    getOwnPropertyDescriptor(_obj, prop) {
      if (typeof prop !== "string") return undefined;
      const value = resolveTranslation(prop, lang);
      return { configurable: true, enumerable: true, value };
    },
  }) as Dictionary;
}

export function translateKey(
  key: string,
  lang?: Language,
  fallback?: string
): string {
  const resolved =
    lang ||
    (typeof window !== "undefined"
      ? normalizeLang(localStorage.getItem(STORAGE_KEY)) || "pt"
      : "pt");
  return resolveTranslation(key, resolved, fallback);
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
  t: Dictionary;
  tx: (key: string, fallback?: string) => string;
  translations: Dictionary;
}

const defaultDict = dictFor("pt");
const LanguageContext = createContext<LanguageContextData>({
  language: "pt",
  setLanguage: () => {},
  t: defaultDict,
  tx: (key, fallback) => resolveTranslation(key, "pt", fallback),
  translations: defaultDict,
});

export const LanguageProvider: React.FC<{ children: ReactNode; initial?: Language }> = ({
  children,
  initial,
}) => {
  // Sempre inicia em PT (produto BR). Só muda após escolha explícita salva.
  const [language, setLanguageState] = useState<Language>(initial || "pt");

  useEffect(() => {
    let next: Language = initial || "pt";
    try {
      const stored = normalizeLang(localStorage.getItem(STORAGE_KEY));
      const cookie = readCookie();
      // Só usa o que o usuário escolheu e salvou — nunca o idioma do Chrome
      next = stored || cookie || initial || "pt";
    } catch {
      next = initial || "pt";
    }
    setLanguageState(next);
    applyDocumentLang(next);
    // limpa chave antiga que forçava inglês
    try {
      localStorage.removeItem("filtra_lang");
    } catch {
      /* */
    }
  }, [initial]);

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
    (key: string, fallback?: string) => resolveTranslation(key, language, fallback),
    [language]
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
      tx: (key, fallback) => resolveTranslation(key, "pt", fallback),
      translations: defaultDict,
    }
  );
};
