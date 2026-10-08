import { useEffect, useSyncExternalStore } from 'react'
import { detectImage, getDetectorState, loadDetector, subscribeDetector } from '../worker/detectorClient'

/**
 * The in-browser detector for camera and video.
 * Using this hook starts loading the model (stage 2, docs/web_app.md section 7).
 *
 * const { state, detect } = useDetector()
 * state.status: 'idle' | 'loading' | 'ready' | 'error'
 */
export function useDetector() {
  // Re-render when the detector state changes
  const state = useSyncExternalStore(subscribeDetector, getDetectorState)

  useEffect(() => {
    loadDetector()
  }, [])

  return { state, detect: detectImage, retry: loadDetector }
}
