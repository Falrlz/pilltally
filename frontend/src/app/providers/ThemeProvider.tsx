import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type ResolvedTheme, type ThemePreference } from './themeContext'

// Same key as the small script in index.html
const STORAGE_KEY = 'pilltally-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readSavedPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // localStorage can be blocked (private mode); then follow the system
  }
  return 'system'
}

function savePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Not saved: the choice only lasts until the page is closed
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readSavedPreference)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  // Follow changes of the system theme (used when preference is "system")
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)

    function handleSystemChange() {
      setSystemTheme(getSystemTheme())
    }

    media.addEventListener('change', handleSystemChange)
    return () => media.removeEventListener('change', handleSystemChange)
  }, [])

  const resolved: ResolvedTheme = preference === 'system' ? systemTheme : preference

  // Put class="dark" on <html> when the theme is dark (see styles/index.css)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  function setPreference(nextPreference: ThemePreference) {
    setPreferenceState(nextPreference)
    savePreference(nextPreference)
  }

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}
