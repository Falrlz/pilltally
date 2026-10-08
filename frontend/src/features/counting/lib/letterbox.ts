// Letterbox for the model input, the same as backend/app/services/image_processor.py:
// resize to imgsz x imgsz keeping the aspect ratio, pad the rest with gray 114.

export const PAD_GRAY = 114

export interface LetterboxInfo {
  scale: number
  newWidth: number
  newHeight: number
  padLeft: number
  padTop: number
}

/**
 * Round like Python's round(): a value exactly halfway goes to the even number.
 * JavaScript's Math.round always goes up, so results would differ from the backend.
 *
 * Example: roundHalfEven(360.5) -> 360 (Math.round gives 361), roundHalfEven(361.5) -> 362
 */
export function roundHalfEven(value: number): number {
  const lower = Math.floor(value)
  const fraction = value - lower
  if (fraction > 0.5) {
    return lower + 1
  }
  if (fraction < 0.5) {
    return lower
  }
  // Exactly halfway: choose the even one
  return lower % 2 === 0 ? lower : lower + 1
}

/**
 * Where an image of width x height goes inside the imgsz x imgsz model input.
 * Same rounding rules as the backend (and Ultralytics LetterBox).
 *
 * Example: computeLetterbox(1280, 640, 640) -> scale 0.5, 640 x 320, padTop 160
 */
export function computeLetterbox(width: number, height: number, imgsz: number): LetterboxInfo {
  const scale = Math.min(imgsz / width, imgsz / height)
  const newWidth = roundHalfEven(width * scale)
  const newHeight = roundHalfEven(height * scale)
  const padLeft = roundHalfEven((imgsz - newWidth) / 2 - 0.1)
  const padTop = roundHalfEven((imgsz - newHeight) / 2 - 0.1)
  return { scale, newWidth, newHeight, padLeft, padTop }
}

/**
 * Turn canvas pixels into the model input.
 *
 * pixels: RGBA bytes of an imgsz x imgsz canvas (ImageData.data), 4 values per pixel
 * output: Float32Array of length 3 * imgsz * imgsz, reused between frames
 *
 * The model wants the colors as 3 separate planes (all R, then all G, then all B)
 * with values 0-1. The alpha value (A) is not used.
 */
export function pixelsToTensor(pixels: Uint8ClampedArray, imgsz: number, output: Float32Array): void {
  const planeSize = imgsz * imgsz
  for (let i = 0; i < planeSize; i++) {
    const pixelStart = i * 4
    output[i] = pixels[pixelStart] / 255 // R
    output[planeSize + i] = pixels[pixelStart + 1] / 255 // G
    output[2 * planeSize + i] = pixels[pixelStart + 2] / 255 // B
  }
}
