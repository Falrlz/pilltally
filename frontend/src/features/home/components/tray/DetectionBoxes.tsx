import { BOX_STEP_MS } from '@/features/home/hooks/useTrayCount'
import { isPillInside, pillBox, type Pill, type Quad } from '@/features/home/lib/trayScene'

interface DetectionBoxesProps {
  pills: Pill[]
  quad: Quad
  // During the opening sequence the boxes settle one after another
  isIntro: boolean
  introDelayMs: number
}

// An iris box around every pill whose center is inside the counting area.
// A box is drawn by its stroke: faint first, firm once "confirmed",
// the same way the live camera confirms a pill after a few frames.
export function DetectionBoxes({ pills, quad, isIntro, introDelayMs }: DetectionBoxesProps) {
  const insidePills = pills.filter((pill) => isPillInside(pill, quad))

  return (
    <g fill="none" className="stroke-detection" strokeWidth="1.75">
      {insidePills.map((pill, order) => {
        const box = pillBox(pill)
        let delayMs = 0
        if (isIntro) {
          delayMs = introDelayMs + order * BOX_STEP_MS
        }
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
            style={{ animationDelay: `${delayMs}ms` }}
          />
        )
      })}
    </g>
  )
}
