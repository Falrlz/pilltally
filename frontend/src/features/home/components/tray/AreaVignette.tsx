import { useAreaLoop } from '@/features/home/hooks/useAreaLoop'
import {
  MAT,
  VIGNETTE_HEIGHT,
  VIGNETTE_PILLS,
  VIGNETTE_WIDTH,
} from '@/features/home/lib/areaLoop'
import { isPillInside, pillBox, quadPath, type Point, type Quad } from '@/features/home/lib/trayScene'
import { PillShape } from './TrayPills'

interface AreaVignetteProps {
  label: string
  // Under the picture, next to the number: "Counted"
  countedLabel: string
}

// The picture of the "counting area" section: a work table seen from above.
// A dark counting mat lies crooked on light wood, with a spilled pill bottle,
// a spatula, a coin and a pine sprig around it, and a few pills that rolled
// off. A hand pulls the corners of the area in to the mat one by one, so the
// stray pills drop out of the count shown under the picture.
// An animation only: nothing here can be dragged.
export function AreaVignette({ label, countedLabel }: AreaVignetteProps) {
  const { quad, hand, pictureRef } = useAreaLoop()
  const insidePills = VIGNETTE_PILLS.filter((pill) => isPillInside(pill, quad))

  let handPoint: Point | null = null
  if (hand.corner !== null) {
    handPoint = quad[hand.corner]
  }

  return (
    <figure>
      <svg
        ref={pictureRef}
        viewBox={`0 0 ${VIGNETTE_WIDTH} ${VIGNETTE_HEIGHT}`}
        role="img"
        aria-label={label}
        className="block h-auto w-full border border-border select-none"
      >
        <TableTop />
        <CountingMat />
        <PillBottle />
        <Coin x={36} y={186} />
        <Spatula />
        <PineSprig />

        {VIGNETTE_PILLS.map((pill) => (
          <PillShape key={pill.id} pill={pill} />
        ))}

        {/* A pill inside the area gets its box drawn (it mounts and settles) */}
        <g fill="none" className="stroke-detection" strokeWidth="1.75">
          {insidePills.map((pill) => {
            const box = pillBox(pill)
            return (
              <rect
                key={pill.id}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                pathLength={1}
                strokeDasharray="1"
                className="motion-safe:animate-box-settle"
              />
            )
          })}
        </g>

        <AreaOutline quad={quad} />

        {handPoint !== null && <DemoHand point={handPoint} isPressed={hand.isPressed} />}
      </svg>

      {/* Just the number and its label; the screen reader gets the count from the label above */}
      <figcaption aria-hidden="true" className="mt-5 flex items-baseline gap-3">
        <span className="font-display text-5xl leading-none text-primary tabular-nums">{insidePills.length}</span>
        <span className="text-xs tracking-[0.2em] text-muted uppercase">{countedLabel}</span>
      </figcaption>
    </figure>
  )
}

const HANDLE_SIZE = 16

// The counting area as the real app draws it (veil outside, iris outline,
// 4 square corners), but only drawn: the hand moves it, not the reader
function AreaOutline({ quad }: { quad: Quad }) {
  const veilPath = `M0 0 h${VIGNETTE_WIDTH} v${VIGNETTE_HEIGHT} h-${VIGNETTE_WIDTH} Z ` + quadPath(quad)
  return (
    <g className="pointer-events-none">
      <path d={veilPath} fillRule="evenodd" className="fill-bronze" opacity="0.6" />
      <path d={quadPath(quad)} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="miter" />
      {quad.map((point, corner) => (
        <rect
          key={corner}
          x={point.x - HANDLE_SIZE / 2}
          y={point.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          className="fill-primary"
        />
      ))}
    </g>
  )
}

// Light wood seen from above: a plaster-colored top with a few long grain lines
function TableTop() {
  return (
    <g>
      <rect width={VIGNETTE_WIDTH} height={VIGNETTE_HEIGHT} className="fill-surface" />
      <g fill="none" className="stroke-pill-shade" strokeWidth="1">
        <path d="M0 34 C 90 28, 170 42, 260 32 S 340 30, 360 36" />
        <path d="M0 40 C 100 36, 190 48, 360 42" opacity="0.6" />
        <path d="M0 118 C 70 112, 150 124, 230 116 S 320 112, 360 120" />
        <path d="M0 202 C 80 196, 160 210, 250 200 S 330 198, 360 206" />
        <path d="M0 209 C 110 206, 220 216, 360 212" opacity="0.6" />
      </g>
    </g>
  )
}

// The dark counting mat, a little crooked, with a stitched edge
function CountingMat() {
  const left = MAT.x - MAT.width / 2
  const top = MAT.y - MAT.height / 2
  return (
    <g transform={`rotate(${MAT.rotation} ${MAT.x} ${MAT.y})`}>
      {/* Its shadow on the table */}
      <rect x={left + 2} y={top + 4} width={MAT.width} height={MAT.height} className="fill-bronze" opacity="0.25" />
      <rect x={left} y={top} width={MAT.width} height={MAT.height} className="fill-bronze" />
      <rect
        x={left + 6}
        y={top + 6}
        width={MAT.width - 12}
        height={MAT.height - 12}
        fill="none"
        className="stroke-pine"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
    </g>
  )
}

// A pill bottle lying on its side, open end to the right (one pill rolled out)
function PillBottle() {
  return (
    <g>
      <rect x="12" y="18" width="46" height="26" rx="4" className="fill-bronze" opacity="0.2" transform="translate(1.5 2.5)" />
      <rect x="12" y="18" width="46" height="26" rx="4" className="fill-pill stroke-pill-shade" strokeWidth="1" />
      {/* Label */}
      <rect x="22" y="18" width="22" height="26" className="fill-pine" opacity="0.35" />
      <line x1="26" y1="28" x2="40" y2="28" className="stroke-pill" strokeWidth="1.5" />
      <line x1="26" y1="34" x2="36" y2="34" className="stroke-pill" strokeWidth="1.5" />
      {/* Neck, open towards the mat */}
      <rect x="58" y="23" width="6" height="16" className="fill-pill stroke-pill-shade" strokeWidth="1" />
    </g>
  )
}

function Coin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x + 1.5} cy={y + 2.5} r="12" className="fill-bronze" opacity="0.2" />
      <circle cx={x} cy={y} r="12" className="fill-pill-shade" />
      <circle cx={x} cy={y} r="8.5" fill="none" className="stroke-pine" strokeWidth="1" opacity="0.7" />
    </g>
  )
}

// The pharmacist's counting spatula, lying below the mat
function Spatula() {
  return (
    <g transform="rotate(-4 190 220)">
      <rect x="112" y="217" width="98" height="7" rx="3.5" className="fill-pine" />
      <path d="M208 214 L258 212 Q264 220 258 228 L208 227 Z" className="fill-pill-shade stroke-pine" strokeWidth="1" />
    </g>
  )
}

// One tuft of pine needles fanning out from a point on the stem
function NeedleTuft({ x, y, angle }: { x: number; y: number; angle: number }) {
  const needles = []
  for (let index = -3; index <= 3; index++) {
    const turn = ((angle + index * 16) * Math.PI) / 180
    needles.push(
      <line key={index} x1={x} y1={y} x2={x + Math.cos(turn) * 13} y2={y + Math.sin(turn) * 13} />,
    )
  }
  return <g>{needles}</g>
}

// A small pine sprig, a nod to the ikebana on the rest of the page
function PineSprig() {
  return (
    <g fill="none" className="stroke-pine" strokeLinecap="round">
      <path d="M360 214 C 346 196, 336 176, 318 150" strokeWidth="2" />
      <g strokeWidth="1">
        <NeedleTuft x={318} y={150} angle={-120} />
        <NeedleTuft x={334} y={174} angle={-160} />
        <NeedleTuft x={340} y={182} angle={-30} />
        <NeedleTuft x={350} y={200} angle={-150} />
      </g>
    </g>
  )
}

// The demo's hand: a pointer resting on the corner it drags. While it presses,
// an iris ring grows around the corner and the pointer sinks a little.
function DemoHand({ point, isPressed }: { point: Point; isPressed: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect
        x={point.x - 15}
        y={point.y - 15}
        width="30"
        height="30"
        fill="none"
        className="stroke-primary transition-opacity duration-300"
        strokeWidth="1.5"
        opacity={isPressed ? 0.9 : 0}
      />
      {/* Pointer with its tip just right of and below the corner */}
      <g transform={`translate(${point.x + 4} ${point.y + 4}) scale(${isPressed ? 0.9 : 1})`}>
        <path
          d="M0 0 L0 18 L4.6 13.8 L7.6 21 L10.6 19.8 L7.6 12.8 L13.6 12.8 Z"
          className="fill-pill stroke-bronze"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>
    </g>
  )
}
