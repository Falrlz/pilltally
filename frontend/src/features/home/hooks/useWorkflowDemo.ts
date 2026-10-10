import { useEffect, useRef, useState } from 'react'
import { moveCorner, type Quad } from '@/features/home/lib/trayScene'
import { pillsInside, SCENE_DEFAULT_QUAD, SCENE_LIMITS, type DemoMode } from '@/features/home/lib/workflowScene'

// Time between two boxes while counting, and the wait before the first one
export const DEMO_BOX_STEP_MS = 90
export const DEMO_START_DELAY_MS = 250

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Shared state of the three step pictures, so they form one flow:
// the mode from step 1 and the area from step 2 decide the result of step 3.
export function useWorkflowDemo() {
  const [mode, setMode] = useState<DemoMode>('camera')
  const [quad, setQuad] = useState<Quad>(SCENE_DEFAULT_QUAD)

  // Every count run gets a new number; 0 = nothing counted yet
  const [runId, setRunId] = useState(0)
  const [isCounting, setIsCounting] = useState(false)
  const [steppedCount, setSteppedCount] = useState(0)

  // The pill whose score is shown in step 3 (tapped box)
  const [selectedPillId, setSelectedPillId] = useState<number | null>(null)

  // The result picture: counting starts by itself the first time it comes into view
  const resultRef = useRef<HTMLDivElement>(null)

  const insidePills = pillsInside(quad)
  const liveCount = insidePills.length

  function startRun() {
    setSelectedPillId(null)
    setRunId((id) => id + 1)
    setSteppedCount(0)
    // Without animations the result is shown at once
    setIsCounting(!prefersReducedMotion())
  }

  // While counting: one more pill every DEMO_BOX_STEP_MS, until all are counted
  useEffect(() => {
    if (!isCounting) {
      return
    }

    let delay = DEMO_BOX_STEP_MS
    if (steppedCount === 0) {
      delay = DEMO_START_DELAY_MS
    }

    const timer = window.setTimeout(() => {
      const next = steppedCount + 1
      setSteppedCount(next)
      if (next >= liveCount) {
        setIsCounting(false)
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [isCounting, steppedCount, liveCount])

  // First count when the result picture is half in view (once)
  useEffect(() => {
    const element = resultRef.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect()
          startRun()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  function chooseMode(nextMode: DemoMode) {
    setMode(nextMode)
    // A new way of looking = a new count (once something has been counted)
    if (runId > 0) {
      startRun()
    }
  }

  function handleMoveCorner(corner: number, x: number, y: number) {
    setQuad((current) => moveCorner(current, corner, x, y, SCENE_LIMITS))
  }

  function resetArea() {
    setQuad(SCENE_DEFAULT_QUAD)
  }

  // What the result shows: nothing before the first run, stepping up while counting
  let shownCount = liveCount
  if (runId === 0) {
    shownCount = 0
  } else if (isCounting) {
    shownCount = Math.min(steppedCount, liveCount)
  }

  // A tapped pill only keeps its score while it is still inside the area
  let selectedPill = null
  for (const pill of insidePills) {
    if (pill.id === selectedPillId) {
      selectedPill = pill
    }
  }

  return {
    mode,
    chooseMode,
    quad,
    moveCorner: handleMoveCorner,
    resetArea,
    // Reset puts back the very same default object, so a plain comparison is enough
    isAreaChanged: quad !== SCENE_DEFAULT_QUAD,
    insidePills,
    runId,
    isCounting,
    shownCount,
    recount: startRun,
    selectedPill,
    selectPill: setSelectedPillId,
    resultRef,
  }
}
