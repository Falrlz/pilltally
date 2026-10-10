// From raw model output to pill boxes, the same as backend/app/services/predictor.py.
// Kept equal to Python by the parity test (postprocess.test.ts + fixtures/parity.json).

import type { Box } from '@/services/types'
import type { LetterboxInfo } from './letterbox'

// Same values as Ultralytics predict (used during evaluation)
export const IOU_THRESHOLD = 0.7
export const MAX_DETECTIONS = 300

// The model output has 5 rows: cx, cy, w, h, score
const OUTPUT_ROWS = 5

// The part of the original image that was given to the model
export interface Region {
  offsetX: number
  offsetY: number
  width: number
  height: number
}

/**
 * Turn the raw model output into boxes with score >= confThreshold.
 *
 * output is the flat data of the [1, 5, N] tensor: first N center x values,
 * then N center y, N widths, N heights and N scores (letterbox pixels).
 */
export function decodeOutput(output: Float32Array, confThreshold: number): Box[] {
  const candidateCount = output.length / OUTPUT_ROWS
  const boxes: Box[] = []

  for (let i = 0; i < candidateCount; i++) {
    const score = output[4 * candidateCount + i]
    // Same rule as ml/src/evaluation/evaluate.py count_boxes
    if (score < confThreshold) {
      continue
    }

    const centerX = output[i]
    const centerY = output[candidateCount + i]
    const halfWidth = output[2 * candidateCount + i] / 2
    const halfHeight = output[3 * candidateCount + i] / 2
    boxes.push({
      x1: centerX - halfWidth,
      y1: centerY - halfHeight,
      x2: centerX + halfWidth,
      y2: centerY + halfHeight,
      score,
    })
  }
  return boxes
}

// Intersection over union of two boxes (0 = no overlap, 1 = same box)
export function boxIou(a: Box, b: Box): number {
  const interWidth = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)
  const interHeight = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1)
  if (interWidth <= 0 || interHeight <= 0) {
    return 0
  }

  const intersection = interWidth * interHeight
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1)
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1)
  return intersection / (areaA + areaB - intersection)
}

/**
 * Non-maximum suppression: when boxes overlap too much, keep the best one.
 *
 * Boxes are checked from the highest score down. A box is kept only if its
 * IoU with every already kept box is <= iouThreshold.
 */
export function nms(boxes: Box[], iouThreshold: number, maxDetections: number): Box[] {
  // Copy first: sort() changes the array it is called on
  const sortedBoxes = [...boxes].sort((a, b) => b.score - a.score)

  const kept: Box[] = []
  for (const box of sortedBoxes) {
    let overlaps = false
    for (const keptBox of kept) {
      if (boxIou(box, keptBox) > iouThreshold) {
        overlaps = true
        break
      }
    }

    if (!overlaps) {
      kept.push(box)
    }
    if (kept.length === maxDetections) {
      break
    }
  }
  return kept
}

// Keep a value between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Map a box from letterbox pixels back to the original image
export function toOriginal(box: Box, info: LetterboxInfo, region: Region): Box {
  // Undo the padding and the resize -> pixels of the region, kept inside it
  const x1 = clamp((box.x1 - info.padLeft) / info.scale, 0, region.width)
  const y1 = clamp((box.y1 - info.padTop) / info.scale, 0, region.height)
  const x2 = clamp((box.x2 - info.padLeft) / info.scale, 0, region.width)
  const y2 = clamp((box.y2 - info.padTop) / info.scale, 0, region.height)

  // Region pixels -> original image pixels
  return {
    x1: x1 + region.offsetX,
    y1: y1 + region.offsetY,
    x2: x2 + region.offsetX,
    y2: y2 + region.offsetY,
    score: box.score,
  }
}

/**
 * All steps after the model: score filter -> NMS -> original image pixels.
 * (Filtering by the counting area is done by the caller with boxCenterInside.)
 */
export function postprocess(
  output: Float32Array,
  info: LetterboxInfo,
  region: Region,
  confThreshold: number,
): Box[] {
  const candidates = decodeOutput(output, confThreshold)
  const keptBoxes = nms(candidates, IOU_THRESHOLD, MAX_DETECTIONS)

  const originalBoxes: Box[] = []
  for (const box of keptBoxes) {
    originalBoxes.push(toOriginal(box, info, region))
  }
  return originalBoxes
}
