// The small scene shared by the three pictures of "Three steps, one result":
// a mini counting tray seen from above. Step 1 picks how it is seen (camera,
// photo, video), step 2 moves the counting area, step 3 shows the result.
// Units are the SVG viewBox (320 × 220), the same size as the area vignette.
import { isPillInside, type AreaLimits, type Pill, type Quad, type TrayFloor } from './trayScene'

export type DemoMode = 'camera' | 'image' | 'video'

export const DEMO_MODES: DemoMode[] = ['camera', 'image', 'video']

export const SCENE_WIDTH = 320
export const SCENE_HEIGHT = 220

// Bronze body of the tray and its lighter floor
export const SCENE_BODY = { x: 4, y: 4, width: 312, height: 212, radius: 14 }
export const SCENE_FLOOR: TrayFloor = { x: 12, y: 12, width: 296, height: 196, radius: 8 }

// The corners can move anywhere on the floor
export const SCENE_LIMITS: AreaLimits = { left: 14, top: 14, right: 306, bottom: 206 }

// At the start the area is a neat rectangle around the pile;
// two pills lie outside it on the left
export const SCENE_DEFAULT_QUAD: Quad = [
  { x: 70, y: 24 },
  { x: 300, y: 24 },
  { x: 300, y: 196 },
  { x: 70, y: 196 },
]

// Each pill carries the confidence score the model "gave" it (shown in step 3)
export interface ScoredPill extends Pill {
  score: number
}

export const SCENE_PILLS: ScoredPill[] = [
  { id: 1, x: 100, y: 52, kind: 'tablet', rotation: 0, score: 0.97 },
  { id: 2, x: 152, y: 48, kind: 'capsule', rotation: 25, score: 0.94 },
  { id: 3, x: 206, y: 58, kind: 'tablet', rotation: 0, score: 0.98 },
  { id: 4, x: 262, y: 50, kind: 'tablet', rotation: 0, score: 0.91 },
  { id: 5, x: 116, y: 110, kind: 'capsule', rotation: -35, score: 0.88 },
  { id: 6, x: 174, y: 106, kind: 'tablet', rotation: 0, score: 0.96 },
  { id: 7, x: 232, y: 116, kind: 'capsule', rotation: 60, score: 0.83 },
  { id: 8, x: 280, y: 104, kind: 'tablet', rotation: 0, score: 0.95 },
  { id: 9, x: 106, y: 166, kind: 'tablet', rotation: 0, score: 0.92 },
  { id: 10, x: 166, y: 162, kind: 'tablet', rotation: 0, score: 0.99 },
  { id: 11, x: 226, y: 170, kind: 'capsule', rotation: -10, score: 0.86 },
  { id: 12, x: 280, y: 166, kind: 'tablet', rotation: 0, score: 0.93 },
  // Outside the default area, on the left
  { id: 13, x: 38, y: 76, kind: 'tablet', rotation: 0, score: 0.95 },
  { id: 14, x: 40, y: 150, kind: 'capsule', rotation: 90, score: 0.9 },
]

// The pills whose center is inside the area, in reading order (as listed)
export function pillsInside(quad: Quad): ScoredPill[] {
  const inside: ScoredPill[] = []
  for (const pill of SCENE_PILLS) {
    if (isPillInside(pill, quad)) {
      inside.push(pill)
    }
  }
  return inside
}
