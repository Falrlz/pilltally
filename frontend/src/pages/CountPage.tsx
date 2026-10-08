import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { countContent } from '@/content/count.content'
import { CountWorkspace } from '@/features/counting/components/CountWorkspace'

export default function CountPage() {
  const { title } = useLocalized(countContent)

  return (
    <SectionContainer className="py-6 md:py-10">
      {/* Visually hidden: the tabs already show where the user is */}
      <h1 className="sr-only">{title}</h1>
      <CountWorkspace />
    </SectionContainer>
  )
}
