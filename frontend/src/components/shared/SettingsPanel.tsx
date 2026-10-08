import { useLocalized } from '@/app/providers/localeContext'
import { uiContent } from '@/content/ui.content'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeSwitch } from './ThemeSwitch'

// Language + theme settings. Shown in the SettingsMenu (laptop) and the MobileNav (phone).
export function SettingsPanel() {
  const { settings } = useLocalized(uiContent)

  return (
    <div>
      <p className="font-semibold">{settings.title}</p>
      <p className="mt-3 mb-2 text-sm text-muted">{settings.language}</p>
      <LanguageSwitch />
      <p className="mt-5 mb-2 text-sm text-muted">{settings.theme}</p>
      <ThemeSwitch />
    </div>
  )
}
