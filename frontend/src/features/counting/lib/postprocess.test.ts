import { describe, expect, it } from 'vitest'
import type { Box } from '@/services/types'
import parity from './fixtures/parity.json'
import { boxIou, decodeOutput, nms, postprocess, toOriginal } from './postprocess'

function makeBox(x1: number, y1: number, x2: number, y2: number, score = 0.9): Box {
  return { x1, y1, x2, y2, score }
}

/**
 * Build the flat model output [1, 5, N] from candidates [cx, cy, w, h, score]:
 * first all cx, then all cy, all w, all h, all scores.
 */
function makeOutput(candidates: number[][]): Float32Array {
  const count = candidates.length
  const output = new Float32Array(5 * count)
  for (let i = 0; i < count; i++) {
    for (let row = 0; row < 5; row++) {
      output[row * count + i] = candidates[i][row]
    }
  }
  return output
}

describe('decodeOutput', () => {
  it('turns center + size into corners', () => {
    const output = makeOutput([[50, 40, 20, 10, 0.9]])

    const boxes = decodeOutput(output, 0.65)

    expect(boxes).toHaveLength(1)
    expect(boxes[0].x1).toBeCloseTo(40)
    expect(boxes[0].y1).toBeCloseTo(35)
    expect(boxes[0].x2).toBeCloseTo(60)
    expect(boxes[0].y2).toBeCloseTo(45)
  })

  it('keeps a score equal to the threshold (score >= threshold)', () => {
    const output = makeOutput([
      [10, 10, 5, 5, 0.25],
      [20, 20, 5, 5, 0.5],
      [30, 30, 5, 5, 0.75],
    ])

    expect(decodeOutput(output, 0.5)).toHaveLength(2)
  })
})

describe('boxIou', () => {
  it('is 1 for the same box and 0 without overlap', () => {
    const box = makeBox(0, 0, 10, 10)
    expect(boxIou(box, box)).toBeCloseTo(1)
    expect(boxIou(box, makeBox(20, 20, 30, 30))).toBe(0)
  })

  it('is 50 / 150 for two boxes overlapping by half', () => {
    expect(boxIou(makeBox(0, 0, 10, 10), makeBox(5, 0, 15, 10))).toBeCloseTo(50 / 150)
  })
})

describe('nms', () => {
  it('removes an overlapping box with a lower score', () => {
    const best = makeBox(0, 0, 10, 10, 0.9)
    const almostSame = makeBox(0, 0, 10, 11, 0.8)
    const otherPill = makeBox(50, 50, 60, 60, 0.7)

    expect(nms([almostSame, otherPill, best], 0.7, 300)).toEqual([best, otherPill])
  })

  it('stops at maxDetections', () => {
    const boxes = [0, 1, 2, 3, 4].map((i) => makeBox(i * 20, 0, i * 20 + 10, 10))
    expect(nms(boxes, 0.7, 3)).toHaveLength(3)
  })
})

describe('toOriginal', () => {
  it('undoes the letterbox and adds the region offset', () => {
    const info = { scale: 0.5, newWidth: 640, newHeight: 320, padLeft: 0, padTop: 160 }
    const region = { offsetX: 100, offsetY: 50, width: 1280, height: 640 }

    const result = toOriginal(makeBox(10, 170, 20, 180), info, region)

    expect(result).toEqual(makeBox(120, 70, 140, 90))
  })

  it('keeps the box inside the region', () => {
    const info = { scale: 1, newWidth: 100, newHeight: 100, padLeft: 0, padTop: 0 }
    const region = { offsetX: 0, offsetY: 0, width: 100, height: 100 }

    expect(toOriginal(makeBox(-5, -5, 120, 120), info, region)).toEqual(makeBox(0, 0, 100, 100))
  })
})

// Parity: the same boxes as the Python backend for real model output
// (made by backend/scripts/make_parity_fixtures.py)
describe('postprocess parity with the backend', () => {
  for (const image of parity.images) {
    it(`gives the Python result for ${image.name}`, () => {
      const output = makeOutput(image.candidates)
      const info = {
        scale: image.letterbox.scale,
        // newWidth/newHeight are not used by postprocess
        newWidth: 0,
        newHeight: 0,
        padLeft: image.letterbox.pad_left,
        padTop: image.letterbox.pad_top,
      }
      const region = { offsetX: 0, offsetY: 0, width: image.image_width, height: image.image_height }

      const boxes = postprocess(output, info, region, parity.conf_threshold)

      expect(boxes).toHaveLength(image.expected_count)
      for (let i = 0; i < boxes.length; i++) {
        const [x1, y1, x2, y2, score] = image.expected_boxes[i]
        // Same order (by score) and the same coordinates to 0.001 pixel
        expect(boxes[i].x1).toBeCloseTo(x1, 3)
        expect(boxes[i].y1).toBeCloseTo(y1, 3)
        expect(boxes[i].x2).toBeCloseTo(x2, 3)
        expect(boxes[i].y2).toBeCloseTo(y2, 3)
        expect(boxes[i].score).toBeCloseTo(score, 6)
      }
    })

    // The live mode asks for boxes from score 0.4 (tracker hysteresis). Lower boxes
    // can only remove even lower ones in NMS, so the boxes >= conf_threshold must
    // still be exactly the backend result.
    it(`keeps the Python result with a lower minScore for ${image.name}`, () => {
      const output = makeOutput(image.candidates)
      const info = {
        scale: image.letterbox.scale,
        newWidth: 0,
        newHeight: 0,
        padLeft: image.letterbox.pad_left,
        padTop: image.letterbox.pad_top,
      }
      const region = { offsetX: 0, offsetY: 0, width: image.image_width, height: image.image_height }

      const allBoxes = postprocess(output, info, region, 0.4)
      const confidentBoxes = allBoxes.filter((box) => box.score >= parity.conf_threshold)

      expect(confidentBoxes).toHaveLength(image.expected_count)
      for (let i = 0; i < confidentBoxes.length; i++) {
        expect(confidentBoxes[i].x1).toBeCloseTo(image.expected_boxes[i][0], 3)
        expect(confidentBoxes[i].y2).toBeCloseTo(image.expected_boxes[i][3], 3)
      }
    })
  }
})
