import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'

// "Three steps, one result": one flow, 1 → 2 → 3. A single hairline runs
// through the numbers so they read as a sequence, not as three separate cards.
export function WorkflowSection() {
  const { workflow } = useLocalized(homeContent)

  return (
    <SectionContainer className="border-t border-border md:py-20">
      <h2 className="text-4xl leading-[1.1] md:text-5xl">{workflow.heading}</h2>

      <ol className="relative mt-10 grid gap-8 md:mt-12 md:grid-cols-3 md:gap-10">
        {/* The line that joins the numbers (laptops); on phones the steps stack */}
        <span aria-hidden="true" className="absolute top-8 right-0 left-0 hidden h-px bg-foreground/40 md:block" />

        {workflow.steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-5 md:block">
            {/* The number sits on the line, cut out of it by the page color */}
            <p
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center border border-foreground/70 bg-background font-display text-3xl leading-none tabular-nums"
            >
              {index + 1}
            </p>
            <div className="md:mt-7">
              <p className="font-display text-2xl">{step.title}</p>
              <p className="mt-2 max-w-[32ch] text-lg leading-relaxed text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionContainer>
  )
}
