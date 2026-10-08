import type { HTMLAttributes } from 'react'

// Same width and side spacing for every page section
export function SectionContainer({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16 ${className}`} {...props} />
}
