import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { Accordion } from '@/components/ui/Accordion'
import { faqContent } from '@/content/faq.content'

// FAQ list (shown on Home): heading left, questions right on laptops
export function FaqSection() {
  const { heading, items } = useLocalized(faqContent)

  return (
    <SectionContainer className="grid gap-8 border-t border-border md:grid-cols-3">
      <h2 className="text-3xl font-bold">{heading}</h2>
      <div className="border-t border-border md:col-span-2">
        {items.map((item) => (
          <Accordion key={item.id} title={item.question}>
            <p>{item.answer}</p>
          </Accordion>
        ))}
      </div>
    </SectionContainer>
  )
}
