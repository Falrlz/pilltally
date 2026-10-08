import { useEffect, useRef, type RefObject } from 'react'
import type { LiveFrame } from '../hooks/useLiveDetection'
import { interpolateBox } from '../lib/tracker'

const LINE_WIDTH = 3

/**
 * The boxes over the live video, drawn on a canvas at every screen refresh
 * (about 60 times per second). Between two detections each box slides from
 * its old place to its new place, so it does not jump.
 *
 * The parent must be `relative`, and the video must keep its aspect ratio.
 */
export function LiveBoxesCanvas({ liveFrameRef }: { liveFrameRef: RefObject<LiveFrame | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animationId = 0

    function draw() {
      animationId = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (canvas === null || context === null || context === undefined) {
        return
      }

      // Canvas pixels = shown size x screen density, for sharp lines
      const pixelRatio = window.devicePixelRatio || 1
      const width = Math.round(canvas.clientWidth * pixelRatio)
      const height = Math.round(canvas.clientHeight * pixelRatio)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      context.clearRect(0, 0, width, height)

      const liveFrame = liveFrameRef.current
      if (liveFrame === null) {
        return
      }

      // Video frame pixels -> canvas pixels
      const scale = width / liveFrame.frameWidth
      const progress = liveFrame.moveMs > 0 ? (performance.now() - liveFrame.updatedAt) / liveFrame.moveMs : 1

      // Same color as the image mode boxes (--detection in styles/theme.css)
      context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--detection')
      context.lineWidth = LINE_WIDTH * pixelRatio

      for (const track of liveFrame.tracks) {
        const box = interpolateBox(track.previousBox, track.box, progress)
        context.strokeRect(box.x1 * scale, box.y1 * scale, (box.x2 - box.x1) * scale, (box.y2 - box.y1) * scale)
      }
    }

    draw()
    return () => cancelAnimationFrame(animationId)
  }, [liveFrameRef])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />
}
