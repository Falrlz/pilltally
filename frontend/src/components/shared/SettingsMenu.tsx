import { useEffect, useId, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { useLocalized } from '@/app/providers/localeContext'
import { uiContent } from '@/content/ui.content'
import { SettingsPanel } from './SettingsPanel'

// Gear button in the navbar (laptop) that opens a small settings panel
export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings } = useLocalized(uiContent)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // While open: close on a click outside the menu or on the Escape key
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const clickedInside = rootRef.current?.contains(event.target as Node)
      if (!clickedInside) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={settings.title}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
      >
        <Settings className="size-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-background p-4 shadow-lg"
        >
          <SettingsPanel />
        </div>
      )}
    </div>
  )
}
