import { useId, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

// A row that opens and closes when its title is clicked (used by the FAQ)
export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  // Unique ids so the button and the panel are linked for screen readers
  const id = useId()
  const buttonId = `${id}-button`
  const panelId = `${id}-panel`

  return (
    <div className="border-b border-border">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
          className="group flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left font-display text-xl transition-colors duration-300 hover:text-primary"
        >
          {title}
          <Plus
            aria-hidden="true"
            strokeWidth={1.25}
            className={isOpen ? 'mt-1 size-5 shrink-0 rotate-45 text-primary transition-transform duration-300' : 'mt-1 size-5 shrink-0 transition-transform duration-300'}
          />
        </button>
      </h3>

      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-7 text-muted">
        {children}
      </div>
    </div>
  )
}
