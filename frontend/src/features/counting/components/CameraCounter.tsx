import { Camera, LoaderCircle, Play } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import { useCamera } from '../hooks/useCamera'
import { useDetector } from '../hooks/useDetector'
import type { CountingAreaControl } from '../hooks/useCountingArea'
import { CameraView } from './CameraView'

interface CameraCounterProps {
  isDebug: boolean
  countingArea: CountingAreaControl
}

/**
 * The Camera tab.
 * The model starts loading as soon as this tab opens (in parallel with the
 * camera permission), so it is often ready when the camera is.
 */
export function CameraCounter({ isDebug, countingArea }: CameraCounterProps) {
  const { camera } = useLocalized(countContent)
  const detector = useDetector()
  const cameraControl = useCamera()
  const status = cameraControl.status

  if (status === 'active' && cameraControl.stream !== null) {
    return (
      <CameraView
        stream={cameraControl.stream}
        detectorState={detector.state}
        detect={detector.detect}
        onRetryDetector={detector.retry}
        canSwitchCamera={cameraControl.canSwitchCamera}
        onSwitchCamera={cameraControl.switchCamera}
        onStop={cameraControl.stop}
        isDebug={isDebug}
        countingArea={countingArea}
      />
    )
  }

  if (status === 'requesting') {
    return (
      <p className="flex items-center gap-2 py-16 text-muted">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        {camera.requesting}
      </p>
    )
  }

  if (status === 'unsupported') {
    return <Alert variant="danger">{camera.unsupported}</Alert>
  }

  if (status === 'denied' || status === 'notFound' || status === 'error') {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{camera[status]}</Alert>
        {status === 'error' && <Button onClick={cameraControl.start}>{camera.start}</Button>}
      </div>
    )
  }

  // 'idle' (not started yet) or 'paused' (tab was hidden)
  const isPaused = status === 'paused'
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <Camera className="size-8 text-muted" aria-hidden="true" />
      <p className="max-w-md text-muted">{isPaused ? camera.paused : camera.intro}</p>
      <Button size="lg" onClick={cameraControl.start}>
        {isPaused ? <Play className="size-4" aria-hidden="true" /> : null}
        {isPaused ? camera.resume : camera.start}
      </Button>
    </div>
  )
}
