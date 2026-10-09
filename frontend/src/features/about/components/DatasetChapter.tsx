import { ArrowUpRight } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { aboutContent } from '@/content/about.content'
import { Chapter, ChapterLede } from './Chapter'
import { SplitBar } from './SplitBar'

// Chapter 2: the three source datasets and how the data was split
export function DatasetChapter() {
  const { dataset } = useLocalized(aboutContent)

  return (
    <Chapter heading={dataset.heading} subline={dataset.subline}>
      <ChapterLede>{dataset.lede}</ChapterLede>

      <SplitBar />

      {/* Source register: kind on the left, details and link on the right */}
      <div className="mt-12">
        <h3 className="border-b border-foreground/80 pb-3 font-medium">{dataset.sourcesHeading}</h3>
        <ul>
          {dataset.sources.map((source) => (
            <li
              key={source.id}
              className="grid gap-x-6 gap-y-1 border-b border-border py-6 sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <p className="text-sm text-muted sm:pt-1">{dataset.sourceKind}</p>
              <div className="min-w-0">
                <p className="text-lg font-medium">{source.name}</p>
                <p className="text-sm text-muted">{source.origin}</p>
                <p className="mt-2 max-w-[62ch] leading-relaxed">{source.description}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-3 inline-flex items-start gap-1 break-all text-sm font-medium text-primary underline underline-offset-4"
                >
                  <span>{source.url.replace('https://', '')}</span>
                  <ArrowUpRight
                    className="mt-px size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                  <span className="sr-only"> {dataset.openInNewTab}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  )
}
