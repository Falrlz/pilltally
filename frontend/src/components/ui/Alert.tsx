import type { ReactNode } from 'react'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'

type AlertVariant = 'info' | 'warning' | 'danger'

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: 'border-border text-foreground',
  warning: 'border-warning text-foreground',
  danger: 'border-danger text-danger',
}

const VARIANT_ICONS = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
}

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
}

// A message box: information, warning (disclaimer) or error
export function Alert({ variant = 'info', children }: AlertProps) {
  const Icon = VARIANT_ICONS[variant]

  return (
    <div
      // Errors are read out by screen readers right away
      role={variant === 'danger' ? 'alert' : undefined}
      className={`flex gap-3 border bg-surface p-4 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
