import type { ReactNode } from 'react'
import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'
import type { LiveStats } from '../hooks/useLiveDetection'
import type { DetectorState } from '../worker/detectorClient'
import { CountDisplay } from './CountDisplay'
import { DetectorStatus } from './DetectorStatus'

interface LiveCountPanelProps {
  detectorState: DetectorState
  onRetryDetector: () => void
  stats: LiveStats | null
  isDebug: boolean
  // The buttons of the mode (stop, switch camera, another video, ...)
  children: ReactNode
}

// The side panel of the camera and video modes: count (or model status), buttons, debug line
export function LiveCountPanel({ detectorState, onRetryDetector, stats, isDebug, children }: LiveCountPanelProps) {
  const { live } = useLocalized(countContent)

  return (
    <div className="space-y-4">
      {detectorState.status === 'ready' ? (
        <CountDisplay count={stats?.count ?? 0} />
      ) : (
        <DetectorStatus state={detectorState} onRetry={onRetryDetector} />
      )}

      <div className="flex flex-wrap gap-2">{children}</div>

      {isDebug && stats !== null && (
        <p className="font-mono text-xs text-muted" data-testid="live-stats">
          {stats.detectionsPerSecond} {live.detectionsPerSecond} · {stats.lastTotalMs} ms · {stats.frameWidth}×
          {stats.frameHeight}
          {detectorState.status === 'ready' && ` · ${detectorState.backend}`} · {live.tracked} {stats.trackedCount}
        </p>
      )}
    </div>
  )
}
