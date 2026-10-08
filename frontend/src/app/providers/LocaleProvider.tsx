import { useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_LOCALE, LocaleContext, LOCALES, type Locale } from './localeContext'

const STORAGE_KEY = 'pilltally-locale'

function readSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    for (const locale of LOCALES) {
      if (saved === locale) {
        return locale
      }
    }
  } catch {
    // localStorage can be blocked (private mode); then use the main language
  }
  return DEFAULT_LOCALE
}

function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not saved: the choice only lasts until the page is closed
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readSavedLocale)

  // Keep <html lang> correct for screen readers and browser translation
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale)
    saveLocale(nextLocale)
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}
