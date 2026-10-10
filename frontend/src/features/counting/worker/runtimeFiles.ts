// Which onnxruntime-web runtime to use, and where its files are.
// This file does NOT import onnxruntime-web, so pages can use it cheaply
// (e.g. to download the runtime early, see prefetchDetector.ts).

export type DetectorBackend = 'webgpu' | 'wasm'

// Served by vite/ortRuntime.ts (dev) and copied to dist/ort/ (build)
export const RUNTIME_PATH = `${import.meta.env.BASE_URL}ort/`

// The big runtime file each backend downloads (WebGPU 26 MB, WASM 14 MB)
const RUNTIME_WASM_FILES: Record<DetectorBackend, string> = {
  webgpu: 'ort-wasm-simd-threaded.asyncify.wasm',
  wasm: 'ort-wasm-simd-threaded.wasm',
}

export function getRuntimeWasmUrl(backend: DetectorBackend): string {
  return RUNTIME_PATH + RUNTIME_WASM_FILES[backend]
}

// navigator.gpu is not in TypeScript's standard types yet
interface NavigatorWithGpu {
  gpu?: { requestAdapter: () => Promise<unknown> }
}

/**
 * WebGPU if this device really has a usable GPU adapter, otherwise WASM.
 * Works in a page and in a Web Worker.
 */
export async function chooseBackend(): Promise<DetectorBackend> {
  const gpu = (navigator as NavigatorWithGpu).gpu
  if (gpu === undefined) {
    return 'wasm'
  }
  try {
    const adapter = await gpu.requestAdapter()
    return adapter ? 'webgpu' : 'wasm'
  } catch {
    return 'wasm'
  }
}
