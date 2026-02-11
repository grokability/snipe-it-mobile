import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import translationEn from "./locales/en-US/translation.json";

const locales = getLocales();
const deviceLanguage = locales?.[0]?.languageTag ?? "en-US";

i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources: {
        "en-US": { translation: translationEn },
    },
    lng: deviceLanguage,
    fallbackLng: "en-US",
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
    initImmediate: false,
});

export default i18n;
