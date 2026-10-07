import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Backend FastAPI saat development (backend/main.py)
const BACKEND_URL = 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/components/ui/Button" = "src/components/ui/Button"
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Request ke /api dan /health diteruskan ke backend (tanpa masalah CORS)
    proxy: {
      '/api': BACKEND_URL,
      '/health': BACKEND_URL,
    },
  },
})