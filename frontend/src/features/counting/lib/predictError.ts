// What went wrong with an image count. The screen shows a text for each kind
// (content/count.content.ts), following "Kondisi Layar" in docs/web_halaman.md.
export type PredictErrorKind = 'invalidImage' | 'tooLarge' | 'serverUnavailable' | 'unknown'

/**
 * Turn the HTTP status of a failed /api/v1/predict request into an error kind.
 * status is undefined when there was no answer at all (server down, no internet).
 *
 * Status codes come from backend/app/api/v1/endpoints/predict.py.
 */
export function getPredictErrorKind(status: number | undefined): PredictErrorKind {
  if (status === undefined) {
    return 'serverUnavailable'
  }
  if (status === 400) {
    return 'invalidImage'
  }
  if (status === 413) {
    return 'tooLarge'
  }
  // 503 = model not loaded; 502/504 = a proxy could not reach the backend
  if (status === 502 || status === 503 || status === 504) {
    return 'serverUnavailable'
  }
  return 'unknown'
}
