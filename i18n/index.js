import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import translationEnUS from "./locales/en-US/translation.json";
import translationAfZa from "./locales/af-ZA/translation.json";
import translationAmEt from "./locales/am-ET/translation.json";
import translationArSa from "./locales/ar-SA/translation.json";
import translationBgBg from "./locales/bg-BG/translation.json";
import translationCaEs from "./locales/ca-ES/translation.json";
import translationChrUs from "./locales/chr-US/translation.json";
import translationCsCz from "./locales/cs-CZ/translation.json";
import translationCyGb from "./locales/cy-GB/translation.json";
import translationDaDk from "./locales/da-DK/translation.json";
import translationDeDe from "./locales/de-DE/translation.json";
import translationDeIf from "./locales/de-if/translation.json";
import translationElGr from "./locales/el-GR/translation.json";
import translationEnGb from "./locales/en-GB/translation.json";
import translationEnId from "./locales/en-ID/translation.json";
import translationEsCo from "./locales/es-CO/translation.json";
import translationEsEs from "./locales/es-ES/translation.json";
import translationEsMx from "./locales/es-MX/translation.json";
import translationEsVe from "./locales/es-VE/translation.json";
import translationEtEe from "./locales/et-EE/translation.json";
import translationFaIr from "./locales/fa-IR/translation.json";
import translationFiFi from "./locales/fi-FI/translation.json";
import translationFilPh from "./locales/fil-PH/translation.json";
import translationFrFr from "./locales/fr-FR/translation.json";
import translationGaIe from "./locales/ga-IE/translation.json";
import translationHeIl from "./locales/he-IL/translation.json";
import translationHiIn from "./locales/hi-IN/translation.json";
import translationHrHr from "./locales/hr-HR/translation.json";
import translationHuHu from "./locales/hu-HU/translation.json";
import translationHyAm from "./locales/hy-AM/translation.json";
import translationIdId from "./locales/id-ID/translation.json";
import translationIsIs from "./locales/is-IS/translation.json";
import translationItIt from "./locales/it-IT/translation.json";
import translationIuNu from "./locales/iu-NU/translation.json";
import translationJaJp from "./locales/ja-JP/translation.json";
import translationKaGe from "./locales/ka-GE/translation.json";
import translationKmKh from "./locales/km-KH/translation.json";
import translationKoKr from "./locales/ko-KR/translation.json";
import translationLtLt from "./locales/lt-LT/translation.json";
import translationLvLv from "./locales/lv-LV/translation.json";
import translationMiNz from "./locales/mi-NZ/translation.json";
import translationMkMk from "./locales/mk-MK/translation.json";
import translationMlIn from "./locales/ml-IN/translation.json";
import translationMnMn from "./locales/mn-MN/translation.json";
import translationMrIn from "./locales/mr-IN/translation.json";
import translationMsMy from "./locales/ms-MY/translation.json";
import translationNbNo from "./locales/nb-NO/translation.json";
import translationNeNp from "./locales/ne-NP/translation.json";
import translationNlNl from "./locales/nl-NL/translation.json";
import translationNnNo from "./locales/nn-NO/translation.json";
import translationNoNo from "./locales/no-NO/translation.json";
import translationOmEt from "./locales/om-ET/translation.json";
import translationPlPl from "./locales/pl-PL/translation.json";
import translationPtBr from "./locales/pt-BR/translation.json";
import translationPtPt from "./locales/pt-PT/translation.json";
import translationRoRo from "./locales/ro-RO/translation.json";
import translationRuRu from "./locales/ru-RU/translation.json";
import translationSiLk from "./locales/si-LK/translation.json";
import translationSkSk from "./locales/sk-SK/translation.json";
import translationSlSi from "./locales/sl-SI/translation.json";
import translationSoSo from "./locales/so-SO/translation.json";
import translationSqAl from "./locales/sq-AL/translation.json";
import translationSrCs from "./locales/sr-CS/translation.json";
import translationSvSe from "./locales/sv-SE/translation.json";
import translationTaIn from "./locales/ta-IN/translation.json";
import translationThTh from "./locales/th-TH/translation.json";
import translationTlPh from "./locales/tl-PH/translation.json";
import translationTrTr from "./locales/tr-TR/translation.json";
import translationUkUa from "./locales/uk-UA/translation.json";
import translationUrPk from "./locales/ur-PK/translation.json";
import translationViVn from "./locales/vi-VN/translation.json";
import translationZhCn from "./locales/zh-CN/translation.json";
import translationZhHk from "./locales/zh-HK/translation.json";
import translationZhTw from "./locales/zh-TW/translation.json";
import translationZuZa from "./locales/zu-ZA/translation.json";

const resources = {
    "en-US": { translation: translationEnUS },
    "af-ZA": { translation: translationAfZa },
    "am-ET": { translation: translationAmEt },
    "ar-SA": { translation: translationArSa },
    "bg-BG": { translation: translationBgBg },
    "ca-ES": { translation: translationCaEs },
    "chr-US": { translation: translationChrUs },
    "cs-CZ": { translation: translationCsCz },
    "cy-GB": { translation: translationCyGb },
    "da-DK": { translation: translationDaDk },
    "de-DE": { translation: translationDeDe },
    "de-if": { translation: translationDeIf },
    "el-GR": { translation: translationElGr },
    "en-GB": { translation: translationEnGb },
    "en-ID": { translation: translationEnId },
    "es-CO": { translation: translationEsCo },
    "es-ES": { translation: translationEsEs },
    "es-MX": { translation: translationEsMx },
    "es-VE": { translation: translationEsVe },
    "et-EE": { translation: translationEtEe },
    "fa-IR": { translation: translationFaIr },
    "fi-FI": { translation: translationFiFi },
    "fil-PH": { translation: translationFilPh },
    "fr-FR": { translation: translationFrFr },
    "ga-IE": { translation: translationGaIe },
    "he-IL": { translation: translationHeIl },
    "hi-IN": { translation: translationHiIn },
    "hr-HR": { translation: translationHrHr },
    "hu-HU": { translation: translationHuHu },
    "hy-AM": { translation: translationHyAm },
    "id-ID": { translation: translationIdId },
    "is-IS": { translation: translationIsIs },
    "it-IT": { translation: translationItIt },
    "iu-NU": { translation: translationIuNu },
    "ja-JP": { translation: translationJaJp },
    "ka-GE": { translation: translationKaGe },
    "km-KH": { translation: translationKmKh },
    "ko-KR": { translation: translationKoKr },
    "lt-LT": { translation: translationLtLt },
    "lv-LV": { translation: translationLvLv },
    "mi-NZ": { translation: translationMiNz },
    "mk-MK": { translation: translationMkMk },
    "ml-IN": { translation: translationMlIn },
    "mn-MN": { translation: translationMnMn },
    "mr-IN": { translation: translationMrIn },
    "ms-MY": { translation: translationMsMy },
    "nb-NO": { translation: translationNbNo },
    "ne-NP": { translation: translationNeNp },
    "nl-NL": { translation: translationNlNl },
    "nn-NO": { translation: translationNnNo },
    "no-NO": { translation: translationNoNo },
    "om-ET": { translation: translationOmEt },
    "pl-PL": { translation: translationPlPl },
    "pt-BR": { translation: translationPtBr },
    "pt-PT": { translation: translationPtPt },
    "ro-RO": { translation: translationRoRo },
    "ru-RU": { translation: translationRuRu },
    "si-LK": { translation: translationSiLk },
    "sk-SK": { translation: translationSkSk },
    "sl-SI": { translation: translationSlSi },
    "so-SO": { translation: translationSoSo },
    "sq-AL": { translation: translationSqAl },
    "sr-CS": { translation: translationSrCs },
    "sv-SE": { translation: translationSvSe },
    "ta-IN": { translation: translationTaIn },
    "th-TH": { translation: translationThTh },
    "tl-PH": { translation: translationTlPh },
    "tr-TR": { translation: translationTrTr },
    "uk-UA": { translation: translationUkUa },
    "ur-PK": { translation: translationUrPk },
    "vi-VN": { translation: translationViVn },
    "zh-CN": { translation: translationZhCn },
    "zh-HK": { translation: translationZhHk },
    "zh-TW": { translation: translationZhTw },
    "zu-ZA": { translation: translationZuZa },
};

function resolveDeviceLanguage(deviceLocales) {
    const supportedTags = Object.keys(resources);

    for (const locale of deviceLocales) {
        if (supportedTags.includes(locale.languageTag)) {
            return locale.languageTag;
        }
        const baseLanguageMatch = supportedTags.find((tag) => tag.split("-")[0] === locale.languageCode);
        if (baseLanguageMatch) {
            return baseLanguageMatch;
        }
    }

    return "en-US";
}

const deviceLanguage = resolveDeviceLanguage(getLocales());

i18n.use(initReactI18next).init({
    resources,
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
