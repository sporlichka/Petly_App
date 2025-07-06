import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import enTranslations from './locales/en-US/translations.json';
import ruTranslations from './locales/ru-RU/translations.json';

const LANGUAGE_STORAGE_KEY = 'user_language';

const resources = {
  'en-US': {
    translation: enTranslations,
  },
  'ru-RU': {
    translation: ruTranslations,
  },
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
};

const initI18n = async () => {
  let language = 'en-US';
  
  try {
    // Try to get stored language preference
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      language = storedLanguage;
    } else {
      // Fallback to device locale
      const locales = Localization.getLocales();
      const deviceLocale = locales[0]?.languageTag || 'en-US';
      if (deviceLocale.startsWith('ru')) {
        language = 'ru-RU';
      } else {
        language = 'en-US';
      }
    }
  } catch (error) {
    console.log('Error getting stored language:', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en-US',
      
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      
      react: {
        useSuspense: false,
      },
      
      compatibilityJSON: 'v4', // For React Native compatibility
    });

  // Save language to AsyncStorage when it changes
  i18n.on('languageChanged', async (lng) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  });
};

initI18n();

export default i18n; 