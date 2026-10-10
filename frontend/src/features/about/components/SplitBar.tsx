import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent, SPLIT_IMAGES } from '@/content/about.content'
import { formatPercent } from '@/features/about/lib/formatMetric'

type SplitName = keyof typeof SPLIT_IMAGES

// One shade of the primary color per split, darkest = largest part
const SPLITS: { name: SplitName; colorClass: string }[] = [
  { name: 'train', colorClass: 'bg-primary' },
  { name: 'val', colorClass: 'bg-primary/60' },
  { name: 'test', colorClass: 'bg-primary/30' },
]

// A horizontal bar showing how the images are divided into train / val / test
export function SplitBar() {
  const { locale } = useLocale()
  const { dataset } = useLocalized(aboutContent)

  const totalImages = SPLIT_IMAGES.train + SPLIT_IMAGES.val + SPLIT_IMAGES.test

  return (
    <figure className="mt-10">
      <figcaption className="text-sm font-medium">{dataset.splitHeading}</figcaption>

      {/* The bar itself; the numbers are in the list below, so it is hidden from screen readers */}
      <div aria-hidden="true" className="mt-3 flex h-3 gap-0.5">
        {SPLITS.map((split) => {
          const share = SPLIT_IMAGES[split.name] / totalImages
          return (
            <div
              key={split.name}
              className={`rounded-sm ${split.colorClass}`}
              style={{ width: `${share * 100}%` }}
            />
          )
        })}
      </div>

      {/* Legend with the exact numbers */}
      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {SPLITS.map((split) => {
          const images = SPLIT_IMAGES[split.name]
          const share = images / totalImages
          return (
            <li key={split.name} className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-3 rounded-sm ${split.colorClass}`} />
              <span className="font-medium">{dataset.splitNames[split.name]}</span>
              <span className="text-muted">
                {images.toLocaleString(locale)} {dataset.imagesUnit} ·{' '}
                {formatPercent(share, locale)}
              </span>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
