import { useEffect, useState } from 'react'
import { Film } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'
import type { CountingAreaControl } from '../hooks/useCountingArea'
import { useDetector } from '../hooks/useDetector'
import { FilePicker } from './FilePicker'
import { VideoView } from './VideoView'

interface VideoCounterProps {
  isDebug: boolean
  countingArea: CountingAreaControl
}

/**
 * The Video tab. The video is played and counted in the browser; it is never
 * uploaded. The model starts loading as soon as this tab opens.
 */
export function VideoCounter({ isDebug, countingArea }: VideoCounterProps) {
  const { videoPicker } = useLocalized(countContent)
  const detector = useDetector()
  // Temporary browser URL of the chosen file
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // Free the file's URL when another video is chosen or the tab closes
  useEffect(() => {
    if (videoUrl === null) {
      return
    }
    return () => URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  if (videoUrl === null) {
    return (
      <FilePicker
        accept="video/*"
        buttonLabel={videoPicker.button}
        dropHint={videoPicker.dropHint}
        icon={<Film className="size-8 text-muted" aria-hidden="true" />}
        onPick={(file) => setVideoUrl(URL.createObjectURL(file))}
      />
    )
  }

  return (
    <VideoView
      // A new key for a new video: the player and the tracking start fresh
      key={videoUrl}
      videoUrl={videoUrl}
      detectorState={detector.state}
      detect={detector.detect}
      onRetryDetector={detector.retry}
      onAnotherVideo={() => setVideoUrl(null)}
      isDebug={isDebug}
      countingArea={countingArea}
    />
  )
}
