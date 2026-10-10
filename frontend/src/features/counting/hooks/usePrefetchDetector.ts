import { useEffect } from 'react'

// Wait for the page to be shown before downloading big files
const FALLBACK_DELAY_MS = 2000

/**
 * Download the model and runtime in the background when the browser is idle
 * (stage 1, docs/web_app.md section 7). Used on Home and About.
 */
export function usePrefetchDetector() {
  useEffect(() => {
    function startPrefetch() {
      // Loaded only now, so Home does not carry this code
      import('../worker/prefetchDetector').then((module) => module.prefetchDetector())
    }

    // Safari has no requestIdleCallback: then wait a moment instead
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(startPrefetch, { timeout: 5000 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = setTimeout(startPrefetch, FALLBACK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])
}
