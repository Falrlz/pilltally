// Geometry for the counting area, the same as backend/app/services/predictor.py

import type { Box } from '@/services/types'

// A point (x, y) in image pixels
export type Point = [number, number]

/**
 * True if point (x, y) is inside the polygon.
 *
 * Ray casting: draw a line from the point to the right and count how many
 * polygon edges it crosses. Odd = inside, even = outside.
 */
export function pointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false
  const count = polygon.length
  for (let i = 0; i < count; i++) {
    const [xA, yA] = polygon[i]
    const [xB, yB] = polygon[(i + 1) % count]

    // Does the edge cross the horizontal line through y?
    if (yA > y !== yB > y) {
      // x where the edge crosses that line
      const xCross = xA + ((y - yA) * (xB - xA)) / (yB - yA)
      if (x < xCross) {
        inside = !inside
      }
    }
  }
  return inside
}

// True if the center of the box is inside the polygon
export function boxCenterInside(box: Box, polygon: Point[]): boolean {
  const centerX = (box.x1 + box.x2) / 2
  const centerY = (box.y1 + box.y2) / 2
  return pointInPolygon(centerX, centerY, polygon)
}
