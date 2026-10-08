import { useLocalized } from '@/app/providers/localeContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { aboutContent } from '@/content/about.content'
import { AboutChapters } from '@/features/about/components/AboutChapters'
import { usePrefetchDetector } from '@/features/counting/hooks/usePrefetchDetector'

export default function AboutPage() {
  const { header } = useLocalized(aboutContent)
  // Download the model for the Count page while the user reads (stage 1)
  usePrefetchDetector()

  return (
    <SectionContainer>
      <PageHeader title={header.title} subtitle={header.subtitle} />
      <AboutChapters />
    </SectionContainer>
  )
}
