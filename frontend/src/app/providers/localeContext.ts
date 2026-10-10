import { createContext, useContext } from 'react'

export type Locale = 'id' | 'en'

// Bahasa Indonesia is the main language, English the second
export const DEFAULT_LOCALE: Locale = 'id'
export const LOCALES: Locale[] = ['id', 'en']

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (value === null) {
    throw new Error('useLocale must be used inside <LocaleProvider>')
  }
  return value
}

/**
 * Content written in every language. Both languages are required, so
 * TypeScript shows an error when an English text is missing.
 *
 * Example: const helloContent: Localized<{ hello: string }> = {
 *   id: { hello: 'Halo' },
 *   en: { hello: 'Hello' },
 * }
 */
export type Localized<T> = Record<Locale, T>

// The current language's version of a content object: useLocalized(helloContent).hello
export function useLocalized<T>(content: Localized<T>): T {
  const { locale } = useLocale()
  return content[locale]
}
