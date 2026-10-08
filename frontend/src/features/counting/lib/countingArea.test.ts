import { describe, expect, it } from 'vitest'
import { boundingRect, clampAreaPoint, DEFAULT_AREA, toPixels } from './countingArea'

describe('clampAreaPoint', () => {
  it('keeps points inside the picture', () => {
    expect(clampAreaPoint([-0.2, 1.5])).toEqual([0, 1])
    expect(clampAreaPoint([0.3, 0.7])).toEqual([0.3, 0.7])
  })
})

describe('toPixels', () => {
  it('turns fractions into frame pixels', () => {
    expect(toPixels(DEFAULT_AREA, 1000, 500)).toEqual([
      [200, 100],
      [800, 100],
      [800, 400],
      [200, 400],
    ])
  })
})

describe('boundingRect', () => {
  it('rounds outwards like the backend (left/top down, right/bottom up)', () => {
    const points: [number, number][] = [
      [10.7, 20.2],
      [60.1, 20.9],
      [60.4, 70.5],
      [10.2, 70.1],
    ]
    expect(boundingRect(points, 100, 100)).toEqual({ x: 10, y: 20, width: 51, height: 51 })
  })

  it('stays inside the frame', () => {
    const points: [number, number][] = [
      [-5, -5],
      [120, 0],
      [120, 80],
      [0, 80],
    ]
    expect(boundingRect(points, 100, 100)).toEqual({ x: 0, y: 0, width: 100, height: 80 })
  })
})
