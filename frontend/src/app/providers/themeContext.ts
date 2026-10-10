import { createContext, useContext } from 'react'

// What the user picked in the settings
export type ThemePreference = 'light' | 'dark' | 'system'
// What is actually shown ("system" becomes light or dark)
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

// Use in any component: const { preference, setPreference } = useTheme()
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (value === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return value
}
