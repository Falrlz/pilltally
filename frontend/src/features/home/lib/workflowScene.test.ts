import { describe, expect, it } from 'vitest'
import { moveCorner, pillBox, type Quad } from './trayScene'
import { pillsInside, SCENE_DEFAULT_QUAD, SCENE_FLOOR, SCENE_LIMITS, SCENE_PILLS } from './workflowScene'

const WHOLE_FLOOR: Quad = [
  { x: SCENE_LIMITS.left, y: SCENE_LIMITS.top },
  { x: SCENE_LIMITS.right, y: SCENE_LIMITS.top },
  { x: SCENE_LIMITS.right, y: SCENE_LIMITS.bottom },
  { x: SCENE_LIMITS.left, y: SCENE_LIMITS.bottom },
]

describe('pillsInside', () => {
  it('finds the 12 pills of the pile with the default area', () => {
    expect(pillsInside(SCENE_DEFAULT_QUAD)).toHaveLength(12)
  })

  it('finds all 14 pills when the area covers the whole floor', () => {
    expect(pillsInside(WHOLE_FLOOR)).toHaveLength(14)
  })

  it('keeps the order of the pill list', () => {
    const ids = pillsInside(SCENE_DEFAULT_QUAD).map((pill) => pill.id)
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })
})

describe('scene pills', () => {
  it('all lie fully on the floor', () => {
    for (const pill of SCENE_PILLS) {
      const box = pillBox(pill)
      expect(box.x).toBeGreaterThanOrEqual(SCENE_FLOOR.x)
      expect(box.y).toBeGreaterThanOrEqual(SCENE_FLOOR.y)
      expect(box.x + box.width).toBeLessThanOrEqual(SCENE_FLOOR.x + SCENE_FLOOR.width)
      expect(box.y + box.height).toBeLessThanOrEqual(SCENE_FLOOR.y + SCENE_FLOOR.height)
    }
  })

  it('all have a score between 0 and 1', () => {
    for (const pill of SCENE_PILLS) {
      expect(pill.score).toBeGreaterThan(0)
      expect(pill.score).toBeLessThanOrEqual(1)
    }
  })
})

describe('moveCorner with the scene limits', () => {
  it('keeps a corner on the floor', () => {
    const moved = moveCorner(SCENE_DEFAULT_QUAD, 0, -50, 999, SCENE_LIMITS)
    expect(moved[0]).toEqual({ x: SCENE_LIMITS.left, y: SCENE_LIMITS.bottom })
  })
})
