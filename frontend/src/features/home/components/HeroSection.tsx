import { useLocalized } from '@/app/providers/localeContext'
import { homeContent } from '@/content/home.content'
import { useTrayCount } from '@/features/home/hooks/useTrayCount'
import { RotatingWords } from './RotatingWords'
import { TrayScene } from './tray/TrayScene'

// First screen of Home, filling the screen on every size.
// Left: the title on light plaster. Right: a recessed plaster alcove framed by a
// pine L, holding the counting tray (4 draggable corners) with the hint and the
// live count underneath.
export function HeroSection() {
  const { hero } = useLocalized(homeContent)
  const tray = useTrayCount()

  return (
    // overflow-x-clip: the alcove panel reaches the screen edge without a side scrollbar
    <section className="relative overflow-x-clip">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full page-width px-5 md:px-8 lg:grid-cols-12 lg:gap-x-14">
        <h1 className="self-center py-12 text-[clamp(2.4rem,3.8vw,3.6rem)] min-[1700px]:text-[clamp(3.6rem,3.4vw,4rem)] leading-[1.12] tracking-[-0.01em] lg:col-span-5 lg:py-0">
          {hero.titleStart}
          {/* Screen readers hear all words; sighted users see them one by one */}
          <span className="sr-only"> {hero.rotatingWords.join(', ')}</span>
          <RotatingWords words={hero.rotatingWords} />
          {/* Keep "secara otomatis" on one line */}
          <span className="whitespace-nowrap">{hero.titleEnd}</span>
        </h1>

        <div className="relative flex flex-col justify-center py-10 lg:col-span-7 lg:py-12 lg:pl-12">
          {/* The alcove: phones run it edge to edge below the title (pine lintel on top);
              laptops run it from the column to the right screen edge, framed by one
              pine piece in an L: down its left side, then along its bottom to the edge */}
          <div
            aria-hidden="true"
            className="plaster-recess absolute inset-y-0 -right-5 -left-5 border-t-8 border-post md:-right-8 md:-left-8 lg:left-0 lg:right-[calc(-1*max(2rem,(100vw_-_var(--page-width))/2_+_2rem))] lg:border-t-0 lg:border-b-[10px] lg:border-l-[10px]"
          />

          {/* The tray is as wide as its column (same proportions on every screen),
              but never taller than the screen allows */}
          <div className="relative w-full max-w-[calc((100svh_-_16rem)*568/400)]">
            <TrayScene
              quad={tray.quad}
              isIntro={tray.isIntro}
              introDelayMs={tray.introDelayMs}
              label={hero.visualLabel}
              cornerLabels={hero.cornerLabels}
              onMoveCorner={tray.moveCorner}
            />

            {/* Under the tray: the live count on the left, the hint on the right */}
            <div className="mt-4 flex items-end justify-between gap-6">
              <p className="flex shrink-0 items-baseline gap-3">
                {/* Announced only after the opening sequence */}
                <span
                  aria-live={tray.isIntro ? 'off' : 'polite'}
                  className="font-display text-5xl leading-none text-primary tabular-nums md:text-7xl"
                >
                  {tray.shownCount}
                </span>
                <span className="text-sm tracking-[0.2em] text-muted uppercase">{hero.countLabel}</span>
              </p>
              <p className="max-w-[30ch] text-right text-sm leading-relaxed text-muted">{hero.dragHint}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
