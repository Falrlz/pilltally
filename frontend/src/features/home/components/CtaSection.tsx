import { ArrowRight } from 'lucide-react'
import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { homeContent } from '@/content/home.content'

// Closing call to action: a recessed plaster alcove in a symmetric pine frame
export function CtaSection() {
  const { cta } = useLocalized(homeContent)

  return (
    <SectionContainer className="md:py-20 short:py-10">
      {/* One pine frame of the same thickness on all four sides */}
      <div className="plaster-recess border-[10px] border-post px-4 py-14 text-center sm:px-10 md:border-[14px] md:py-20 short:py-12">

        <h2 className="text-4xl leading-[1.05] sm:text-5xl md:text-7xl">{cta.heading}</h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted">{cta.description}</p>
        <ButtonLink to={PATHS.count} size="lg" className="mt-10">
          {cta.buttonLabel}
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </ButtonLink>
      </div>
    </SectionContainer>
  )
}
