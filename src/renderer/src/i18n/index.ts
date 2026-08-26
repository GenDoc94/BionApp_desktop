import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '../../../shared/locale'
import en from './locales/en.json'
import es from './locales/es.json'

export const LOCALE_STORAGE_KEY = 'bionapp-locale'

export function getStoredLocale(): AppLocale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isAppLocale(value)) return value
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

function applyDocumentLang(locale: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale.startsWith('en') ? 'en' : 'es'
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en }
  },
  lng: getStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false }
})

applyDocumentLang(i18n.language)

i18n.on('languageChanged', (lng) => {
  const locale: AppLocale = lng.startsWith('en') ? 'en' : 'es'
  applyDocumentLang(locale)
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    void window.api?.setLocale?.(locale)
  }
})

export async function setAppLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale)
}

export default i18n
