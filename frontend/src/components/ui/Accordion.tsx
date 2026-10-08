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
          className="flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left font-medium"
        >
          {title}
          <Plus
            aria-hidden="true"
            className={isOpen ? 'size-5 shrink-0 rotate-45 transition-transform' : 'size-5 shrink-0 transition-transform'}
          />
        </button>
      </h3>

      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-5 text-muted">
        {children}
      </div>
    </div>
  )
}
