// Messages between the page (detectorClient.ts) and the Web Worker (detector.worker.ts)

import type { Box } from '@/services/types'
import type { AreaPoint } from '../lib/countingArea'
import type { DetectorBackend } from './runtimeFiles'

// Page -> worker
export type WorkerRequest =
  | {
      type: 'load'
      modelUrl: string
      imgsz: number
      // The worker returns boxes with score >= minScore. This is lower than the
      // model's conf_threshold, so the tracker can keep pills whose score dips
      // for a moment (hysteresis, lib/tracker.ts).
      minScore: number
    }
  | {
      type: 'detect'
      id: number
      // Moved to the worker without copying (transferable)
      image: ImageBitmap
      // Counting area as fractions of the image, or null for the whole image
      area: AreaPoint[] | null
    }

// What the worker is doing while loading
export type LoadStage = 'model' | 'prepare'

// Worker -> page
export type WorkerResponse =
  | { type: 'progress'; stage: LoadStage; percent: number | null }
  | { type: 'ready'; backend: DetectorBackend; loadMs: number }
  | { type: 'loadError'; message: string }
  | { type: 'result'; id: number; boxes: Box[]; inferenceMs: number; totalMs: number }
  | { type: 'detectError'; id: number; message: string }
