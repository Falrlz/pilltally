import { useId, type RefObject } from 'react'
import { useLocale } from '@/app/providers/localeContext'
import { Button } from '@/components/ui/Button'
import type { HomeContent } from '@/content/home.content'
import { quadPath, type Quad } from '@/features/home/lib/trayScene'
import { SCENE_FLOOR, type DemoMode, type ScoredPill } from '@/features/home/lib/workflowScene'
import { ModeFrame } from './ModeFrame'
import { ResultBoxes } from './ResultBoxes'
import { SceneTray } from './SceneTray'

type DemoTexts = HomeContent['workflow']['demo']

interface ResultPictureProps {
  mode: DemoMode
  quad: Quad
  insidePills: ScoredPill[]
  runId: number
  isCounting: boolean
  shownCount: number
  selectedPill: ScoredPill | null
  texts: DemoTexts
  countLabel: string
  // Only when counting should start by itself once this picture is in view
  resultRef?: RefObject<HTMLDivElement | null>
  onRecount: () => void
  onSelectPill: (pillId: number) => void
}

// Step 3: what steps 1 and 2 lead to. The tray through the chosen mode, the
// area from step 2 (not draggable here), an iris box on every pill inside it,
// and the count. Tapping a box shows its confidence score.
export function ResultPicture({
  mode,
  quad,
  insidePills,
  runId,
  isCounting,
  shownCount,
  selectedPill,
  texts,
  countLabel,
  resultRef,
  onRecount,
  onSelectPill,
}: ResultPictureProps) {
  const { locale } = useLocale()

  // 0.97 in English, 0,97 in Indonesian
  const scoreFormat = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  function formatScore(score: number) {
    return scoreFormat.format(score)
  }

  function labelFor(pill: ScoredPill) {
    return texts.boxLabel.replace('{score}', formatScore(pill.score))
  }

  let scoreText = texts.scoreHint
  if (selectedPill !== null) {
    scoreText = `${texts.scoreLabel}: ${formatScore(selectedPill.score)}`
  }

  return (
    <div ref={resultRef}>
      <svg viewBox="0 0 320 220" role="group" aria-label={texts.sceneLabel} className="block h-auto w-full select-none">
        <SceneTray />
        <AreaVeil quad={quad} />
        <ModeFrame mode={mode} tag={texts.frameTags[mode]} />
        {runId > 0 && (
          <ResultBoxes
            key={runId}
            pills={insidePills}
            selectedPillId={selectedPill?.id ?? null}
            onSelect={onSelectPill}
            labelFor={labelFor}
            formatScore={formatScore}
          />
        )}
      </svg>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="flex items-baseline gap-2.5">
            {/* Announced only once the count has settled */}
            <span
              aria-live={isCounting ? 'off' : 'polite'}
              className="font-display text-5xl leading-none text-primary tabular-nums"
            >
              {shownCount}
            </span>
            <span className="text-xs tracking-[0.2em] text-muted uppercase">{countLabel}</span>
        </p>
        <Button variant="secondary" className="shrink-0 whitespace-nowrap" onClick={onRecount} disabled={isCounting}>
          {texts.recountButton}
        </Button>
      </div>
      <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">{texts.resultSources[mode]}</p>
      <p aria-live="polite" className="mt-1.5 text-sm leading-relaxed text-muted">
        {scoreText}
      </p>
    </div>
  )
}

// The counting area from step 2, shown but not draggable:
// the floor outside it darkened, the outline in iris, small square corners
function AreaVeil({ quad }: { quad: Quad }) {
  const floorClipId = `result-floor-${useId().replace(/:/g, '')}`
  const veilPath =
    `M${SCENE_FLOOR.x} ${SCENE_FLOOR.y} h${SCENE_FLOOR.width} v${SCENE_FLOOR.height} h-${SCENE_FLOOR.width} Z ` +
    quadPath(quad)

  return (
    <g className="pointer-events-none">
      <defs>
        <clipPath id={floorClipId}>
          <rect
            x={SCENE_FLOOR.x}
            y={SCENE_FLOOR.y}
            width={SCENE_FLOOR.width}
            height={SCENE_FLOOR.height}
            rx={SCENE_FLOOR.radius}
          />
        </clipPath>
      </defs>
      <path d={veilPath} fillRule="evenodd" className="fill-bronze" opacity="0.6" clipPath={`url(#${floorClipId})`} />
      <path d={quadPath(quad)} fill="none" className="stroke-primary" strokeWidth="1.5" opacity="0.7" />
      {quad.map((point, index) => (
        <rect key={index} x={point.x - 4} y={point.y - 4} width="8" height="8" className="fill-primary" />
      ))}
    </g>
  )
}
