import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'
import { AreaVignette } from './tray/AreaVignette'

// "More flexible, more practical": what the counting area does, shown in a
// small tray where only the pills inside the iris area get a box.
// Each point is marked with the iris corner handle of the counting frame.
export function AreaSection() {
  const { area } = useLocalized(homeContent)

  return (
    <SectionContainer className="grid gap-12 border-t border-border md:py-20 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <h2 className="text-4xl leading-[1.1] md:text-5xl">{area.heading}</h2>
        <p className="mt-6 max-w-[52ch] text-xl leading-relaxed">{area.intro}</p>
        <ul className="mt-8 space-y-4">
          {area.points.map((point) => (
            <li key={point.id} className="flex gap-4">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-primary" />
              <span className="max-w-[52ch] text-lg leading-relaxed text-muted">{point.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-6 lg:col-start-7">
        <AreaVignette label={area.vignetteLabel} />
      </div>
    </SectionContainer>
  )
}
