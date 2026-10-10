import { describe, expect, it } from 'vitest'
import { fitSize } from './resizeImage'

describe('fitSize', () => {
  it('shrinks a landscape photo to 1280 on the long side', () => {
    expect(fitSize(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 })
  })

  it('shrinks a portrait photo to 1280 on the long side', () => {
    expect(fitSize(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 })
  })

  it('keeps a small image as it is', () => {
    expect(fitSize(800, 600, 1280)).toEqual({ width: 800, height: 600 })
  })

  it('keeps an image that is exactly the maximum', () => {
    expect(fitSize(1280, 720, 1280)).toEqual({ width: 1280, height: 720 })
  })

  it('rounds to whole pixels', () => {
    // 1000 x 333 -> scale 0.5 -> 500 x 166.5 -> 167
    expect(fitSize(1000, 333, 500)).toEqual({ width: 500, height: 167 })
  })
})
