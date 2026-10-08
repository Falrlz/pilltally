import type { ReactNode } from 'react'

interface ChapterProps {
  heading: string
  subline: string
  children: ReactNode
}

// One chapter of the About page: heading on the left (stays in view while
// scrolling on laptops), content on the right
export function Chapter({ heading, subline, children }: ChapterProps) {
  return (
    <section className="grid gap-x-8 gap-y-6 border-b border-border py-14 md:py-20 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <h2 className="max-w-[18ch] text-3xl font-bold leading-tight md:text-4xl">{heading}</h2>
          <p className="mt-3 text-muted">{subline}</p>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  )
}

// The large opening paragraph of a chapter
export function ChapterLede({ children }: { children: ReactNode }) {
  return <p className="max-w-[62ch] text-lg leading-relaxed md:text-xl">{children}</p>
}
