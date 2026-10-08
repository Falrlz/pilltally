import { Camera, Image as ImageIcon, Video, type LucideIcon } from 'lucide-react'
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

// "Start anywhere": each card opens the Count page with that mode
export function ModesSection() {
  const { modes } = useLocalized(homeContent)

  return (
    <SectionContainer className="border-t border-border">
      <h2 className="text-3xl font-bold">{modes.heading}</h2>
      <p className="mt-4 max-w-xl text-muted">{modes.intro}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {modes.items.map((mode) => {
          const Icon = MODE_ICONS[mode.id]
          return (
            <li key={mode.id}>
              <Link
                to={`${PATHS.count}?mode=${mode.id}`}
                className="block h-full rounded-xl border border-border bg-surface p-6 hover:border-primary"
              >
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold">{mode.title}</p>
                <p className="mt-2 text-muted">{mode.description}</p>
              </Link>
            </li>
          )
        })}
      </ul>
    </SectionContainer>
  )
}
