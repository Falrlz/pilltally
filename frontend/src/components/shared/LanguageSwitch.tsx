import { useLocale, useLocalized, type Locale } from '@/app/providers/localeContext'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { uiContent } from '@/content/ui.content'

// Each language is written in its own language, so every reader finds theirs
const LANGUAGE_OPTIONS: SegmentedOption<Locale>[] = [
  { value: 'id', label: 'Bahasa Indonesia', lang: 'id' },
  { value: 'en', label: 'English', lang: 'en' },
]

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale()
  const { settings } = useLocalized(uiContent)

  return (
    <SegmentedControl
      label={settings.language}
      options={LANGUAGE_OPTIONS}
      value={locale}
      onChange={setLocale}
    />
  )
}
