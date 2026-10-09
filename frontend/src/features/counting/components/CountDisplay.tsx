import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'

// The pill count, in the same voice as the count on Home:
// a large iris number in the display face, with a small caps label, e.g. "12 PIL"
export function CountDisplay({ count }: { count: number }) {
  const { result } = useLocalized(countContent)
  const unit = count === 1 ? result.unitOne : result.unitMany

  return (
    // aria-live: screen readers announce the new count
    <p aria-live="polite" className="flex items-baseline gap-3">
      <span className="font-display text-5xl leading-none text-primary tabular-nums md:text-7xl">{count}</span>
      <span className="text-xs tracking-[0.2em] text-muted uppercase">{unit}</span>
    </p>
  )
}
