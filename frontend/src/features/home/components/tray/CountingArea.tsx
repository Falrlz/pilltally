import { useId, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { quadPath, TRAY_FLOOR, type Quad, type TrayFloor } from '@/features/home/lib/trayScene'

// How far one arrow-key press moves a corner (viewBox units)
const KEY_STEP = 10
const HANDLE_SIZE = 16
// Invisible area around a handle that also catches the finger
const HIT_SIZE = 44

interface CountingAreaProps {
  quad: Quad
  // One label per corner, in the order of the quad
  cornerLabels: string[]
  // Turns a pointer position on screen into viewBox units
  toViewBox: (clientX: number, clientY: number) => { x: number; y: number }
  onMoveCorner: (corner: number, x: number, y: number) => void
  // The floor the veil covers: the hero tray by default
  floor?: TrayFloor
  // Drawn over the veil and outline but under the corners, so the corners stay on top
  overlay?: ReactNode
}

// The counting area, like in the real app: 4 corners that each can be dragged.
// Outside the area the tray floor is darkened (like the real app); the outline is an iris line.
export function CountingArea({ quad, cornerLabels, toViewBox, onMoveCorner, floor = TRAY_FLOOR, overlay }: CountingAreaProps) {
  // Veil = the tray floor with a hole where the area is (even-odd rule),
  // clipped to the floor's rounded corners so the bronze rim stays clean
  const floorClipId = `tray-floor-${useId().replace(/:/g, '')}`
  const veilPath =
    `M${floor.x} ${floor.y} h${floor.width} v${floor.height} h-${floor.width} Z ` +
    quadPath(quad)

  function handlePointerDown(event: PointerEvent<SVGGElement>) {
    // Keep receiving moves even when the finger leaves the handle
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<SVGGElement>, corner: number) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }
    const point = toViewBox(event.clientX, event.clientY)
    onMoveCorner(corner, point.x, point.y)
  }

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, corner: number) {
    let { x, y } = quad[corner]
    if (event.key === 'ArrowLeft') x -= KEY_STEP
    else if (event.key === 'ArrowRight') x += KEY_STEP
    else if (event.key === 'ArrowUp') y -= KEY_STEP
    else if (event.key === 'ArrowDown') y += KEY_STEP
    else return

    event.preventDefault()
    onMoveCorner(corner, x, y)
  }

  return (
    <g>
      <defs>
        <clipPath id={floorClipId}>
          <rect
            x={floor.x}
            y={floor.y}
            width={floor.width}
            height={floor.height}
            rx={floor.radius}
          />
        </clipPath>
      </defs>
      <path d={veilPath} fillRule="evenodd" className="fill-bronze" opacity="0.6" clipPath={`url(#${floorClipId})`} />
      <path d={quadPath(quad)} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="miter" />
      {overlay}

      {quad.map((point, corner) => (
        <g
          key={corner}
          role="button"
          tabIndex={0}
          aria-label={cornerLabels[corner]}
          className="cursor-move touch-none outline-none [&:focus-visible>.ring]:opacity-100"
          onPointerDown={handlePointerDown}
          onPointerMove={(event) => handlePointerMove(event, corner)}
          onKeyDown={(event) => handleKeyDown(event, corner)}
        >
          <rect x={point.x - HIT_SIZE / 2} y={point.y - HIT_SIZE / 2} width={HIT_SIZE} height={HIT_SIZE} fill="transparent" />
          {/* Focus ring, shown only for keyboard focus */}
          <rect
            x={point.x - HANDLE_SIZE / 2 - 5}
            y={point.y - HANDLE_SIZE / 2 - 5}
            width={HANDLE_SIZE + 10}
            height={HANDLE_SIZE + 10}
            fill="none"
            className="ring stroke-primary opacity-0"
            strokeWidth="1.5"
          />
          <rect
            x={point.x - HANDLE_SIZE / 2}
            y={point.y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            className="fill-primary"
          />
        </g>
      ))}
    </g>
  )
}
