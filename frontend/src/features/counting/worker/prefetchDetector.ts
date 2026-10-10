/**
 * Stage 1 of loading the model (docs/web_app.md section 7):
 * download the model and the runtime into the browser cache while the user
 * is still on Home or About. Nothing is started; the Count page then finds
 * the files in the cache and only has to prepare them (stage 2).
 *
 * This file is loaded with import() when the browser is idle, so it does not
 * make the Home page bigger.
 */

import { getModelFileUrl, getModelInfo } from '@/services/api'
import { chooseBackend, getRuntimeWasmUrl } from './runtimeFiles'

// Network Information API, not in TypeScript's standard types and not in every browser
interface NavigatorWithConnection {
  connection?: { saveData?: boolean; effectiveType?: string }
}

const SLOW_CONNECTIONS = ['slow-2g', '2g', '3g']

let hasStarted = false

// Do not use the user's data when they ask to save it or the connection is slow
function shouldSkip(): boolean {
  const connection = (navigator as NavigatorWithConnection).connection
  if (connection === undefined) {
    return false
  }
  if (connection.saveData === true) {
    return true
  }
  return SLOW_CONNECTIONS.includes(connection.effectiveType ?? '')
}

// Download a file completely, so the browser stores it in its cache
async function downloadToCache(url: string): Promise<void> {
  const response = await fetch(url, { priority: 'low' })
  await response.arrayBuffer()
}

export async function prefetchDetector(): Promise<void> {
  if (hasStarted || shouldSkip()) {
    return
  }
  hasStarted = true

  try {
    const backend = await chooseBackend()
    const info = await getModelInfo()
    await Promise.all([
      downloadToCache(getModelFileUrl(info.run_id)),
      downloadToCache(getRuntimeWasmUrl(backend)),
    ])
  } catch {
    // Not important: the Count page downloads the files itself if needed
  }
}
