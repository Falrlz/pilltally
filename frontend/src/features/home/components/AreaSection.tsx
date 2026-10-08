import { Check } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'

// "More flexible, more practical": what the counting area does
export function AreaSection() {
  const { area } = useLocalized(homeContent)

  return (
    <SectionContainer className="border-t border-border">
      <h2 className="text-3xl font-bold">{area.heading}</h2>
      <p className="mt-4 max-w-xl text-muted">{area.intro}</p>
      <ul className="mt-8 space-y-4">
        {area.points.map((point) => (
          <li key={point.id} className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span>{point.text}</span>
          </li>
        ))}
      </ul>
    </SectionContainer>
  )
}
