import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import { ortRuntime } from './vite/ortRuntime.ts'

// Backend FastAPI saat development (backend/main.py)
const BACKEND_URL = 'http://127.0.0.1:8000'

// Header agar halaman "cross-origin isolated": WASM onnxruntime-web bisa memakai
// beberapa thread (SharedArrayBuffer). Hosting production butuh header yang sama.
const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run dev:phone`: HTTPS + bisa dibuka dari HP di WiFi yang sama.
  // Kamera dan WebGPU di HP hanya jalan di HTTPS (sertifikat sendiri, browser akan memberi peringatan).
  const isPhoneMode = mode === 'phone'

  const plugins: PluginOption[] = [react(), tailwindcss(), ortRuntime()]
  if (isPhoneMode) {
    plugins.push(basicSsl())
  }

  return {
    plugins,
    resolve: {
      alias: {
        // "@/components/ui/Button" = "src/components/ui/Button"
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: isPhoneMode,
      headers: ISOLATION_HEADERS,
      // Request ke /api dan /health diteruskan ke backend (tanpa masalah CORS)
      proxy: {
        '/api': BACKEND_URL,
        '/health': BACKEND_URL,
      },
    },
    preview: {
      headers: ISOLATION_HEADERS,
    },
    // Web Worker memakai import() (runtime WebGPU atau WASM dimuat sesuai kebutuhan)
    worker: {
      format: 'es',
    },
    // onnxruntime-web memuat file runtime-nya sendiri; jangan diproses Vite saat dev
    optimizeDeps: {
      exclude: ['onnxruntime-web'],
    },
  }
})
