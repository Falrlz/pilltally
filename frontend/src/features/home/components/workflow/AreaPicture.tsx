import { useRef } from 'react'
import { Button } from '@/components/ui/Button'
import type { HomeContent } from '@/content/home.content'
import type { Quad } from '@/features/home/lib/trayScene'
import { SCENE_FLOOR, type DemoMode } from '@/features/home/lib/workflowScene'
import { CountingArea } from '../tray/CountingArea'
import { ModeFrame } from './ModeFrame'
import { SceneTray } from './SceneTray'

type DemoTexts = HomeContent['workflow']['demo']

interface AreaPictureProps {
  mode: DemoMode
  quad: Quad
  texts: DemoTexts
  cornerLabels: string[]
  isAreaChanged: boolean
  onMoveCorner: (corner: number, x: number, y: number) => void
  onResetArea: () => void
}

// Step 2: the same tray (still seen through the mode from step 1) with the
// 4-point counting area; each corner can be dragged, like in the real app
export function AreaPicture({
  mode,
  quad,
  texts,
  cornerLabels,
  isAreaChanged,
  onMoveCorner,
  onResetArea,
}: AreaPictureProps) {
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
    <>
      <svg
        ref={svgRef}
        viewBox="0 0 320 220"
        role="group"
        aria-label={texts.sceneLabel}
        className="block h-auto w-full select-none"
      >
        <SceneTray />
        <CountingArea
          quad={quad}
          cornerLabels={cornerLabels}
          toViewBox={toViewBox}
          onMoveCorner={onMoveCorner}
          floor={SCENE_FLOOR}
          overlay={<ModeFrame mode={mode} tag={texts.frameTags[mode]} />}
        />
      </svg>
      <div className="mt-4 flex items-start justify-between gap-4">
        <p className="text-sm leading-relaxed text-muted">{texts.areaHint}</p>
        <Button variant="secondary" className="shrink-0 whitespace-nowrap" onClick={onResetArea} disabled={!isAreaChanged}>
          {texts.resetAreaButton}
        </Button>
      </div>
    </>
  )
}
