import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { homeContent } from '@/content/home.content'

// Closing call to action at the bottom of Home
export function CtaSection() {
  const { cta } = useLocalized(homeContent)

  return (
    <SectionContainer className="border-t border-border text-center">
      <h2 className="text-3xl font-bold">{cta.heading}</h2>
      <p className="mx-auto mt-4 max-w-xl text-muted">{cta.description}</p>
      <ButtonLink to={PATHS.count} size="lg" className="mt-8">
        {cta.buttonLabel}
      </ButtonLink>
    </SectionContainer>
  )
}
