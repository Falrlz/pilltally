import { useEffect, useRef, useState } from 'react'
import { LOOP_START_QUAD, loopFrame, type LoopFrame } from '@/features/home/lib/areaLoop'
import type { Quad } from '@/features/home/lib/trayScene'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// State of the looping counting-area demo. It plays only while the picture
// is on screen. It is an animation only: the reader just watches.
// Without animations (reduced motion) the picture stays still.
export function useAreaLoop() {
  const [quad, setQuad] = useState<Quad>(LOOP_START_QUAD)
  const [hand, setHand] = useState<Pick<LoopFrame, 'corner' | 'isPressed'>>({ corner: null, isPressed: false })

  // The picture, to know whether it is on screen
  const pictureRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }
    const picture = pictureRef.current
    if (!picture) {
      return
    }

    let isOnScreen = false
    let elapsedMs = 0
    let lastTime = 0
    let frame = 0

    function tick(time: number) {
      // Time only runs while the picture is on screen
      if (isOnScreen && lastTime !== 0) {
        elapsedMs += time - lastTime
        const next = loopFrame(elapsedMs, LOOP_START_QUAD)
        setQuad(next.quad)
        setHand({ corner: next.corner, isPressed: next.isPressed })
      }
      lastTime = time
      frame = window.requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver((entries) => {
      isOnScreen = entries[0].isIntersecting
    })
    observer.observe(picture)
    frame = window.requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return { quad, hand, pictureRef }
}
