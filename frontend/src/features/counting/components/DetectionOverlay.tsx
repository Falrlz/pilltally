import type { ReactNode } from 'react'
import type { Box } from '@/services/types'
import { BoxesLayer } from './BoxesLayer'

interface DetectionOverlayProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  boxes: Box[]
  alt: string
  // Extra layers on top of the image (e.g. the counting area editor)
  children?: ReactNode
}

// An image with a box drawn on every detected pill
export function DetectionOverlay({ imageUrl, imageWidth, imageHeight, boxes, alt, children }: DetectionOverlayProps) {
  return (
    <div className="relative">
      <img src={imageUrl} alt={alt} width={imageWidth} height={imageHeight} className="block h-auto w-full rounded-xl" />
      <BoxesLayer width={imageWidth} height={imageHeight} boxes={boxes} />
      {children}
    </div>
  )
}
