import { describe, expect, it } from 'vitest'
import { boxCenterInside, pointInPolygon, type Point } from './geometry'

const SQUARE: Point[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
]
const DIAMOND: Point[] = [
  [5, 0],
  [10, 5],
  [5, 10],
  [0, 5],
]

describe('pointInPolygon', () => {
  it('finds points inside and outside a square', () => {
    expect(pointInPolygon(5, 5, SQUARE)).toBe(true)
    expect(pointInPolygon(15, 5, SQUARE)).toBe(false)
  })

  it('treats the corner of a diamond bounding box as outside', () => {
    expect(pointInPolygon(5, 5, DIAMOND)).toBe(true)
    expect(pointInPolygon(1, 1, DIAMOND)).toBe(false)
  })
})

describe('boxCenterInside', () => {
  it('uses the center of the box, even if the box sticks out', () => {
    // Center (9, 5) is inside the square
    const box = { x1: 7, y1: 4, x2: 11, y2: 6, score: 0.9 }
    expect(boxCenterInside(box, SQUARE)).toBe(true)
  })
})
