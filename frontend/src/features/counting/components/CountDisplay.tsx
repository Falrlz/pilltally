import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'

// The pill count in large numbers, e.g. "12 pills"
export function CountDisplay({ count }: { count: number }) {
  const { result } = useLocalized(countContent)
  const unit = count === 1 ? result.unitOne : result.unitMany

  return (
    // aria-live: screen readers announce the new count
    <p aria-live="polite" className="flex items-baseline gap-2">
      <span className="text-6xl font-bold tabular-nums">{count}</span>
      <span className="text-xl text-muted">{unit}</span>
    </p>
  )
}
