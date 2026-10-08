import { useLocalized } from '@/app/providers/localeContext'
import { aboutContent } from '@/content/about.content'
import { Chapter, ChapterLede } from './Chapter'

// Chapter 3: the five preprocessing decisions, numbered 01–05
export function PreprocessingChapter() {
  const { preprocessing } = useLocalized(aboutContent)

  return (
    <Chapter heading={preprocessing.heading} subline={preprocessing.subline}>
      <ChapterLede>{preprocessing.lede}</ChapterLede>

      <ol className="mt-10 border-t border-foreground/80">
        {preprocessing.steps.map((step, index) => {
          const number = String(index + 1).padStart(2, '0')
          return (
            <li
              key={step.id}
              className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-b border-border py-6 sm:grid-cols-[4rem_minmax(0,1fr)]"
            >
              <span aria-hidden="true" className="text-2xl font-bold text-primary tabular-nums sm:text-3xl">
                {number}
              </span>
              <div>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="mt-1 max-w-[62ch] leading-relaxed text-muted">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Chapter>
  )
}
