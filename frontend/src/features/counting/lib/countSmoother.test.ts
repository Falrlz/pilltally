import { describe, expect, it } from 'vitest'
import { addRecentCount, mostFrequentCount } from './countSmoother'

describe('mostFrequentCount', () => {
  it('is 0 without counts', () => {
    expect(mostFrequentCount([])).toBe(0)
  })

  it('ignores one wrong round', () => {
    expect(mostFrequentCount([12, 12, 11, 12, 12])).toBe(12)
    expect(mostFrequentCount([12, 12, 13, 12, 12])).toBe(12)
  })

  it('follows a real change once it appears most often', () => {
    expect(mostFrequentCount([12, 12, 13, 13])).toBe(13) // tie: the newer count wins
    expect(mostFrequentCount([12, 13, 13, 13, 12])).toBe(13)
  })

  it('picks the newer count on a tie', () => {
    expect(mostFrequentCount([5, 6])).toBe(6)
    expect(mostFrequentCount([6, 5])).toBe(5)
  })
})

describe('addRecentCount', () => {
  it('keeps only the last counts', () => {
    expect(addRecentCount([1, 2, 3], 4, 3)).toEqual([2, 3, 4])
  })

  it('does not change the old list', () => {
    const old = [1, 2]
    addRecentCount(old, 3, 2)
    expect(old).toEqual([1, 2])
  })
})
