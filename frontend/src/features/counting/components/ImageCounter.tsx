import { Calculator, LoaderCircle, RotateCcw, Upload } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import type { CountingAreaControl } from '../hooks/useCountingArea'
import { useImageCount } from '../hooks/useImageCount'
import type { AreaPoint } from '../lib/countingArea'
import { CountDisplay } from './CountDisplay'
import { CountingAreaButtons, CountingAreaHint } from './CountingAreaButtons'
import { CountingAreaEditor } from './CountingAreaEditor'
import { DetectionOverlay } from './DetectionOverlay'
import { FilePicker } from './FilePicker'

// True when the area on screen differs from the one used for the result
function isAreaChanged(usedArea: AreaPoint[] | null, activeArea: AreaPoint[] | null): boolean {
  return JSON.stringify(usedArea) !== JSON.stringify(activeArea)
}

// The Image tab: choose an image -> counting -> image with boxes + count
export function ImageCounter({ countingArea }: { countingArea: CountingAreaControl }) {
  const content = useLocalized(countContent)
  const { state, countImage, recount, reset } = useImageCount()

  if (state.status === 'idle') {
    return (
      <FilePicker
        // Any image the browser can read; it is converted to JPEG before upload
        accept="image/*"
        buttonLabel={content.imagePicker.button}
        dropHint={content.imagePicker.dropHint}
        icon={<Upload className="size-8 text-muted" aria-hidden="true" />}
        onPick={(file) => countImage(file, countingArea.activeArea)}
      />
    )
  }

  if (state.status === 'processing') {
    return (
      <div className="space-y-4">
        {state.image !== null && (
          <img src={state.image.url} alt="" className="block h-auto w-full rounded-xl opacity-60" />
        )}
        <p className="flex items-center gap-2 text-muted">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          {content.processing}
        </p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{content.errors[state.errorKind]}</Alert>
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {content.tryAgain}
        </Button>
      </div>
    )
  }

  // status === 'success'
  const { image, result, usedArea } = state
  // The area was changed after counting: offer to count again
  const canRecount = isAreaChanged(usedArea, countingArea.activeArea)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-2 md:col-span-2">
        <DetectionOverlay
          imageUrl={image.url}
          imageWidth={image.width}
          imageHeight={image.height}
          // Old boxes would be wrong for a changed area
          boxes={canRecount ? [] : result.boxes}
          alt={content.result.imageAlt}
        >
          {countingArea.isEnabled && (
            <CountingAreaEditor points={countingArea.points} onMovePoint={countingArea.movePoint} />
          )}
        </DetectionOverlay>
        <CountingAreaHint countingArea={countingArea} />
      </div>

      <div className="space-y-4">
        <CountDisplay count={result.count} />
        {result.count === 0 && <Alert>{content.result.noPills}</Alert>}
        <div className="flex flex-wrap gap-2">
          {canRecount && (
            <Button onClick={() => recount(countingArea.activeArea)}>
              <Calculator className="size-4" aria-hidden="true" />
              {content.area.recount}
            </Button>
          )}
          <CountingAreaButtons countingArea={countingArea} />
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {content.result.anotherImage}
          </Button>
        </div>
      </div>
    </div>
  )
}
