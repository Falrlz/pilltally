import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'
import { AreaVignette } from './tray/AreaVignette'

// "More flexible, more practical": what the counting area does, shown on a
// looping work table where a hand pulls the corners in to the counting mat and
// stray pills drop out of the count (an animation only, nothing to drag).
// Each point is marked with the iris corner handle of the counting frame.
export function AreaSection() {
  const { area } = useLocalized(homeContent)

  return (
    <SectionContainer className="grid gap-12 lg:gap-x-14 border-t border-border md:py-20 short:py-10 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <h2 className="text-4xl leading-[1.1] md:text-5xl">{area.heading}</h2>
        <p className="mt-6 max-w-[52ch] text-xl leading-relaxed short:mt-4 short:text-lg">{area.intro}</p>
        <ul className="mt-8 space-y-4 short:mt-6 short:space-y-3">
          {area.points.map((point) => (
            <li key={point.id} className="flex gap-4">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-primary" />
              <span className="max-w-[52ch] text-lg leading-relaxed text-muted">{point.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Starts on the same column line as the other pictures on the page; never
          taller than the window allows (picture 360 × 240 plus the count under it) */}
      <div className="lg:col-span-7 lg:max-w-[calc((100svh_-_13.5rem)*360/240)]">
        <AreaVignette label={area.vignetteLabel} countedLabel={area.countedLabel} />
      </div>
    </SectionContainer>
  )
}
