import { useLocalized } from '@/app/providers/localeContext'
import { uiContent } from '@/content/ui.content'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeSwitch } from './ThemeSwitch'

// Language + theme settings. Shown in the SettingsMenu (laptop) and the MobileNav (phone).
export function SettingsPanel() {
  const { settings } = useLocalized(uiContent)

  return (
    <div>
      <p className="font-display text-lg">{settings.title}</p>
      <p className="mt-4 mb-2 text-xs tracking-[0.2em] text-muted uppercase">{settings.language}</p>
      <LanguageSwitch />
      <p className="mt-5 mb-2 text-xs tracking-[0.2em] text-muted uppercase">{settings.theme}</p>
      <ThemeSwitch />
    </div>
  )
}
