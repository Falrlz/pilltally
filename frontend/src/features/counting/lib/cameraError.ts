// What went wrong when opening the camera. The screen shows a text for each kind
// (content/count.content.ts camera), following "Kondisi Layar" in docs/web_halaman.md.
export type CameraErrorKind = 'denied' | 'notFound' | 'error'

/**
 * Turn the error of navigator.mediaDevices.getUserMedia() into an error kind.
 * The browser tells what happened with error.name.
 */
export function getCameraErrorKind(error: unknown): CameraErrorKind {
  let name = ''
  if (typeof error === 'object' && error !== null && 'name' in error) {
    name = String(error.name)
  }

  // The user (or a browser setting) did not allow the camera
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'denied'
  }
  // No camera, or no camera matching what we asked for
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'notFound'
  }
  // e.g. NotReadableError: another app is using the camera
  return 'error'
}
