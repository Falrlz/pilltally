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
    <div ref={rootRef} data-open={isOpen} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={settings.title}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
        className={
          isOpen
            ? 'flex size-11 cursor-pointer items-center justify-center bg-surface text-primary transition-[color,background-color,scale] duration-200 active:scale-90'
            : 'flex size-11 cursor-pointer items-center justify-center text-muted transition-[color,background-color,scale] duration-200 hover:text-foreground active:scale-90'
        }
      >
        {/* The gear turns a quarter with a small mechanical click (the same curve as
            the hero word) and stays turned while the panel is open */}
        <Settings
          className={
            isOpen
              ? 'size-5 rotate-90 transition-transform duration-700 ease-click motion-reduce:rotate-0'
              : 'size-5 rotate-0 transition-transform duration-500 ease-settle'
          }
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {/* Always rendered so it can animate out; hidden (and out of the tab order)
          while closed. The unfold animation lives in index.css (.settings-sheet). */}
      <div
        id={panelId}
        className="settings-sheet absolute top-full right-0 z-50 mt-2 w-80 border border-border bg-background p-5 shadow-[0_12px_32px_-12px_rgb(0_0_0_/0.25)]"
      >
        <SettingsPanel />
      </div>
    </div>
  )
}
