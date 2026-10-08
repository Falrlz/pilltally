import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'

// "Three steps, one result": 3 numbered steps
export function WorkflowSection() {
  const { workflow } = useLocalized(homeContent)

  return (
    <SectionContainer className="border-t border-border">
      <h2 className="text-3xl font-bold">{workflow.heading}</h2>
      <ol className="mt-8 grid gap-6 md:grid-cols-3">
        {workflow.steps.map((step, index) => (
          <li key={step.id}>
            <p className="text-sm font-medium text-primary">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-2 text-lg font-semibold">{step.title}</p>
            <p className="mt-2 text-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </SectionContainer>
  )
}
