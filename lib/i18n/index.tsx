"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Locale, TranslationKey } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "vi",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("petbook_locale", newLocale);
      document.cookie = `petbook_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // Ignore
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[locale] || translations.vi;
    let str = dict[key] || translations.vi[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return str;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
