import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import pt from "./pt.json";

const STORAGE_KEY = "poker-lang";

function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "pt") return stored;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("pt")) return "pt";

  return "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export { i18n };
