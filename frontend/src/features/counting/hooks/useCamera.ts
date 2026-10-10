import { useEffect, useRef, useState } from 'react'
import { getCameraErrorKind, type CameraErrorKind } from '../lib/cameraError'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'paused' | 'unsupported' | CameraErrorKind

// The camera API only exists on secure pages (https or localhost)
function isCameraSupported(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/**
 * Open and close the camera.
 *
 * - start(): asks permission the first time; uses the back camera on phones
 * - switchCamera(): next camera, when there is more than one
 * - the camera stops by itself when the tab is hidden or the phone is locked
 *   (status 'paused'), and when the component disappears
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>(isCameraSupported() ? 'idle' : 'unsupported')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraIds, setCameraIds] = useState<string[]>([])
  // The stream now open, and the camera last used (to resume or switch)
  const streamRef = useRef<MediaStream | null>(null)
  const lastCameraIdRef = useRef<string | null>(null)

  function stopTracks() {
    if (streamRef.current !== null) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
  }

  async function start(cameraId: string | null = lastCameraIdRef.current) {
    stopTracks()
    setStream(null)
    setStatus('requesting')

    // A chosen camera, or else the back camera if there is one
    const cameraChoice = cameraId !== null ? { deviceId: { exact: cameraId } } : { facingMode: { ideal: 'environment' } }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...cameraChoice, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = newStream
      lastCameraIdRef.current = newStream.getVideoTracks()[0]?.getSettings().deviceId ?? null
      setStream(newStream)
      setStatus('active')

      // The list of cameras is only complete after permission was given
      const devices = await navigator.mediaDevices.enumerateDevices()
      const ids: string[] = []
      for (const device of devices) {
        if (device.kind === 'videoinput') {
          ids.push(device.deviceId)
        }
      }
      setCameraIds(ids)
    } catch (error) {
      setStatus(getCameraErrorKind(error))
    }
  }

  function stop() {
    stopTracks()
    setStream(null)
    setStatus('idle')
  }

  function switchCamera() {
    if (cameraIds.length < 2) {
      return
    }
    const currentIndex = cameraIds.indexOf(lastCameraIdRef.current ?? '')
    const nextIndex = (currentIndex + 1) % cameraIds.length
    start(cameraIds[nextIndex])
  }

  // Stop the camera when the tab is hidden or the phone is locked
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && streamRef.current !== null) {
        stopTracks()
        setStream(null)
        setStatus('paused')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Leaving the page: turn the camera off
      stopTracks()
    }
  }, [])

  return {
    status,
    stream,
    canSwitchCamera: cameraIds.length > 1,
    start: () => start(),
    stop,
    switchCamera,
  }
}
