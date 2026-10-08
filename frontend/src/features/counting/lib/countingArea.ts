/**
 * The counting area: 4 points the user drags (docs/web_app.md section 6).
 *
 * Points are stored as fractions of the picture (0 = left/top, 1 = right/bottom),
 * so the same area works for any image, video or camera size.
 * Before use they are turned into pixels of the frame (toPixels).
 */

import type { Point } from './geometry'

// A point as fractions of the picture: [0.5, 0.5] is the center
export type AreaPoint = [number, number]

// Pixel rectangle inside a frame
export interface PixelRect {
  x: number
  y: number
  width: number
  height: number
}

// The starting area: a square-ish shape in the middle (top-left, top-right, bottom-right, bottom-left)
export const DEFAULT_AREA: AreaPoint[] = [
  [0.2, 0.2],
  [0.8, 0.2],
  [0.8, 0.8],
  [0.2, 0.8],
]

// Keep a point inside the picture
export function clampAreaPoint(point: AreaPoint): AreaPoint {
  const x = Math.min(Math.max(point[0], 0), 1)
  const y = Math.min(Math.max(point[1], 0), 1)
  return [x, y]
}

// Fractions -> pixels of a frame of width x height
export function toPixels(area: AreaPoint[], width: number, height: number): Point[] {
  const points: Point[] = []
  for (const [x, y] of area) {
    points.push([x * width, y * height])
  }
  return points
}

/**
 * The smallest pixel rectangle around the points, inside the frame.
 * Same rounding as backend apply_area: left/top rounded down, right/bottom up.
 */
export function boundingRect(points: Point[], frameWidth: number, frameHeight: number): PixelRect {
  const xs: number[] = []
  const ys: number[] = []
  for (const [x, y] of points) {
    xs.push(x)
    ys.push(y)
  }

  const left = Math.max(0, Math.floor(Math.min(...xs)))
  const top = Math.max(0, Math.floor(Math.min(...ys)))
  const right = Math.min(frameWidth, Math.ceil(Math.max(...xs)))
  const bottom = Math.min(frameHeight, Math.ceil(Math.max(...ys)))

  return { x: left, y: top, width: right - left, height: bottom - top }
}
