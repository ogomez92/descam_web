import { translations, type Language, type Translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'descam_language';

export const supportedLanguages: Language[] = ['en', 'es', 'de', 'fr', 'it'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && supportedLanguages.includes(stored as Language)) {
      return stored as Language;
    }
  } catch (error) {
    console.error('Error reading language from localStorage:', error);
  }
  return null;
}

function detectUserLanguage(): Language {
  // First check localStorage
  const storedLang = getStoredLanguage();
  if (storedLang) {
    return storedLang;
  }

  // Then check browser language
  const browserLang = navigator.language.toLowerCase().split('-')[0];
  if (supportedLanguages.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return 'en'; // Default to English
}

function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.error('Error saving language to localStorage:', error);
  }
}

// Svelte 5 reactive state
let currentLanguage = $state<Language>(detectUserLanguage());

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function getTranslations(): Translations {
  return translations[currentLanguage];
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  saveLanguage(lang);
}

export function getWebsiteUrl(lang: Language): string {
  return lang === 'es' ? 'https://oriolgomez.com/es' : 'https://oriolgomez.com';
}
