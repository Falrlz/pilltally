// Make a photo smaller in the browser before it is uploaded.
// A 4000x3000 phone photo (4-12 MB) becomes 1280x960 (about 300 KB).
// The count stays the same: the model only sees 640 px (docs/web_app.md section 7C).

export const MAX_UPLOAD_SIDE = 1280
const JPEG_QUALITY = 0.9

export interface Size {
  width: number
  height: number
}

export interface ResizedImage extends Size {
  blob: Blob
}

/**
 * The size that fits inside maxSide x maxSide, keeping the aspect ratio.
 * Small images are not made bigger.
 *
 * Example: fitSize(4000, 3000, 1280) -> { width: 1280, height: 960 }
 */
export function fitSize(width: number, height: number, maxSide: number): Size {
  const longestSide = Math.max(width, height)
  if (longestSide <= maxSide) {
    return { width, height }
  }

  const scale = maxSide / longestSide
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

/**
 * Read an image file, turn it upright, make it smaller and save it as JPEG.
 * Throws if the file is not an image the browser can read.
 */
export async function resizeImage(file: Blob, maxSide = MAX_UPLOAD_SIDE): Promise<ResizedImage> {
  // "from-image": rotate phone photos that are stored sideways (EXIF)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const size = fitSize(bitmap.width, bitmap.height, maxSide)

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (context === null) {
    bitmap.close()
    throw new Error('Canvas 2D is not available')
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  })
  if (blob === null) {
    throw new Error('Could not save the resized image')
  }

  return { blob, width: size.width, height: size.height }
}
