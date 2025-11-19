import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// ONLY import the source language
import en from './locales/en.json';

const STORAGE_KEY = 'user-language';

export async function initI18n() {
  // Get saved user language or device language
  let savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
  const deviceLang = Localization.locale.split('-')[0];
  const lng = savedLanguage || deviceLang || 'en';

  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        // Initialize with ONLY English
        resources: {
          en: { translation: en },
        },
        lng,
        fallbackLng: 'en', // If the 'lng' (e.g. 'fr') isn't loaded yet, show English
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
      });
  }
}

// ... existing changeLanguage code ...