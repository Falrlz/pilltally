import { describe, expect, it } from 'vitest'
import {
  LOOP_INTRO_MS,
  LOOP_ROUND_MS,
  LOOP_START_QUAD,
  LOOP_STEPS,
  loopFrame,
  mixQuad,
  VIGNETTE_PILLS,
} from './areaLoop'
import { countInside, type Quad } from './trayScene'

// The time at which step `index` has finished moving (it is now holding)
function holdTimeOfStep(index: number): number {
  let time = LOOP_INTRO_MS
  for (let i = 0; i < index; i++) {
    time += LOOP_STEPS[i].moveMs + LOOP_STEPS[i].holdMs
  }
  return time + LOOP_STEPS[index].moveMs + 1
}

describe('loop steps', () => {
  it('leave one stray pill out per pull, then spring back to all 10', () => {
    expect(countInside(VIGNETTE_PILLS, LOOP_START_QUAD)).toBe(10)
    const counts = LOOP_STEPS.map((step) => countInside(VIGNETTE_PILLS, step.to))
    expect(counts).toEqual([9, 8, 7, 7, 10])
  })
})

describe('loopFrame', () => {
  const OTHER: Quad = [
    { x: 20, y: 20 },
    { x: 60, y: 20 },
    { x: 60, y: 60 },
    { x: 20, y: 60 },
  ]

  it('starts at the given area and glides to the start of the round', () => {
    expect(loopFrame(0, OTHER).quad).toEqual(OTHER)
    expect(loopFrame(LOOP_INTRO_MS, OTHER).quad).toEqual(LOOP_START_QUAD)
  })

  it('shows the hand pressing while it drags, released while holding', () => {
    const dragging = loopFrame(LOOP_INTRO_MS + 400, LOOP_START_QUAD)
    expect(dragging.corner).toBe(0)
    expect(dragging.isPressed).toBe(true)

    const holding = loopFrame(holdTimeOfStep(0), LOOP_START_QUAD)
    expect(holding.quad).toEqual(LOOP_STEPS[0].to)
    expect(holding.isPressed).toBe(false)
  })

  it('shows no hand while the area springs back', () => {
    const last = LOOP_STEPS.length - 1
    const frame = loopFrame(holdTimeOfStep(last) - 200, LOOP_START_QUAD)
    expect(frame.corner).toBeNull()
  })

  it('repeats every round', () => {
    const time = LOOP_INTRO_MS + 1234
    expect(loopFrame(time + LOOP_ROUND_MS, LOOP_START_QUAD)).toEqual(loopFrame(time, LOOP_START_QUAD))
  })
})

describe('mixQuad', () => {
  it('is halfway at 0.5', () => {
    const from: Quad = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    const to: Quad = [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
      { x: 10, y: 20 },
    ]
    expect(mixQuad(from, to, 0.5)[0]).toEqual({ x: 5, y: 5 })
  })
})
