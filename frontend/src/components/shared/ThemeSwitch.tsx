import { Monitor, Moon, Sun } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { useTheme, type ThemePreference } from '@/app/providers/themeContext'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { uiContent } from '@/content/ui.content'

export function ThemeSwitch() {
  const { preference, setPreference } = useTheme()
  const { settings } = useLocalized(uiContent)

  const options: SegmentedOption<ThemePreference>[] = [
    { value: 'light', label: settings.themeOptions.light, icon: <Sun className="size-4" aria-hidden="true" /> },
    { value: 'dark', label: settings.themeOptions.dark, icon: <Moon className="size-4" aria-hidden="true" /> },
    { value: 'system', label: settings.themeOptions.system, icon: <Monitor className="size-4" aria-hidden="true" /> },
  ]

  return (
    <SegmentedControl
      label={settings.theme}
      options={options}
      value={preference}
      onChange={setPreference}
    />
  )
}
