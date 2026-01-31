import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ar", "zh"],
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof document !== "undefined") {
  const updateDocument = (lng: string) => {
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  };
  updateDocument(i18n.language);
  i18n.on("languageChanged", updateDocument);
}

export default i18n;
