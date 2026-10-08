import { describe, expect, it } from 'vitest'
import { getArrowKeyIndex } from './arrowKeys'

describe('getArrowKeyIndex', () => {
  it('moves to the next option', () => {
    expect(getArrowKeyIndex('ArrowRight', 0, 3)).toBe(1)
    expect(getArrowKeyIndex('ArrowDown', 1, 3)).toBe(2)
  })

  it('moves to the previous option', () => {
    expect(getArrowKeyIndex('ArrowLeft', 2, 3)).toBe(1)
    expect(getArrowKeyIndex('ArrowUp', 1, 3)).toBe(0)
  })

  it('wraps around at both ends', () => {
    expect(getArrowKeyIndex('ArrowRight', 2, 3)).toBe(0)
    expect(getArrowKeyIndex('ArrowLeft', 0, 3)).toBe(2)
  })

  it('ignores other keys', () => {
    expect(getArrowKeyIndex('Enter', 0, 3)).toBeNull()
  })
})
