import { useId } from 'react'
import { TRAY_FLOOR } from '@/features/home/lib/trayScene'

// A pharmacy counting tray seen from above: bronze body, a lighter floor,
// and the channel on the left where counted pills are pushed.
// Units: viewBox 600 × 420.
export function TrayBackdrop() {
  // SVG ids must be unique on the page and may not contain ":"
  const baseId = useId().replace(/:/g, '')
  const shadowId = `tray-shadow-${baseId}`
  const grainId = `tray-grain-${baseId}`

  return (
    <g>
      <defs>
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      {/* Soft shadow below the tray, offset downward: it rests on the table */}
      <rect x="30" y="34" width="540" height="372" rx="22" className="fill-bronze" opacity="0.35" filter={`url(#${shadowId})`} />

      {/* Body and floor */}
      <rect x="20" y="20" width="560" height="380" rx="22" className="fill-bronze" />
      <rect
        x={TRAY_FLOOR.x}
        y={TRAY_FLOOR.y}
        width={TRAY_FLOOR.width}
        height={TRAY_FLOOR.height}
        rx={TRAY_FLOOR.radius}
        className="fill-pine"
        opacity="0.45"
      />
      <rect
        x={TRAY_FLOOR.x}
        y={TRAY_FLOOR.y}
        width={TRAY_FLOOR.width}
        height={TRAY_FLOOR.height}
        rx={TRAY_FLOOR.radius}
        filter={`url(#${grainId})`}
        opacity="0.06"
      />

      {/* Channel on the left, separated by a raised lip */}
      <rect x="44" y="48" width="72" height="324" rx="10" className="fill-bronze" opacity="0.85" />
      <line x1="126" y1="48" x2="126" y2="372" className="stroke-pill-shade" strokeWidth="2" opacity="0.25" />
    </g>
  )
}
