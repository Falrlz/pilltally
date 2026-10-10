import type { KeyboardEvent, ReactNode } from 'react'
import { getArrowKeyIndex } from './arrowKeys'

export interface TabItem<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface TabsProps<T extends string> {
  label: string
  // Used to link each tab to its panel: tab id = `${idPrefix}-tab-${value}`
  idPrefix: string
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * A row of tabs. Only the tab buttons are drawn here; the parent shows the
 * panel of the chosen tab with id `${idPrefix}-panel-${value}`.
 * Keyboard: arrow keys move to the previous/next tab.
 */
export function Tabs<T extends string>({ label, idPrefix, tabs, value, onChange }: TabsProps<T>) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.value === value)
    const nextIndex = getArrowKeyIndex(event.key, currentIndex, tabs.length)
    if (nextIndex === null) {
      return
    }
    event.preventDefault()

    const nextTab = tabs[nextIndex]
    onChange(nextTab.value)
    document.getElementById(`${idPrefix}-tab-${nextTab.value}`)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className="flex border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.value}`}
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.value}`}
            // Only the chosen tab is reachable with Tab; arrows move inside
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={
              isActive
                ? '-mb-px flex flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 border-primary py-3 font-medium text-primary'
                : '-mb-px flex flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 border-transparent py-3 text-muted hover:text-foreground'
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
