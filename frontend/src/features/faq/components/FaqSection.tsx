import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { Accordion } from '@/components/ui/Accordion'
import { faqContent } from '@/content/faq.content'

// FAQ list (shown on Home): heading left (sticky), questions right on laptops
export function FaqSection() {
  const { heading, items } = useLocalized(faqContent)

  return (
    <SectionContainer className="grid gap-10 border-t border-border md:py-20 lg:grid-cols-12">
      {/* Laptops: the heading stays in view while the questions scroll, like the About chapters */}
      <div className="lg:col-span-4">
        <h2 className="text-4xl leading-[1.1] md:text-5xl lg:sticky lg:top-24">{heading}</h2>
      </div>
      <div className="border-t border-foreground/70 lg:col-span-8">
        {items.map((item) => (
          <Accordion key={item.id} title={item.question}>
            <p className="max-w-[62ch] leading-relaxed">{item.answer}</p>
          </Accordion>
        ))}
      </div>
    </SectionContainer>
  )
}
