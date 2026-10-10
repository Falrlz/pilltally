import { ArrowRight, Camera, Image as ImageIcon, Video, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent, type HomeContent } from '@/content/home.content'

type ModeId = HomeContent['modes']['items'][number]['id']

const MODE_ICONS: Record<ModeId, LucideIcon> = {
  camera: Camera,
  image: ImageIcon,
  video: Video,
}

// "Start anywhere": one ruled row per mode; each row opens the Count page in that mode.
// No rule on top: the light plaster left of the hero flows straight into this section.
export function ModesSection() {
  const { modes } = useLocalized(homeContent)

  return (
    <SectionContainer className="grid gap-10 lg:gap-x-14 md:py-20 short:py-10 lg:grid-cols-12">
      {/* Laptops: heading and intro stay in view while the rows scroll, like the FAQ */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <h2 className="text-4xl leading-[1.1] md:text-5xl">{modes.heading}</h2>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted">{modes.intro}</p>
        </div>
      </div>

      <ul className="border-t border-foreground/70 lg:col-span-7">
        {modes.items.map((mode) => {
          const Icon = MODE_ICONS[mode.id]
          return (
            <li key={mode.id} className="border-b border-border">
              <Link
                to={`${PATHS.count}?mode=${mode.id}`}
                className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-6 py-8 short:py-6"
              >
                <span className="flex size-12 items-center justify-center border border-foreground/60 transition-colors duration-300 group-hover:border-primary group-hover:text-primary">
                  <Icon className="size-5" strokeWidth={1.25} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display text-2xl transition-colors duration-300 group-hover:text-primary sm:text-3xl">
                    {mode.title}
                  </span>
                  <span className="mt-2 block max-w-[52ch] leading-relaxed text-muted">{mode.description}</span>
                </span>
                <ArrowRight
                  className="size-6 text-primary transition-transform duration-300 ease-settle group-hover:translate-x-1"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </SectionContainer>
  )
}
