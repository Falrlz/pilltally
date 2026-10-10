import { describe, expect, it } from 'vitest'
import {
  AREA_LIMITS,
  countInside,
  DEFAULT_QUAD,
  isPointInside,
  moveCorner,
  pillBox,
  PILLS,
  quadPath,
  type Pill,
  type Quad,
} from './trayScene'

const WHOLE_TRAY: Quad = [
  { x: AREA_LIMITS.left, y: AREA_LIMITS.top },
  { x: AREA_LIMITS.right, y: AREA_LIMITS.top },
  { x: AREA_LIMITS.right, y: AREA_LIMITS.bottom },
  { x: AREA_LIMITS.left, y: AREA_LIMITS.bottom },
]

describe('countInside', () => {
  it('counts the 21 pills of the pile with the default area', () => {
    expect(countInside(PILLS, DEFAULT_QUAD)).toBe(21)
  })

  it('counts all 24 pills when the area covers the whole tray', () => {
    expect(countInside(PILLS, WHOLE_TRAY)).toBe(24)
  })
})

describe('isPointInside', () => {
  // A slanted shape, like a dragged area
  const slanted = [
    { x: 0, y: 0 },
    { x: 100, y: 20 },
    { x: 80, y: 100 },
    { x: 10, y: 90 },
  ]

  it('finds points inside a slanted quadrilateral', () => {
    expect(isPointInside({ x: 50, y: 50 }, slanted)).toBe(true)
  })

  it('finds points outside it, also near a slanted edge', () => {
    expect(isPointInside({ x: 95, y: 90 }, slanted)).toBe(false)
    expect(isPointInside({ x: 60, y: 5 }, slanted)).toBe(false)
  })
})

describe('pillBox', () => {
  it('surrounds a round tablet with some space', () => {
    const tablet: Pill = { id: 1, x: 100, y: 50, kind: 'tablet', rotation: 0 }
    expect(pillBox(tablet)).toEqual({ x: 84, y: 34, width: 32, height: 32 })
  })

  it('turns with a rotated capsule', () => {
    const flat: Pill = { id: 1, x: 0, y: 0, kind: 'capsule', rotation: 0 }
    const upright: Pill = { id: 2, x: 0, y: 0, kind: 'capsule', rotation: 90 }
    expect(pillBox(flat).width).toBeCloseTo(42)
    expect(pillBox(upright).height).toBeCloseTo(42)
  })
})

describe('moveCorner', () => {
  it('moves only the chosen corner', () => {
    const moved = moveCorner(DEFAULT_QUAD, 1, 500, 60)
    expect(moved[1]).toEqual({ x: 500, y: 60 })
    expect(moved[0]).toEqual(DEFAULT_QUAD[0])
    expect(moved[2]).toEqual(DEFAULT_QUAD[2])
  })

  it('keeps the corner on the tray', () => {
    const moved = moveCorner(DEFAULT_QUAD, 3, -50, 999)
    expect(moved[3]).toEqual({ x: AREA_LIMITS.left, y: AREA_LIMITS.bottom })
  })

  it('takes in the channel pills when the left corners move out', () => {
    let quad = moveCorner(DEFAULT_QUAD, 0, 40, 62)
    quad = moveCorner(quad, 3, 40, 358)
    expect(countInside(PILLS, quad)).toBe(24)
  })

  it('does not change the original area', () => {
    moveCorner(DEFAULT_QUAD, 0, 0, 0)
    expect(DEFAULT_QUAD[0]).toEqual({ x: 150, y: 62 })
  })
})

describe('quadPath', () => {
  it('joins the 4 corners into a closed path', () => {
    expect(quadPath(WHOLE_TRAY)).toBe('M24 24 L576 24 L576 396 L24 396 Z')
  })
})
