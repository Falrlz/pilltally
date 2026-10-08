import { useState } from 'react'
import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'
import { predictImage } from '@/services/api'
import type { PredictResponse } from '@/services/types'
import { useDetector } from '../hooks/useDetector'
import { resizeImage } from '../lib/resizeImage'
import type { DetectResult } from '../worker/detectorClient'
import { DetectionOverlay } from './DetectionOverlay'
import { DetectorStatus } from './DetectorStatus'

interface Comparison {
  imageUrl: string
  width: number
  height: number
  browser: DetectResult
  server: PredictResponse | null
}

/**
 * Developer panel, shown with /count?debug=1.
 * Counts the same image in the browser (Web Worker) and on the server, so both
 * can be compared. Later it will also show live FPS (docs/web_app.md section 7E).
 */
export function DetectorDebugPanel() {
  const { debug } = useLocalized(countContent)
  const { state, detect, retry } = useDetector()
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  async function handleFile(file: File) {
    setErrorText(null)
    try {
      // The same resized image goes to the browser model and to the server
      const resized = await resizeImage(file)
      const bitmap = await createImageBitmap(resized.blob)
      const [rawBrowser, server] = await Promise.all([
        detect(bitmap),
        predictImage(resized.blob).catch(() => null),
      ])
      // The worker also returns lower boxes for the tracker; count like the server
      const confThreshold = state.status === 'ready' ? state.confThreshold : 0
      const browser = {
        ...rawBrowser,
        boxes: rawBrowser.boxes.filter((box) => box.score >= confThreshold),
      }

      if (comparison !== null) {
        URL.revokeObjectURL(comparison.imageUrl)
      }
      setComparison({
        imageUrl: URL.createObjectURL(resized.blob),
        width: resized.width,
        height: resized.height,
        browser,
        server,
      })
    } catch (error) {
      setErrorText(String(error))
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-dashed border-border p-4 text-sm">
      <h2 className="font-semibold">{debug.title}</h2>
      <DetectorStatus state={state} onRetry={retry} />
      {state.status === 'error' && <p className="font-mono text-xs text-danger">{state.message}</p>}

      {state.status === 'ready' && (
        <label className="block">
          <span className="mb-1 block text-muted">{debug.pickImage}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file !== undefined) {
                handleFile(file)
              }
            }}
          />
        </label>
      )}

      {errorText !== null && <p className="font-mono text-xs text-danger">{errorText}</p>}

      {comparison !== null && (
        <div className="grid gap-4 md:grid-cols-2">
          <DetectionOverlay
            imageUrl={comparison.imageUrl}
            imageWidth={comparison.width}
            imageHeight={comparison.height}
            boxes={comparison.browser.boxes}
            alt=""
          />
          <dl className="space-y-2 font-mono" data-testid="debug-result">
            <div>
              <dt className="text-muted">{debug.browser}</dt>
              <dd data-testid="browser-count">
                {comparison.browser.boxes.length} ({comparison.browser.inferenceMs} / {comparison.browser.totalMs}{' '}
                {debug.milliseconds})
              </dd>
            </div>
            <div>
              <dt className="text-muted">{debug.server}</dt>
              <dd data-testid="server-count">
                {comparison.server === null
                  ? '–'
                  : `${comparison.server.count} (${comparison.server.inference_ms} ${debug.milliseconds})`}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}
