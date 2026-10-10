import { useLocalized } from '@/app/providers/localeContext'
import { uiContent } from '@/content/ui.content'

// Shown while the code of a page is still downloading
export function PageLoading() {
  const { loading } = useLocalized(uiContent)
  return <p className="p-6 text-muted">{loading}</p>
}
