import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import type { CountingAreaControl } from '../hooks/useCountingArea'
import { useLiveDetection } from '../hooks/useLiveDetection'
import type { DetectFunction, DetectorState } from '../worker/detectorClient'
import { CountingAreaButtons, CountingAreaHint } from './CountingAreaButtons'
import { CountingAreaEditor } from './CountingAreaEditor'
import { LiveBoxesCanvas } from './LiveBoxesCanvas'
import { LiveCountPanel } from './LiveCountPanel'

interface VideoViewProps {
  videoUrl: string
  detectorState: DetectorState
  detect: DetectFunction
  onRetryDetector: () => void
  onAnotherVideo: () => void
  isDebug: boolean
  countingArea: CountingAreaControl
}

// A chosen video file: player with boxes, the count of the frame on screen, buttons
export function VideoView({
  videoUrl,
  detectorState,
  detect,
  onRetryDetector,
  onAnotherVideo,
  isDebug,
  countingArea,
}: VideoViewProps) {
  const { video } = useLocalized(countContent)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canPlay, setCanPlay] = useState(true)

  const isDetectorReady = detectorState.status === 'ready'
  const confThreshold = detectorState.status === 'ready' ? detectorState.confThreshold : 1
  // Same detection + tracking as the camera; paused frames are not detected again
  const { liveFrameRef, stats } = useLiveDetection({
    videoRef,
    isRunning: isDetectorReady && canPlay,
    detect,
    confThreshold,
    areaRef: countingArea.activeAreaRef,
  })

  const anotherVideoButton = (
    <Button variant="secondary" onClick={onAnotherVideo}>
      <RotateCcw className="size-4" aria-hidden="true" />
      {video.anotherVideo}
    </Button>
  )

  if (!canPlay) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{video.unsupported}</Alert>
        {anotherVideoButton}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-2 md:col-span-2">
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            aria-label={video.videoLabel}
            onError={() => setCanPlay(false)}
            className="block h-auto w-full rounded-xl bg-black"
          />
          <LiveBoxesCanvas liveFrameRef={liveFrameRef} />
          {countingArea.isEnabled && (
            <CountingAreaEditor points={countingArea.points} onMovePoint={countingArea.movePoint} />
          )}
        </div>
        <p className="text-sm text-muted">{video.playHint}</p>
        <CountingAreaHint countingArea={countingArea} />
      </div>

      <LiveCountPanel
        detectorState={detectorState}
        onRetryDetector={onRetryDetector}
        stats={stats}
        isDebug={isDebug}
      >
        {anotherVideoButton}
        <CountingAreaButtons countingArea={countingArea} />
      </LiveCountPanel>
    </div>
  )
}
