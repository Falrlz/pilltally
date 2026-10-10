import { useRef } from 'react'
import { PILLS, type Quad } from '@/features/home/lib/trayScene'

// Visible part of the drawing: starts at the tray's edge (x, y = 18) so the tray
// lines up with the count above it; leaves a little room right and below for its shadow
const VIEW_BOX = '18 18 568 400'
import { CountingArea } from './CountingArea'
import { DetectionBoxes } from './DetectionBoxes'
import { TrayBackdrop } from './TrayBackdrop'
import { TrayPills } from './TrayPills'

interface TraySceneProps {
  quad: Quad
  isIntro: boolean
  introDelayMs: number
  label: string
  cornerLabels: string[]
  onMoveCorner: (corner: number, x: number, y: number) => void
}

// The hero illustration: pills on a counting tray, seen from above like the
// camera sees them, with the 4-point counting area of the real app
export function TrayScene(props: TraySceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Screen position → viewBox units, whatever size the drawing has on screen
  function toViewBox(clientX: number, clientY: number) {
    const matrix = svgRef.current?.getScreenCTM()
    if (!matrix) {
      return { x: 0, y: 0 }
    }
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return { x: point.x, y: point.y }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={VIEW_BOX}
      className="block h-auto w-full select-none"
      role="group"
      aria-label={props.label}
    >
      <TrayBackdrop />
      <TrayPills pills={PILLS} />
      <DetectionBoxes pills={PILLS} quad={props.quad} isIntro={props.isIntro} introDelayMs={props.introDelayMs} />
      <CountingArea
        quad={props.quad}
        cornerLabels={props.cornerLabels}
        toViewBox={toViewBox}
        onMoveCorner={props.onMoveCorner}
      />
    </svg>
  )
}
