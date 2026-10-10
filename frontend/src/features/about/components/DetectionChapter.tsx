import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent } from '@/content/about.content'
import { formatDecimal } from '@/features/about/lib/formatMetric'
import { Chapter, ChapterLede } from './Chapter'

// Chapter 1: counting = number of detection boxes that pass the threshold.
// threshold is undefined while model info is loading or when it failed.
export function DetectionChapter({ threshold }: { threshold: number | undefined }) {
  const { locale } = useLocale()
  const { detection } = useLocalized(aboutContent)

  let thresholdText = detection.formulaTerms.threshold
  if (threshold !== undefined) {
    thresholdText = `${thresholdText} (${formatDecimal(threshold, locale)})`
  }

  return (
    <Chapter heading={detection.heading} subline={detection.subline}>
      <ChapterLede>{detection.lede}</ChapterLede>

      <figure className="mt-8 rounded-xl bg-foreground px-4 py-8 text-background sm:px-10 sm:py-10 dark:border dark:border-border dark:bg-surface dark:text-foreground">
        {/* The formula: N = |{ i : s_i ≥ τ }| */}
        <div role="img" aria-label={detection.formulaLabel} className="overflow-x-auto">
          <p className="mx-auto w-max font-display text-2xl sm:text-4xl">
            <i>N</i> = |{'{'} <i>i</i> : <i>s</i>
            <sub className="text-base">
              <i>i</i>
            </sub>{' '}
            ≥ <i>τ</i> {'}'}|
          </p>
        </div>

        {/* What each symbol means */}
        <figcaption className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-80">
          <span>
            <i className="font-display">N</i> = {detection.formulaTerms.count}
          </span>
          <span>
            <i className="font-display">
              s<sub className="text-xs">i</sub>
            </i>{' '}
            = {detection.formulaTerms.score}
          </span>
          <span>
            <i className="font-display">τ</i> = {thresholdText}
          </span>
        </figcaption>
      </figure>
    </Chapter>
  )
}
