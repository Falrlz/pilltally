import { ImageOff } from 'lucide-react'

// PLACEHOLDER for the hero image (pills with detection boxes and a count).
// Replace the inside of this component when the image is ready.
export function HeroVisual({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface text-muted"
    >
      <ImageOff className="size-10" aria-hidden="true" />
    </div>
  )
}
