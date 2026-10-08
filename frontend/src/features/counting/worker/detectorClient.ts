/**
 * The page side of the detector Web Worker.
 *
 * There is only ONE worker for the whole app. It stays alive when the user
 * leaves the Count page, so coming back does not load the model again
 * (docs/web_app.md section 7B). Components read its state with useDetector().
 */

import { getModelFileUrl, getModelInfo } from '@/services/api'
import type { Box } from '@/services/types'
import type { AreaPoint } from '../lib/countingArea'
import { DEFAULT_TRACKER_SETTINGS } from '../lib/tracker'
import type { LoadStage, WorkerRequest, WorkerResponse } from './protocol'
import type { DetectorBackend } from './runtimeFiles'

export type DetectorState =
  | { status: 'idle' }
  | { status: 'loading'; stage: LoadStage; percent: number | null }
  // confThreshold: the model's threshold (boxes below it are only kept by the tracker)
  | { status: 'ready'; backend: DetectorBackend; loadMs: number; confThreshold: number }
  | { status: 'error'; message: string }

export interface DetectResult {
  boxes: Box[]
  inferenceMs: number
  totalMs: number
}

// The shape of detectImage, for components that receive it as a prop
export type DetectFunction = (image: ImageBitmap, area?: AreaPoint[] | null) => Promise<DetectResult>

// --- State that components can follow (used with useSyncExternalStore) ---

let state: DetectorState = { status: 'idle' }
const listeners = new Set<() => void>()

function setState(nextState: DetectorState) {
  state = nextState
  for (const listener of listeners) {
    listener()
  }
}

export function getDetectorState(): DetectorState {
  return state
}

export function subscribeDetector(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- The worker ---

let worker: Worker | null = null
// conf_threshold of the loaded model (from /api/v1/model/info)
let modelConfThreshold = 0

// Waiting detect() calls, by request id
let nextRequestId = 1
const pendingDetections = new Map<
  number,
  { resolve: (result: DetectResult) => void; reject: (error: Error) => void }
>()

function handleMessage(event: MessageEvent<WorkerResponse>) {
  const message = event.data

  if (message.type === 'progress') {
    setState({ status: 'loading', stage: message.stage, percent: message.percent })
  } else if (message.type === 'ready') {
    setState({
      status: 'ready',
      backend: message.backend,
      loadMs: message.loadMs,
      confThreshold: modelConfThreshold,
    })
  } else if (message.type === 'loadError') {
    setState({ status: 'error', message: message.message })
  } else if (message.type === 'result') {
    const pending = pendingDetections.get(message.id)
    pendingDetections.delete(message.id)
    pending?.resolve({ boxes: message.boxes, inferenceMs: message.inferenceMs, totalMs: message.totalMs })
  } else if (message.type === 'detectError') {
    const pending = pendingDetections.get(message.id)
    pendingDetections.delete(message.id)
    pending?.reject(new Error(message.message))
  }
}

function getWorker(): Worker {
  if (worker === null) {
    // Vite bundles the worker file and its imports separately
    worker = new Worker(new URL('./detector.worker.ts', import.meta.url), { type: 'module' })
    worker.addEventListener('message', handleMessage)
  }
  return worker
}

function postToWorker(message: WorkerRequest, transfer: Transferable[] = []) {
  getWorker().postMessage(message, transfer)
}

/**
 * Start loading the model (stage 2: only on the Count page).
 * Does nothing if it is already loading or ready.
 */
export async function loadDetector(): Promise<void> {
  if (state.status === 'loading' || state.status === 'ready') {
    return
  }
  setState({ status: 'loading', stage: 'model', percent: 0 })

  try {
    // imgsz and conf_threshold come from the backend, so browser and backend
    // always use the same model and threshold
    const info = await getModelInfo()
    modelConfThreshold = info.conf_threshold
    postToWorker({
      type: 'load',
      modelUrl: getModelFileUrl(info.run_id),
      imgsz: info.imgsz,
      // Lower than conf_threshold, for the tracker's hysteresis
      minScore: Math.min(DEFAULT_TRACKER_SETTINGS.keepScore, info.conf_threshold),
    })
  } catch (error) {
    setState({ status: 'error', message: String(error) })
  }
}

/**
 * Detect pills in an image, optionally only inside the counting area.
 * The ImageBitmap is moved to the worker (not copied) and cannot be used here afterwards.
 */
export function detectImage(image: ImageBitmap, area: AreaPoint[] | null = null): Promise<DetectResult> {
  const id = nextRequestId
  nextRequestId += 1

  return new Promise((resolve, reject) => {
    pendingDetections.set(id, { resolve, reject })
    postToWorker({ type: 'detect', id, image, area }, [image])
  })
}
