import { Pill } from 'lucide-react'

// TEMPORARY logo: a pill icon. Replace this file when the real logo is ready.
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-lg bg-primary text-primary-foreground ${className}`}
    >
      <Pill className="size-1/2" />
    </span>
  )
}
