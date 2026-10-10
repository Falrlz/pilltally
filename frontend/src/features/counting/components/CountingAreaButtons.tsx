import { RotateCcw, SquareDashed } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import type { CountingAreaControl } from '../hooks/useCountingArea'

// "Counting area" on/off and "Reset area" (only while the area is on)
export function CountingAreaButtons({ countingArea }: { countingArea: CountingAreaControl }) {
  const { area } = useLocalized(countContent)

  return (
    <>
      <Button
        variant={countingArea.isEnabled ? 'primary' : 'secondary'}
        aria-pressed={countingArea.isEnabled}
        onClick={countingArea.toggle}
      >
        <SquareDashed className="size-4" aria-hidden="true" />
        {area.toggle}
      </Button>
      {countingArea.isEnabled && (
        <Button variant="secondary" onClick={countingArea.reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {area.reset}
        </Button>
      )}
    </>
  )
}

// One short line under the picture while the area is on
export function CountingAreaHint({ countingArea }: { countingArea: CountingAreaControl }) {
  const { area } = useLocalized(countContent)
  if (!countingArea.isEnabled) {
    return null
  }
  return <p className="text-sm text-muted">{area.hint}</p>
}
