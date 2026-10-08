import { useId } from 'react'
import { isPillInside, pillBox, quadPath, type Pill, type Quad } from '@/features/home/lib/trayScene'
import { PillShape } from './TrayPills'

// A small still tray for the "counting area" section: the 4-point area
// around some pills; the rest are veiled and not counted. Units: viewBox 320 × 220.
const QUAD: Quad = [
  { x: 92, y: 74 },
  { x: 236, y: 74 },
  { x: 236, y: 184 },
  { x: 92, y: 184 },
]

const PILLS: Pill[] = [
  { id: 1, x: 44, y: 70, kind: 'tablet', rotation: 0 },
  { id: 2, x: 52, y: 150, kind: 'capsule', rotation: 30 },
  { id: 3, x: 124, y: 108, kind: 'tablet', rotation: 0 },
  { id: 4, x: 170, y: 150, kind: 'capsule', rotation: -15 },
  { id: 5, x: 180, y: 106, kind: 'tablet', rotation: 0 },
  { id: 6, x: 206, y: 150, kind: 'tablet', rotation: 0 },
  { id: 7, x: 124, y: 154, kind: 'tablet', rotation: 0 },
  { id: 8, x: 270, y: 70, kind: 'capsule', rotation: 60 },
  { id: 9, x: 278, y: 160, kind: 'tablet', rotation: 0 },
]

export function AreaVignette({ label }: { label: string }) {
  // Darken the floor outside the area, clipped to the floor's rounded corners
  const floorClipId = `vignette-floor-${useId().replace(/:/g, '')}`
  const veilPath = `M12 12 h296 v196 h-296 Z ${quadPath(QUAD)}`

  return (
    <svg viewBox="0 0 320 220" role="img" aria-label={label} className="block h-auto w-full">
      <rect x="4" y="4" width="312" height="212" rx="14" className="fill-bronze" />
      <rect x="12" y="12" width="296" height="196" rx="8" className="fill-pine" opacity="0.32" />

      {PILLS.map((pill) => (
        <PillShape key={pill.id} pill={pill} />
      ))}

      {/* Outside the area is darkened and not counted */}
      <defs>
        <clipPath id={floorClipId}>
          <rect x="12" y="12" width="296" height="196" rx="8" />
        </clipPath>
      </defs>
      <path d={veilPath} fillRule="evenodd" className="fill-bronze" opacity="0.6" clipPath={`url(#${floorClipId})`} />

      <g fill="none" className="stroke-detection" strokeWidth="1.75">
        {PILLS.filter((pill) => isPillInside(pill, QUAD)).map((pill) => {
          const box = pillBox(pill)
          return <rect key={pill.id} x={box.x} y={box.y} width={box.width} height={box.height} />
        })}
      </g>

      <path d={quadPath(QUAD)} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="miter" />
      {QUAD.map((point, index) => (
        <rect key={index} x={point.x - 5} y={point.y - 5} width="10" height="10" className="fill-primary" />
      ))}
    </svg>
  )
}
