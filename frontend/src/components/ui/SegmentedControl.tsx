import type { KeyboardEvent, ReactNode } from 'react'
import { getArrowKeyIndex } from './arrowKeys'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  lang?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * A row of options where exactly one is chosen (like radio buttons).
 * Used for the language switch and the theme switch.
 * Keyboard: arrow keys move to the previous/next option.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = options.findIndex((option) => option.value === value)
    const nextIndex = getArrowKeyIndex(event.key, currentIndex, options.length)
    if (nextIndex === null) {
      return
    }
    event.preventDefault()

    const nextOption = options[nextIndex]

    onChange(nextOption.value)
    const nextButton = event.currentTarget.querySelector<HTMLButtonElement>(
      `[data-value="${nextOption.value}"]`,
    )
    nextButton?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="grid auto-cols-fr grid-flow-col gap-1 border border-border p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            // Only the chosen option is reachable with Tab; arrows move inside
            tabIndex={isActive ? 0 : -1}
            data-value={option.value}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? 'flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 bg-primary px-2 text-sm font-medium text-primary-foreground'
                : 'flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 px-2 text-sm text-muted transition-colors duration-300 hover:text-foreground'
            }
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
