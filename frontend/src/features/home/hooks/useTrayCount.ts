import { useEffect, useState } from 'react'
import { countInside, DEFAULT_QUAD, moveCorner, PILLS, type Quad } from '@/features/home/lib/trayScene'

// Time between two boxes in the opening sequence, and the wait before the first one
export const BOX_STEP_MS = 80
const INTRO_DELAY_MS = 300

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// State of the hero tray: the 4-point counting area, the live count, and the
// opening sequence where the count steps up while the boxes settle.
export function useTrayCount() {
  const [quad, setQuad] = useState<Quad>(DEFAULT_QUAD)
  const [isIntro, setIsIntro] = useState(() => !prefersReducedMotion())
  const [introCount, setIntroCount] = useState(0)

  const count = countInside(PILLS, quad)

  // Opening sequence: one more pill counted every BOX_STEP_MS
  useEffect(() => {
    if (!isIntro) {
      return
    }

    const total = countInside(PILLS, DEFAULT_QUAD)
    let shown = 0
    let timer = 0

    function step() {
      shown += 1
      setIntroCount(shown)
      if (shown < total) {
        timer = window.setTimeout(step, BOX_STEP_MS)
      } else {
        setIsIntro(false)
      }
    }

    timer = window.setTimeout(step, INTRO_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isIntro])

  function handleMoveCorner(corner: number, x: number, y: number) {
    // Touching the area ends the opening sequence right away
    setIsIntro(false)
    setQuad((current) => moveCorner(current, corner, x, y))
  }

  return {
    quad,
    isIntro,
    shownCount: isIntro ? introCount : count,
    introDelayMs: INTRO_DELAY_MS,
    moveCorner: handleMoveCorner,
  }
}
