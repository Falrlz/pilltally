import { useEffect, useRef } from 'react'
import { SwitchCamera, Square } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import type { CountingAreaControl } from '../hooks/useCountingArea'
import { useLiveDetection } from '../hooks/useLiveDetection'
import type { DetectFunction, DetectorState } from '../worker/detectorClient'
import { CountingAreaButtons, CountingAreaHint } from './CountingAreaButtons'
import { CountingAreaEditor } from './CountingAreaEditor'
import { LiveBoxesCanvas } from './LiveBoxesCanvas'
import { LiveCountPanel } from './LiveCountPanel'

interface CameraViewProps {
  stream: MediaStream
  detectorState: DetectorState
  detect: DetectFunction
  onRetryDetector: () => void
  canSwitchCamera: boolean
  onSwitchCamera: () => void
  onStop: () => void
  isDebug: boolean
  countingArea: CountingAreaControl
}

// The running camera: video with boxes, the live count and the buttons
export function CameraView({
  stream,
  detectorState,
  detect,
  onRetryDetector,
  canSwitchCamera,
  onSwitchCamera,
  onStop,
  isDebug,
  countingArea,
}: CameraViewProps) {
  const { camera } = useLocalized(countContent)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Show the camera stream in the <video>
  useEffect(() => {
    const video = videoRef.current
    if (video === null) {
      return
    }
    video.srcObject = stream
    video.play().catch(() => {
      // Autoplay can be blocked until the user taps; the stream still shows later
    })
  }, [stream])

  const isDetectorReady = detectorState.status === 'ready'
  const confThreshold = detectorState.status === 'ready' ? detectorState.confThreshold : 1
  const { liveFrameRef, stats } = useLiveDetection({
    videoRef,
    isRunning: isDetectorReady,
    detect,
    confThreshold,
    areaRef: countingArea.activeAreaRef,
  })

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-2 md:col-span-2">
        <div className="relative">
          {/* playsInline + muted: needed on iPhone to play inside the page */}
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label={camera.videoLabel}
            className="block h-auto w-full rounded-xl bg-black"
          />
          <LiveBoxesCanvas liveFrameRef={liveFrameRef} />
          {/* The area is fixed to the screen: moving the phone moves the picture under it */}
          {countingArea.isEnabled && (
            <CountingAreaEditor points={countingArea.points} onMovePoint={countingArea.movePoint} />
          )}
        </div>
        <CountingAreaHint countingArea={countingArea} />
      </div>

      <LiveCountPanel
        detectorState={detectorState}
        onRetryDetector={onRetryDetector}
        stats={stats}
        isDebug={isDebug}
      >
        <Button variant="secondary" onClick={onStop}>
          <Square className="size-4" aria-hidden="true" />
          {camera.stop}
        </Button>
        {canSwitchCamera && (
          <Button variant="secondary" onClick={onSwitchCamera}>
            <SwitchCamera className="size-4" aria-hidden="true" />
            {camera.switchCamera}
          </Button>
        )}
        <CountingAreaButtons countingArea={countingArea} />
      </LiveCountPanel>
    </div>
  )
}
