import { describe, expect, it } from 'vitest'
import parity from './fixtures/parity.json'
import { computeLetterbox, pixelsToTensor, roundHalfEven } from './letterbox'

describe('roundHalfEven', () => {
  it('rounds halfway values to the even number, like Python', () => {
    expect(roundHalfEven(360.5)).toBe(360)
    expect(roundHalfEven(361.5)).toBe(362)
    expect(roundHalfEven(0.5)).toBe(0)
  })

  it('rounds other values normally', () => {
    expect(roundHalfEven(2.4)).toBe(2)
    expect(roundHalfEven(2.6)).toBe(3)
    expect(roundHalfEven(7)).toBe(7)
  })
})

describe('computeLetterbox', () => {
  it('pads a wide image top and bottom', () => {
    const info = computeLetterbox(1280, 640, 640)
    expect(info).toEqual({ scale: 0.5, newWidth: 640, newHeight: 320, padLeft: 0, padTop: 160 })
  })

  // Parity: the same scale and padding as the backend letterbox (made by
  // backend/scripts/make_parity_fixtures.py)
  for (const testCase of parity.letterbox_cases) {
    it(`matches the backend for ${testCase.width} x ${testCase.height}`, () => {
      const info = computeLetterbox(testCase.width, testCase.height, parity.imgsz)
      expect(info.scale).toBe(testCase.scale)
      expect(info.padLeft).toBe(testCase.pad_left)
      expect(info.padTop).toBe(testCase.pad_top)
    })
  }
})

describe('pixelsToTensor', () => {
  it('splits RGBA pixels into R, G and B planes with values 0-1', () => {
    // A 2 x 2 image (imgsz 2): red, green, blue, white
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255, // red
      0, 255, 0, 255, // green
      0, 0, 255, 255, // blue
      255, 255, 255, 255, // white
    ])
    const output = new Float32Array(3 * 2 * 2)

    pixelsToTensor(pixels, 2, output)

    expect(Array.from(output.slice(0, 4))).toEqual([1, 0, 0, 1]) // R plane
    expect(Array.from(output.slice(4, 8))).toEqual([0, 1, 0, 1]) // G plane
    expect(Array.from(output.slice(8, 12))).toEqual([0, 0, 1, 1]) // B plane
  })
})
