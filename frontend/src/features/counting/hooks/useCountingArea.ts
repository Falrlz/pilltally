import { useEffect, useRef, useState } from 'react'
import { clampAreaPoint, DEFAULT_AREA, type AreaPoint } from '../lib/countingArea'

/**
 * The counting area of the Count page: on/off + its 4 points.
 * One area for all tabs (camera, image, video).
 */
export function useCountingArea() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [points, setPoints] = useState<AreaPoint[]>(DEFAULT_AREA)

  // The area to use (null when off)
  const activeArea = isEnabled ? points : null

  // The same, for loops that must not restart on every drag (useLiveDetection)
  const activeAreaRef = useRef<AreaPoint[] | null>(activeArea)
  useEffect(() => {
    activeAreaRef.current = activeArea
  }, [activeArea])

  function toggle() {
    setIsEnabled(!isEnabled)
  }

  function reset() {
    setPoints(DEFAULT_AREA)
  }

  // Move one corner; it always stays inside the picture
  function movePoint(index: number, point: AreaPoint) {
    const nextPoints = [...points]
    nextPoints[index] = clampAreaPoint(point)
    setPoints(nextPoints)
  }

  return { isEnabled, points, activeArea, activeAreaRef, toggle, reset, movePoint }
}

export type CountingAreaControl = ReturnType<typeof useCountingArea>
