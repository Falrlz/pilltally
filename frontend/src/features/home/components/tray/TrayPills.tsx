import { CAPSULE_LENGTH, CAPSULE_WIDTH, TABLET_RADIUS, type Pill } from '@/features/home/lib/trayScene'

// One pill seen from above: a tablet is a disc with a score line,
// a capsule is a rounded bar with its seam. Each has a small shadow.
export function PillShape({ pill }: { pill: Pill }) {
  if (pill.kind === 'tablet') {
    return (
      <g>
        <circle cx={pill.x + 1.5} cy={pill.y + 2.5} r={TABLET_RADIUS} className="fill-bronze" opacity="0.45" />
        <circle cx={pill.x} cy={pill.y} r={TABLET_RADIUS} className="fill-pill" />
        <line
          x1={pill.x - 8}
          y1={pill.y}
          x2={pill.x + 8}
          y2={pill.y}
          className="stroke-pill-shade"
          strokeWidth="1"
        />
      </g>
    )
  }

  const left = pill.x - CAPSULE_LENGTH / 2
  const top = pill.y - CAPSULE_WIDTH / 2
  return (
    <g transform={`rotate(${pill.rotation} ${pill.x} ${pill.y})`}>
      <rect
        x={left + 1.5}
        y={top + 2.5}
        width={CAPSULE_LENGTH}
        height={CAPSULE_WIDTH}
        rx={CAPSULE_WIDTH / 2}
        className="fill-bronze"
        opacity="0.45"
      />
      <rect x={left} y={top} width={CAPSULE_LENGTH} height={CAPSULE_WIDTH} rx={CAPSULE_WIDTH / 2} className="fill-pill" />
      <line x1={pill.x} y1={top + 1} x2={pill.x} y2={top + CAPSULE_WIDTH - 1} className="stroke-pill-shade" strokeWidth="1" />
    </g>
  )
}

export function TrayPills({ pills }: { pills: Pill[] }) {
  return (
    <g>
      {pills.map((pill) => (
        <PillShape key={pill.id} pill={pill} />
      ))}
    </g>
  )
}
