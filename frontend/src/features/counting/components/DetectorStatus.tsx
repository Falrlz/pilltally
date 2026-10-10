import { LoaderCircle } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { Button } from '@/components/ui/Button'
import { countContent } from '@/content/count.content'
import type { DetectorState } from '../worker/detectorClient'

interface DetectorStatusProps {
  state: DetectorState
  onRetry: () => void
}

// One line about the in-browser model: downloading 45% / preparing / ready (WebGPU) / error
export function DetectorStatus({ state, onRetry }: DetectorStatusProps) {
  const { detector, tryAgain } = useLocalized(countContent)

  if (state.status === 'ready') {
    return (
      <p className="text-sm text-muted">
        {detector.ready} ({state.backend.toUpperCase()}, {state.loadMs} ms)
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-danger">
        <span>{detector.error}</span>
        <Button variant="secondary" onClick={onRetry}>
          {tryAgain}
        </Button>
      </div>
    )
  }

  // idle or loading
  let text = detector.loadingModel
  if (state.status === 'loading' && state.stage === 'prepare') {
    text = detector.preparing
  }
  const percent = state.status === 'loading' && state.percent !== null ? ` ${state.percent}%` : ''

  return (
    <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {text}
      {percent}
    </p>
  )
}
