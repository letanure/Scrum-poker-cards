import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import pt from "./pt.json";
import es from "./es.json";
import de from "./de.json";
import fr from "./fr.json";
import ja from "./ja.json";
import zh from "./zh.json";
import ko from "./ko.json";
import hi from "./hi.json";
import pl from "./pl.json";
import nl from "./nl.json";
import it from "./it.json";

const STORAGE_KEY = "poker-lang";

export const SUPPORTED_LANGUAGES = {
  en: "English",
  pt: "Português",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  ja: "日本語",
  zh: "中文",
  ko: "한국어",
  hi: "हिन्दी",
  pl: "Polski",
  nl: "Nederlands",
  it: "Italiano",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const LANG_CODES = Object.keys(SUPPORTED_LANGUAGES);

function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANG_CODES.includes(stored)) return stored;

  const browserLang = navigator.language.toLowerCase();
  for (const code of LANG_CODES) {
    if (browserLang.startsWith(code)) return code;
  }

  return "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
    ja: { translation: ja },
    zh: { translation: zh },
    ko: { translation: ko },
    hi: { translation: hi },
    pl: { translation: pl },
    nl: { translation: nl },
    it: { translation: it },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

export { i18n };
