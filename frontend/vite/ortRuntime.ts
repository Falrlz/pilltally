import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const ORT_DIST_DIR = fileURLToPath(new URL('../node_modules/onnxruntime-web/dist/', import.meta.url))

// URL folder of the runtime files (same as RUNTIME_PATH in src/features/counting/worker/runtimeFiles.ts)
const URL_PREFIX = '/ort/'

// The only runtime files we use (see runtimeFiles.ts):
// WebGPU -> asyncify build, WASM -> plain build
const RUNTIME_FILES = [
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
]

function contentTypeOf(fileName: string): string {
  return fileName.endsWith('.wasm') ? 'application/wasm' : 'text/javascript'
}

/**
 * Serve the onnxruntime-web runtime files (.mjs / .wasm) at /ort/ as plain files.
 *
 * onnxruntime-web loads these files itself at run time, so Vite must not
 * process them (found in the spike, docs/web_app.md section 8).
 * - dev server: answered by a middleware, straight from node_modules
 * - build: copied to dist/ort/
 */
export function ortRuntime(): Plugin {
  return {
    name: 'pilltally-ort-runtime',

    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url ?? ''
        if (!url.startsWith(URL_PREFIX)) {
          next()
          return
        }

        const fileName = url.slice(URL_PREFIX.length).split('?')[0]
        if (!RUNTIME_FILES.includes(fileName)) {
          next()
          return
        }

        response.setHeader('Content-Type', contentTypeOf(fileName))
        // The runtime .mjs also starts as a Web Worker (one per WASM thread);
        // in a cross-origin isolated page Chrome needs these headers on it too.
        response.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        response.end(readFileSync(ORT_DIST_DIR + fileName))
      })
    },

    generateBundle() {
      for (const fileName of RUNTIME_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: `ort/${fileName}`,
          source: readFileSync(ORT_DIST_DIR + fileName),
        })
      }
    },
  }
}
