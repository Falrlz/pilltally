import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useLocalized } from '@/app/providers/localeContext'
import { countContent } from '@/content/count.content'
import type { AreaPoint } from '../lib/countingArea'

interface CountingAreaEditorProps {
  points: AreaPoint[]
  onMovePoint: (index: number, point: AreaPoint) => void
}

// How far an arrow key moves a corner (fraction of the picture)
const KEY_STEP = 0.01

/**
 * The counting area drawn over a picture, with 4 corners to drag.
 * Outside the area is darkened. Placed in a `relative` parent of the same
 * size as the picture. Only the corners catch clicks; the rest lets them
 * through (e.g. to the video controls).
 */
export function CountingAreaEditor({ points, onMovePoint }: CountingAreaEditorProps) {
  const { area } = useLocalized(countContent)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pointer position -> fraction of the picture
  function toAreaPoint(event: PointerEvent<HTMLButtonElement>): AreaPoint | null {
    const container = containerRef.current
    if (container === null) {
      return null
    }
    const rect = container.getBoundingClientRect()
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    // Keep receiving pointer moves even when the finger leaves the small circle
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }
    const point = toAreaPoint(event)
    if (point !== null) {
      onMovePoint(index, point)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const [x, y] = points[index]
    let moved: AreaPoint | null = null
    if (event.key === 'ArrowLeft') moved = [x - KEY_STEP, y]
    if (event.key === 'ArrowRight') moved = [x + KEY_STEP, y]
    if (event.key === 'ArrowUp') moved = [x, y - KEY_STEP]
    if (event.key === 'ArrowDown') moved = [x, y + KEY_STEP]
    if (moved !== null) {
      event.preventDefault()
      onMovePoint(index, moved)
    }
  }

  // SVG path in a 100 x 100 box: the whole picture, then the area (cut out by "evenodd")
  let areaPath = ''
  for (let i = 0; i < points.length; i++) {
    const command = i === 0 ? 'M' : 'L'
    areaPath += `${command}${points[i][0] * 100} ${points[i][1] * 100} `
  }
  areaPath += 'Z'

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <path d={`M0 0 H100 V100 H0 Z ${areaPath}`} fillRule="evenodd" fill="black" fillOpacity={0.5} />
        <path d={areaPath} fill="none" className="stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>

      {points.map((point, index) => (
        <button
          key={index}
          type="button"
          aria-label={area.cornerLabel.replace('{n}', String(index + 1))}
          onPointerDown={handlePointerDown}
          onPointerMove={(event) => handlePointerMove(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          // touch-none: dragging moves the corner, not the page
          className="pointer-events-auto absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-4 border-primary bg-background/70 active:cursor-grabbing"
          style={{ left: `${point[0] * 100}%`, top: `${point[1] * 100}%` }}
        />
      ))}
    </div>
  )
}
