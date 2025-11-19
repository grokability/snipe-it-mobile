import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translationEn from "./locales/en-US/translation.json";
import translationPt from "./locales/pt-PT/translation.json";

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem("locale");

    if (!savedLanguage) {
        savedLanguage = Localization.locale;
    }

    const resources = {
        "en-US": { translation: translationEn },
        "pt-PT": { translation: translationPt },
    };

    if (!i18n.isInitialized) {
        await i18n.use(initReactI18next).init({
            compatibilityJSON: "v3",
            resources,
            lng: savedLanguage,
            fallbackLng: "pt-BR",
            interpolation: {
                escapeValue: false,
            },
        });
    }
}

initI18n();

export default i18n;
