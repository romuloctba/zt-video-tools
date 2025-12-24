import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  'pt-BR': { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'video-editor-language';

/**
 * Get the initial language from localStorage or browser preference
 */
function getInitialLanguage(): LanguageCode {
  // Check localStorage first
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && stored in LANGUAGES) {
    return stored as LanguageCode;
  }

  // Check browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) {
    return 'pt-BR';
  }

  return 'en';
}

/**
 * Change the current language and persist to localStorage
 */
export function changeLanguage(lang: LanguageCode): void {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Avoid Suspense for simpler setup
    },
  });

export default i18n;
