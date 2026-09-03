/**
 * src/i18n/index.js
 * Central translation manager for HSGQ RMA System.
 */

import id from "./id.js";
import en from "./en.js";
import zh from "./zh.js";
import { OPTION_DICT, getLocalizedOption, getLocalizedStatus, getLocalizedRole } from "./options.js";

export const I18N = {
  id,
  en,
  zh,
};

export const LANGUAGES = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

export const STORAGE_LANG_KEY = "hsgq_language";

export function getStoredLanguage() {
  if (typeof window === "undefined") return "id";
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && I18N[saved]) return saved;
  } catch (_) {}
  return "id";
}

export function setStoredLanguage(code) {
  if (typeof window === "undefined") return;
  try {
    const valid = I18N[code] ? code : "id";
    localStorage.setItem(STORAGE_LANG_KEY, valid);
    document.documentElement.setAttribute("lang", valid === "zh" ? "zh-CN" : valid);
  } catch (_) {}
}

/**
 * Returns translation dictionary with automatic English/Indonesian fallback
 * so missing keys never return undefined or raw object keys.
 */
export function getTranslation(lang = "id") {
  const currentLang = I18N[lang] ? lang : "id";
  const primary = I18N[currentLang] || I18N.id;
  const fallback = I18N.id;

  return new Proxy(primary, {
    get(target, prop) {
      if (prop === "_lang") {
        return currentLang;
      }
      if (prop in target && target[prop] !== undefined && target[prop] !== "") {
        return target[prop];
      }
      if (prop in fallback && fallback[prop] !== undefined) {
        return fallback[prop];
      }
      return "";
    },
  });
}

export {
  OPTION_DICT,
  getLocalizedOption,
  getLocalizedStatus,
  getLocalizedRole,
};
