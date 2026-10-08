import type { Box } from '@/services/types'

interface BoxesLayerProps {
  // Pixel size of the image or video frame the boxes belong to
  width: number
  height: number
  boxes: Box[]
}

/**
 * The detection boxes as an SVG, placed over an image or video.
 *
 * The viewBox uses the frame's own pixel size, so box coordinates can be used
 * as they are, and the boxes scale together with the picture on any screen.
 * The parent must be `relative` and the picture must keep its aspect ratio.
 */
export function BoxesLayer({ width, height, boxes }: BoxesLayerProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      {boxes.map((box, index) => (
        <rect
          key={index}
          x={box.x1}
          y={box.y1}
          width={box.x2 - box.x1}
          height={box.y2 - box.y1}
          fill="none"
          className="stroke-detection"
          strokeWidth={3}
          // Same line width on screen, however much the picture is scaled
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
