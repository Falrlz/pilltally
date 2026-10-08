/**
 * Web Worker that runs the pill detection model in the browser.
 *
 * It runs on its own thread, so the page (video, buttons) stays smooth while
 * the model works. Flow per image, the same as the backend:
 * letterbox (OffscreenCanvas) -> tensor -> ONNX -> postprocess -> boxes
 *
 * Messages are described in protocol.ts.
 */

import type { InferenceSession, Tensor } from 'onnxruntime-web'
import { boundingRect, toPixels, type PixelRect } from '../lib/countingArea'
import { boxCenterInside, type Point } from '../lib/geometry'
import { computeLetterbox, pixelsToTensor, PAD_GRAY, type LetterboxInfo } from '../lib/letterbox'
import { postprocess } from '../lib/postprocess'
import type { LoadStage, WorkerRequest, WorkerResponse } from './protocol'
import { chooseBackend, RUNTIME_PATH, type DetectorBackend } from './runtimeFiles'

type OrtModule = typeof import('onnxruntime-web')

const GRAY = `rgb(${PAD_GRAY}, ${PAD_GRAY}, ${PAD_GRAY})`

// The worker's global scope. Typed as Worker because this project uses the
// DOM types (the page's), which do not describe a worker's own scope.
const workerScope = self as unknown as Worker

function send(message: WorkerResponse) {
  workerScope.postMessage(message)
}

function sendProgress(stage: LoadStage, percent: number | null) {
  send({ type: 'progress', stage, percent })
}

// Everything that exists after a successful load
interface LoadedModel {
  ort: OrtModule
  session: InferenceSession
  inputName: string
  imgsz: number
  minScore: number
  // Made once and reused for every image (no garbage collection pauses)
  inputBuffer: Float32Array
  context: OffscreenCanvasRenderingContext2D
}

let loaded: LoadedModel | null = null
let isLoading = false

// Only download the runtime that is needed: WebGPU (26 MB) or WASM (14 MB)
async function importRuntime(backend: DetectorBackend): Promise<OrtModule> {
  if (backend === 'webgpu') {
    return await import('onnxruntime-web/webgpu')
  }
  return await import('onnxruntime-web/wasm')
}

// Download the model file, reporting the progress in percent
async function downloadModel(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`)
  }

  const totalBytes = Number(response.headers.get('Content-Length')) || 0
  if (response.body === null) {
    return new Uint8Array(await response.arrayBuffer())
  }

  // Read the file piece by piece to know how much has arrived
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let receivedBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(value)
    receivedBytes += value.length
    const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : null
    sendProgress('model', percent)
  }

  // Join the pieces into one array
  const modelBytes = new Uint8Array(receivedBytes)
  let position = 0
  for (const chunk of chunks) {
    modelBytes.set(chunk, position)
    position += chunk.length
  }
  return modelBytes
}

function createInputTensor(ort: OrtModule, buffer: Float32Array, imgsz: number): Tensor {
  return new ort.Tensor('float32', buffer, [1, 3, imgsz, imgsz])
}

async function load(request: Extract<WorkerRequest, { type: 'load' }>) {
  // Load only once; later "load" messages get the same answer
  if (isLoading || loaded !== null) {
    return
  }
  isLoading = true
  const startTime = performance.now()

  try {
    const backend = await chooseBackend()

    sendProgress('model', 0)
    const modelBytes = await downloadModel(request.modelUrl)

    sendProgress('prepare', null)
    const ort = await importRuntime(backend)
    // The runtime downloads its .wasm file from our own server
    ort.env.wasm.wasmPaths = RUNTIME_PATH
    const session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: [backend],
    })

    const imgsz = request.imgsz
    const canvas = new OffscreenCanvas(imgsz, imgsz)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context === null) {
      throw new Error('OffscreenCanvas 2D is not available')
    }

    const inputBuffer = new Float32Array(3 * imgsz * imgsz)
    const inputName = session.inputNames[0]

    // Warm-up: the first run is slow (GPU setup), so do it now, not on the first frame
    await session.run({ [inputName]: createInputTensor(ort, inputBuffer, imgsz) })

    loaded = {
      ort,
      session,
      inputName,
      imgsz,
      minScore: request.minScore,
      inputBuffer,
      context,
    }
    send({ type: 'ready', backend, loadMs: Math.round(performance.now() - startTime) })
  } catch (error) {
    send({ type: 'loadError', message: String(error) })
  } finally {
    isLoading = false
  }
}

/**
 * Paint everything outside the counting area gray, inside the letterbox.
 * The backend paints before resizing and we paint after, so only the pixels
 * right on the border can differ a little.
 */
function paintOutsideArea(
  context: OffscreenCanvasRenderingContext2D,
  areaPixels: Point[],
  rect: PixelRect,
  info: LetterboxInfo,
) {
  context.beginPath()
  // The whole picture...
  context.rect(info.padLeft, info.padTop, info.newWidth, info.newHeight)
  // ...minus the area: with the "evenodd" rule the inside of the area is not filled
  for (let i = 0; i < areaPixels.length; i++) {
    const x = (areaPixels[i][0] - rect.x) * info.scale + info.padLeft
    const y = (areaPixels[i][1] - rect.y) * info.scale + info.padTop
    if (i === 0) {
      context.moveTo(x, y)
    } else {
      context.lineTo(x, y)
    }
  }
  context.closePath()
  context.fillStyle = GRAY
  context.fill('evenodd')
}

async function detect(request: Extract<WorkerRequest, { type: 'detect' }>) {
  const image = request.image
  if (loaded === null) {
    image.close()
    send({ type: 'detectError', id: request.id, message: 'Model is not loaded' })
    return
  }

  const startTime = performance.now()
  try {
    const { ort, session, inputName, imgsz, minScore, inputBuffer, context } = loaded

    // 1. The part given to the model: the whole image, or the rectangle around
    //    the counting area (same as backend apply_area)
    const areaPixels = request.area === null ? null : toPixels(request.area, image.width, image.height)
    const rect =
      areaPixels === null
        ? { x: 0, y: 0, width: image.width, height: image.height }
        : boundingRect(areaPixels, image.width, image.height)
    if (rect.width < 1 || rect.height < 1) {
      send({ type: 'result', id: request.id, boxes: [], inferenceMs: 0, totalMs: 0 })
      return
    }

    // 2. Letterbox: gray square, the part resized into the middle
    const info = computeLetterbox(rect.width, rect.height, imgsz)
    context.fillStyle = GRAY
    context.fillRect(0, 0, imgsz, imgsz)
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height, info.padLeft, info.padTop, info.newWidth, info.newHeight)
    if (areaPixels !== null) {
      paintOutsideArea(context, areaPixels, rect, info)
    }
    const region = { offsetX: rect.x, offsetY: rect.y, width: rect.width, height: rect.height }

    // 3. Pixels -> model input (into the reused buffer)
    const pixels = context.getImageData(0, 0, imgsz, imgsz).data
    pixelsToTensor(pixels, imgsz, inputBuffer)

    // 4. Model
    const inferenceStart = performance.now()
    const outputs = await session.run({ [inputName]: createInputTensor(ort, inputBuffer, imgsz) })
    const inferenceMs = performance.now() - inferenceStart
    const output = outputs[session.outputNames[0]]
    const outputData = (await output.getData()) as Float32Array

    // 5. Score filter (>= minScore) + NMS + back to image pixels
    // (boxes with score >= conf_threshold are exactly the backend result)
    let boxes = postprocess(outputData, info, region, minScore)

    // 6. Only pills whose box center is inside the counting area
    if (areaPixels !== null) {
      boxes = boxes.filter((box) => boxCenterInside(box, areaPixels))
    }

    send({
      type: 'result',
      id: request.id,
      boxes,
      inferenceMs: Math.round(inferenceMs),
      totalMs: Math.round(performance.now() - startTime),
    })
  } catch (error) {
    send({ type: 'detectError', id: request.id, message: String(error) })
  } finally {
    // Free the image memory right away
    image.close()
  }
}

workerScope.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type === 'load') {
    load(request)
  } else {
    detect(request)
  }
})
