import { useState, type KeyboardEvent } from 'react'
import { DEMO_BOX_STEP_MS, DEMO_START_DELAY_MS } from '@/features/home/hooks/useWorkflowDemo'
import { pillBox } from '@/features/home/lib/trayScene'
import type { ScoredPill } from '@/features/home/lib/workflowScene'

// Extra space around a box that also catches a tap
const HIT_PADDING = 6

interface ResultBoxesProps {
  // The pills inside the counting area right now
  pills: ScoredPill[]
  selectedPillId: number | null
  onSelect: (pillId: number) => void
  // Screen reader name of one box, e.g. "Detected pill, confidence score 0.97"
  labelFor: (pill: ScoredPill) => string
  formatScore: (score: number) => string
}

// The iris boxes of step 3. Mounted again for every count run (key = run):
// the pills inside at the start settle one by one, faint first, then firm;
// a pill that enters the area later (step 2) gets its box at once.
// Tapping a box shows its confidence score.
export function ResultBoxes({ pills, selectedPillId, onSelect, labelFor, formatScore }: ResultBoxesProps) {
  // Remembered once, when this run starts
  const [runOrder] = useState(() => pills.map((pill) => pill.id))

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, pillId: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(pillId)
    }
  }

  // The tapped pill, if it is still inside the area
  const selectedPill = pills.find((pill) => pill.id === selectedPillId) ?? null

  return (
    <g>
      {pills.map((pill) => {
        const box = pillBox(pill)
        const isSelected = pill.id === selectedPillId

        let delayMs = 0
        const order = runOrder.indexOf(pill.id)
        if (order >= 0) {
          delayMs = DEMO_START_DELAY_MS + order * DEMO_BOX_STEP_MS
        }

        return (
          <g
            key={pill.id}
            role="button"
            tabIndex={0}
            aria-label={labelFor(pill)}
            aria-pressed={isSelected}
            className="cursor-pointer outline-none [&:focus-visible>.ring]:opacity-100"
            onClick={() => onSelect(pill.id)}
            onKeyDown={(event) => handleKeyDown(event, pill.id)}
          >
            <rect
              x={box.x - HIT_PADDING}
              y={box.y - HIT_PADDING}
              width={box.width + HIT_PADDING * 2}
              height={box.height + HIT_PADDING * 2}
              fill="transparent"
            />
            {/* Focus ring, shown only for keyboard focus */}
            <rect
              x={box.x - 4}
              y={box.y - 4}
              width={box.width + 8}
              height={box.height + 8}
              fill="none"
              className="ring stroke-primary opacity-0"
              strokeWidth="1.25"
            />
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill="none"
              className="stroke-detection motion-safe:animate-box-settle"
              strokeWidth={isSelected ? 3 : 1.75}
              pathLength={1}
              strokeDasharray="1"
              style={{ animationDelay: `${delayMs}ms` }}
            />
          </g>
        )
      })}

      {/* The score tag sits above every box, so no box covers it */}
      {selectedPill !== null && <ScoreTag pill={selectedPill} text={formatScore(selectedPill.score)} />}
    </g>
  )
}

// A small iris plate with the score, just above the box
function ScoreTag({ pill, text }: { pill: ScoredPill; text: string }) {
  const box = pillBox(pill)
  const width = 34
  const height = 16
  const x = box.x + box.width / 2 - width / 2

  // Above the box; below it when there is no room at the top
  let y = box.y - height - 4
  if (y < 6) {
    y = box.y + box.height + 4
  }

  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={width} height={height} className="fill-primary" />
      <text
        x={x + width / 2}
        y={y + 11.5}
        textAnchor="middle"
        className="fill-primary-foreground font-sans tabular-nums"
        fontSize="10"
        fontWeight="500"
      >
        {text}
      </text>
    </g>
  )
}
