import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { predictImage } from '@/services/api'
import type { PredictResponse } from '@/services/types'
import { toPixels, type AreaPoint } from '../lib/countingArea'
import { getPredictErrorKind, type PredictErrorKind } from '../lib/predictError'
import { resizeImage } from '../lib/resizeImage'

// The shown image: a temporary browser URL of the resized photo + its size
export interface ShownImage {
  url: string
  width: number
  height: number
}

export type ImageCountState =
  | { status: 'idle' }
  | { status: 'processing'; image: ShownImage | null }
  // usedArea: the counting area of this result (null = whole image)
  | { status: 'success'; image: ShownImage; result: PredictResponse; usedArea: AreaPoint[] | null }
  | { status: 'error'; errorKind: PredictErrorKind | 'unreadableFile' }

/**
 * Count the pills in an image file:
 * 1. make it smaller in the browser (lib/resizeImage.ts)
 * 2. send it to the backend (POST /api/v1/predict), with the counting area if on
 * 3. keep the result to show the image, boxes and count
 *
 * The boxes are in pixels of the resized image, which is also the image shown.
 * recount() sends the same image again, e.g. after the area was changed.
 */
export function useImageCount() {
  const [state, setState] = useState<ImageCountState>({ status: 'idle' })
  // Number of the latest request, so an older answer cannot replace a newer one
  const latestRequestRef = useRef(0)
  // The resized image now on screen (kept for recount) and its URL
  const imageRef = useRef<{ blob: Blob; shown: ShownImage } | null>(null)

  function replaceImage(newImage: { blob: Blob; shown: ShownImage } | null) {
    if (imageRef.current !== null) {
      URL.revokeObjectURL(imageRef.current.shown.url)
    }
    imageRef.current = newImage
  }

  // Free the last image URL when the component disappears
  useEffect(() => {
    return () => replaceImage(null)
  }, [])

  // Send the kept image to the backend
  async function sendImage(requestNumber: number, area: AreaPoint[] | null) {
    const kept = imageRef.current
    if (kept === null) {
      return
    }
    setState({ status: 'processing', image: kept.shown })

    try {
      const areaPixels = area === null ? null : toPixels(area, kept.shown.width, kept.shown.height)
      const result = await predictImage(kept.blob, areaPixels)
      if (requestNumber === latestRequestRef.current) {
        setState({ status: 'success', image: kept.shown, result, usedArea: area })
      }
    } catch (error) {
      if (requestNumber === latestRequestRef.current) {
        const status = isAxiosError(error) ? error.response?.status : undefined
        setState({ status: 'error', errorKind: getPredictErrorKind(status) })
      }
    }
  }

  async function countImage(file: File, area: AreaPoint[] | null) {
    latestRequestRef.current += 1
    const requestNumber = latestRequestRef.current
    replaceImage(null)
    setState({ status: 'processing', image: null })

    // 1. Make the image smaller
    let resized
    try {
      resized = await resizeImage(file)
    } catch {
      if (requestNumber === latestRequestRef.current) {
        setState({ status: 'error', errorKind: 'unreadableFile' })
      }
      return
    }
    if (requestNumber !== latestRequestRef.current) {
      return
    }
    const shown = { url: URL.createObjectURL(resized.blob), width: resized.width, height: resized.height }
    replaceImage({ blob: resized.blob, shown })

    // 2. Send it to the backend
    await sendImage(requestNumber, area)
  }

  // Count the same image again (e.g. with a new counting area)
  async function recount(area: AreaPoint[] | null) {
    latestRequestRef.current += 1
    await sendImage(latestRequestRef.current, area)
  }

  // Back to the start ("Another image")
  function reset() {
    latestRequestRef.current += 1
    replaceImage(null)
    setState({ status: 'idle' })
  }

  return { state, countImage, recount, reset }
}
