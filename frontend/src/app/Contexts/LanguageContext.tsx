"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import pt from "../dictionaries/pt.json";
import en from "../dictionaries/en.json";

type Language = "pt" | "en";
type Dictionary = typeof pt;
interface LanguageContextData {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Dictionary;  
}

const LanguageContext = createContext<LanguageContextData>({} as LanguageContextData);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("pt");
  const dictionaries = { pt, en };
  const translations = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
