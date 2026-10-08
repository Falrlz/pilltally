import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'
import { HeroVisual } from './HeroVisual'
import { RotatingWords } from './RotatingWords'

// First screen of Home: title with rotating words and an image
export function HeroSection() {
  const { hero } = useLocalized(homeContent)

  return (
    <SectionContainer className="grid items-center gap-10 md:grid-cols-2">
      <h1 className="text-4xl font-bold md:text-6xl">
        {hero.titleStart}
        {/* Screen readers hear all words; sighted users see them one by one */}
        <span className="sr-only"> {hero.rotatingWords.join(', ')}</span>
        <RotatingWords words={hero.rotatingWords} />
        {hero.titleEnd}
      </h1>
      <HeroVisual label={hero.visualLabel} />
    </SectionContainer>
  )
}
