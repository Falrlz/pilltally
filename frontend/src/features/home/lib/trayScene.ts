// The illustrated counting tray on Home: where the pills lie, the 4-point
// counting area, and which pills are counted. Seen from above, like the camera.
// Units are the SVG viewBox (600 × 420).

export type PillKind = 'tablet' | 'capsule'

export interface Pill {
  id: number
  x: number // center
  y: number // center
  kind: PillKind
  rotation: number // degrees, only used by capsules
}

export interface Point {
  x: number
  y: number
}

// The counting area: 4 corners in order top-left, top-right, bottom-right, bottom-left
export type Quad = [Point, Point, Point, Point]

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export const VIEW_WIDTH = 600
export const VIEW_HEIGHT = 420

// The floor of the tray (inside its bronze rim); the veil outside the area covers only this
export const TRAY_FLOOR = { x: 34, y: 34, width: 532, height: 352, radius: 12 }

// The corners can move anywhere on the tray
export const AREA_LIMITS = { left: 24, top: 24, right: 576, bottom: 396 }

// At the start the area is a neat rectangle around the pile;
// three pills wait in the tray's channel outside it
export const DEFAULT_QUAD: Quad = [
  { x: 150, y: 62 },
  { x: 550, y: 62 },
  { x: 550, y: 358 },
  { x: 150, y: 358 },
]

// Size of a drawn pill (seen from above a tablet is round)
export const TABLET_RADIUS = 13
export const CAPSULE_LENGTH = 36
export const CAPSULE_WIDTH = 14

// Space between a pill and its detection box
const BOX_PADDING = 3

export const PILLS: Pill[] = [
  // The pile on the tray floor
  { id: 1, x: 200, y: 110, kind: 'tablet', rotation: 0 },
  { id: 2, x: 258, y: 98, kind: 'capsule', rotation: 20 },
  { id: 3, x: 318, y: 120, kind: 'tablet', rotation: 0 },
  { id: 4, x: 380, y: 96, kind: 'tablet', rotation: 0 },
  { id: 5, x: 440, y: 118, kind: 'capsule', rotation: -30 },
  { id: 6, x: 500, y: 110, kind: 'tablet', rotation: 0 },
  { id: 7, x: 222, y: 170, kind: 'capsule', rotation: -10 },
  { id: 8, x: 286, y: 180, kind: 'tablet', rotation: 0 },
  { id: 9, x: 350, y: 168, kind: 'tablet', rotation: 0 },
  { id: 10, x: 412, y: 182, kind: 'capsule', rotation: 45 },
  { id: 11, x: 478, y: 170, kind: 'tablet', rotation: 0 },
  { id: 12, x: 205, y: 240, kind: 'tablet', rotation: 0 },
  { id: 13, x: 268, y: 250, kind: 'tablet', rotation: 0 },
  { id: 14, x: 334, y: 236, kind: 'capsule', rotation: 70 },
  { id: 15, x: 398, y: 252, kind: 'tablet', rotation: 0 },
  { id: 16, x: 462, y: 240, kind: 'tablet', rotation: 0 },
  { id: 17, x: 520, y: 262, kind: 'capsule', rotation: -15 },
  { id: 18, x: 240, y: 310, kind: 'tablet', rotation: 0 },
  { id: 19, x: 310, y: 318, kind: 'capsule', rotation: 5 },
  { id: 20, x: 380, y: 312, kind: 'tablet', rotation: 0 },
  { id: 21, x: 448, y: 316, kind: 'tablet', rotation: 0 },
  // In the channel on the left, outside the default area
  { id: 22, x: 80, y: 120, kind: 'tablet', rotation: 0 },
  { id: 23, x: 78, y: 210, kind: 'capsule', rotation: 90 },
  { id: 24, x: 82, y: 300, kind: 'tablet', rotation: 0 },
]

// The detection box around one pill (its bounding box plus some space)
export function pillBox(pill: Pill): Box {
  let halfWidth = TABLET_RADIUS
  let halfHeight = TABLET_RADIUS

  if (pill.kind === 'capsule') {
    // Bounding box of a rotated rectangle
    const angle = (pill.rotation * Math.PI) / 180
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))
    halfWidth = (CAPSULE_LENGTH * cos + CAPSULE_WIDTH * sin) / 2
    halfHeight = (CAPSULE_LENGTH * sin + CAPSULE_WIDTH * cos) / 2
  }

  return {
    x: pill.x - halfWidth - BOX_PADDING,
    y: pill.y - halfHeight - BOX_PADDING,
    width: (halfWidth + BOX_PADDING) * 2,
    height: (halfHeight + BOX_PADDING) * 2,
  }
}

// Is the point inside the polygon? Count how many edges a ray to the right crosses:
// an odd number means inside (ray casting)
export function isPointInside(point: Point, polygon: Point[]): boolean {
  let inside = false

  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index]
    const previous = polygon[(index + polygon.length - 1) % polygon.length]

    const edgeCrossesRow = current.y > point.y !== previous.y > point.y
    if (edgeCrossesRow) {
      // x where this edge crosses the horizontal line through the point
      const crossX = previous.x + ((point.y - previous.y) / (current.y - previous.y)) * (current.x - previous.x)
      if (point.x < crossX) {
        inside = !inside
      }
    }
  }

  return inside
}

// Same rule as the real app: a pill counts when its center is inside the area
export function isPillInside(pill: Pill, quad: Quad): boolean {
  return isPointInside({ x: pill.x, y: pill.y }, quad)
}

export function countInside(pills: Pill[], quad: Quad): number {
  let count = 0
  for (const pill of pills) {
    if (isPillInside(pill, quad)) {
      count += 1
    }
  }
  return count
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Move corner number `corner` (0–3) to (x, y), kept on the tray
export function moveCorner(quad: Quad, corner: number, x: number, y: number): Quad {
  const moved: Quad = [...quad]
  moved[corner] = {
    x: clamp(x, AREA_LIMITS.left, AREA_LIMITS.right),
    y: clamp(y, AREA_LIMITS.top, AREA_LIMITS.bottom),
  }
  return moved
}

// SVG path of the area outline: "M x y L x y L x y L x y Z"
export function quadPath(quad: Quad): string {
  const parts: string[] = []
  for (const point of quad) {
    parts.push(`${point.x} ${point.y}`)
  }
  return `M${parts.join(' L')} Z`
}
