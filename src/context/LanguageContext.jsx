/**
 * src/context/LanguageContext.jsx
 * Global Language Context & State Provider
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
  getTranslation,
  getLocalizedOption,
  getLocalizedStatus,
  getLocalizedRole,
} from "../i18n/index.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  const setLanguage = useCallback((newLang) => {
    setLanguageState(newLang);
    setStoredLanguage(newLang);
  }, []);

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  const t = useMemo(() => getTranslation(language), [language]);

  const getOption = useCallback((val) => getLocalizedOption(val, language), [language]);
  const getStatus = useCallback((status) => getLocalizedStatus(status, language), [language]);
  const getRole = useCallback((role) => getLocalizedRole(role, language), [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      t,
      getOption,
      getStatus,
      getRole,
    }),
    [language, setLanguage, t, getOption, getStatus, getRole]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    const lang = getStoredLanguage();
    return {
      language: lang,
      setLanguage: () => {},
      languages: LANGUAGES,
      t: getTranslation(lang),
      getOption: (val) => getLocalizedOption(val, lang),
      getStatus: (status) => getLocalizedStatus(status, lang),
      getRole: (role) => getLocalizedRole(role, lang),
    };
  }
  return ctx;
}
