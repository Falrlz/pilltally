import { FaqSection } from '@/features/faq/components/FaqSection'
import { AreaSection } from '@/features/home/components/AreaSection'
import { CtaSection } from '@/features/home/components/CtaSection'
import { HeroSection } from '@/features/home/components/HeroSection'
import { ModesSection } from '@/features/home/components/ModesSection'
import { WorkflowSection } from '@/features/home/components/WorkflowSection'
import { usePrefetchDetector } from '@/features/counting/hooks/usePrefetchDetector'

// A page only arranges sections; the sections live in features/
export default function HomePage() {
  // Download the model for the Count page while the user reads (stage 1)
  usePrefetchDetector()

  return (
    <>
      <HeroSection />
      <ModesSection />
      <AreaSection />
      <WorkflowSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
