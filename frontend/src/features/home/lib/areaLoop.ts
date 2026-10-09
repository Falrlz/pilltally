// The looping demo of the "counting area" section: a work table seen from
// above, with a dark counting mat, a spilled pill bottle, a counting spatula,
// a coin and a pine sprig. A few pills rolled off the mat. The area starts
// over the whole table (every pill counted), then an invisible hand drags
// the corners in one by one, leaving the stray pills outside, so they are
// ignored. Then the area springs back and it starts again.
// Units are the SVG viewBox (360 × 240). Pure functions, so they can be tested.
import type { Pill, Point, Quad } from './trayScene'

export const VIGNETTE_WIDTH = 360
export const VIGNETTE_HEIGHT = 240

// The mat lies a little crooked: its center, size and turn (degrees)
export const MAT = { x: 180, y: 122, width: 210, height: 140, rotation: -4 }

export const VIGNETTE_PILLS: Pill[] = [
  // On the mat
  { id: 1, x: 118, y: 92, kind: 'tablet', rotation: 0 },
  { id: 2, x: 152, y: 136, kind: 'capsule', rotation: 25 },
  { id: 3, x: 186, y: 88, kind: 'tablet', rotation: 0 },
  { id: 4, x: 214, y: 146, kind: 'tablet', rotation: 0 },
  { id: 5, x: 248, y: 104, kind: 'capsule', rotation: -35 },
  { id: 6, x: 124, y: 160, kind: 'tablet', rotation: 0 },
  { id: 7, x: 184, y: 170, kind: 'capsule', rotation: 80 },
  // Rolled off the mat: out of the bottle, near the sprig, near the spatula
  { id: 8, x: 88, y: 34, kind: 'tablet', rotation: 0 },
  { id: 9, x: 322, y: 92, kind: 'capsule', rotation: 15 },
  { id: 10, x: 296, y: 206, kind: 'tablet', rotation: 0 },
]

// Where the area starts (and springs back to): the whole table, all 10 pills
export const LOOP_START_QUAD: Quad = [
  { x: 14, y: 14 },
  { x: 346, y: 14 },
  { x: 336, y: 214 },
  { x: 16, y: 214 },
]

export interface LoopStep {
  // The corner the hand drags (0–3, order of the quad), or null when the
  // whole area springs back by itself
  corner: number | null
  // The area at the end of the step
  to: Quad
  moveMs: number
  // Pause after the move, so the reader sees the new count
  holdMs: number
}

const MOVE_MS = 1100
const HOLD_MS = 800

// One round: each corner is pulled in to the mat (one stray pill left out
// each time, the last pull only tidies the area around the mat), then the
// area springs back to the whole table
export const LOOP_STEPS: LoopStep[] = [
  {
    corner: 0,
    to: [{ x: 64, y: 58 }, { x: 346, y: 14 }, { x: 336, y: 214 }, { x: 16, y: 214 }],
    moveMs: MOVE_MS,
    holdMs: HOLD_MS,
  },
  {
    corner: 1,
    to: [{ x: 64, y: 58 }, { x: 286, y: 40 }, { x: 336, y: 214 }, { x: 16, y: 214 }],
    moveMs: MOVE_MS,
    holdMs: HOLD_MS,
  },
  {
    corner: 2,
    to: [{ x: 64, y: 58 }, { x: 286, y: 40 }, { x: 296, y: 192 }, { x: 16, y: 214 }],
    moveMs: MOVE_MS,
    holdMs: HOLD_MS,
  },
  {
    corner: 3,
    to: [{ x: 64, y: 58 }, { x: 286, y: 40 }, { x: 296, y: 192 }, { x: 76, y: 204 }],
    moveMs: MOVE_MS,
    holdMs: 1400,
  },
  { corner: null, to: LOOP_START_QUAD, moveMs: 900, holdMs: 1600 },
]

// Before the round starts, the area glides from wherever it is to the start
export const LOOP_INTRO_MS = 700

export const LOOP_ROUND_MS = LOOP_STEPS.reduce((total, step) => total + step.moveMs + step.holdMs, 0)

export interface LoopFrame {
  quad: Quad
  // The corner under the hand, or null when no hand is shown
  corner: number | null
  // True while the hand holds the corner down and drags it
  isPressed: boolean
}

// Slow start, slow end, like a hand dragging something
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function mixPoint(from: Point, to: Point, amount: number): Point {
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount }
}

export function mixQuad(from: Quad, to: Quad, amount: number): Quad {
  return [
    mixPoint(from[0], to[0], amount),
    mixPoint(from[1], to[1], amount),
    mixPoint(from[2], to[2], amount),
    mixPoint(from[3], to[3], amount),
  ]
}

// What the demo shows `elapsedMs` after it (re)started from `startQuad`
export function loopFrame(elapsedMs: number, startQuad: Quad): LoopFrame {
  // First: glide from the starting area to the start of the round
  if (elapsedMs < LOOP_INTRO_MS) {
    const amount = easeInOut(elapsedMs / LOOP_INTRO_MS)
    return { quad: mixQuad(startQuad, LOOP_START_QUAD, amount), corner: null, isPressed: false }
  }

  // Then the round, again and again
  let timeInRound = (elapsedMs - LOOP_INTRO_MS) % LOOP_ROUND_MS
  let from = LOOP_START_QUAD

  for (const step of LOOP_STEPS) {
    if (timeInRound < step.moveMs) {
      const amount = easeInOut(timeInRound / step.moveMs)
      return { quad: mixQuad(from, step.to, amount), corner: step.corner, isPressed: step.corner !== null }
    }
    timeInRound -= step.moveMs

    if (timeInRound < step.holdMs) {
      return { quad: step.to, corner: step.corner, isPressed: false }
    }
    timeInRound -= step.holdMs

    from = step.to
  }

  // Not reached (the round time is the sum of all steps), kept for safety
  return { quad: LOOP_START_QUAD, corner: null, isPressed: false }
}
