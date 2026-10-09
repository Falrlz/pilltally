import type { ReactNode } from 'react'

interface Step {
  id: string
  title: string
  description: string
}

interface WorkflowStackProps {
  steps: Step[]
  // One picture per step, in the same order
  pictures: ReactNode[]
}

// Phone and tablet layout of "Three steps, one result": the steps stacked,
// each with its picture right below it
export function WorkflowStack({ steps, pictures }: WorkflowStackProps) {
  return (
    <ol className="mt-10 grid gap-14 md:mt-12">
      {steps.map((step, index) => (
        <li key={step.id}>
          <div className="flex gap-5">
            <p
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center border border-foreground/70 bg-background font-display text-3xl leading-none tabular-nums"
            >
              {index + 1}
            </p>
            <div>
              <p className="font-display text-2xl">{step.title}</p>
              <p className="mt-2 max-w-[32ch] text-lg leading-relaxed text-muted">{step.description}</p>
            </div>
          </div>

          {/* The picture: a recessed plaster panel, like the hero's alcove */}
          <figure className="plaster-recess mt-6 max-w-md border border-border p-4">{pictures[index]}</figure>
        </li>
      ))}
    </ol>
  )
}
