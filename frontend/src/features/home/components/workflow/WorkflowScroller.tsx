import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface Step {
  id: string
  title: string
  description: string
}

interface WorkflowScrollerProps {
  heading: string
  steps: Step[]
  // One picture per step, in the same order
  pictures: ReactNode[]
  // Called when the reader scrolls into the last step (the result)
  onReachResult: () => void
}

// Height of the sticky navbar (h-16): the pinned view starts right under it
const NAVBAR_HEIGHT_PX = 64

// How much scrolling each step gets while the view is pinned
const SCROLL_PER_STEP_SVH = 70

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Laptop layout of "Three steps, one result". The whole section is pinned
// to the screen while the reader scrolls through a tall track: the heading,
// the three steps and the picture all stay in view, and scrolling drives the
// story. The rail between the numbers fills with iris as you scroll, the
// current step opens (its description shows), the others
// fold away, and the picture on the right follows. After step 3 the page
// scrolls on as usual.
export function WorkflowScroller({ heading, steps, pictures, onReachResult }: WorkflowScrollerProps) {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastStep = steps.length - 1

  // Runs with the newest props, without restarting the scroll listener below
  const handleProgress = useEffectEvent((progress: number) => {
    const index = Math.min(Math.floor(progress * steps.length), lastStep)
    if (index === activeStep) {
      return
    }
    setActiveStep(index)
    if (index === lastStep) {
      onReachResult()
    }
  })

  // On every scroll (at most once per frame): how far through the track are we?
  // 0 = the view just got pinned, 1 = the last step is done.
  useEffect(() => {
    let frame = 0

    function measure() {
      frame = 0
      const track = trackRef.current
      if (!track) {
        return
      }

      const rect = track.getBoundingClientRect()
      const pinnedHeight = window.innerHeight - NAVBAR_HEIGHT_PX
      const travel = rect.height - pinnedHeight
      const progress = clamp((NAVBAR_HEIGHT_PX - rect.top) / travel, 0, 1)

      // Rail pieces fill straight from the scroll position (no React render):
      // piece i fills while step i is being read
      for (let index = 0; index < lastStep; index++) {
        const fill = clamp(progress * steps.length - index, 0, 1)
        track.style.setProperty(`--rail-${index}`, String(fill))
      }

      handleProgress(progress)
    }

    function onScroll() {
      if (frame === 0) {
        frame = window.requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [lastStep, steps.length])

  // Clicking a step scrolls to the middle of that step's part of the track
  function goToStep(index: number) {
    const track = trackRef.current
    if (!track) {
      return
    }
    const trackTop = track.getBoundingClientRect().top + window.scrollY
    const travel = track.offsetHeight - (window.innerHeight - NAVBAR_HEIGHT_PX)
    const target = trackTop - NAVBAR_HEIGHT_PX + ((index + 0.5) / steps.length) * travel

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  // Track = the pinned view plus the scrolling each step gets
  const trackStyle: CSSProperties = {
    height: `calc(100svh - ${NAVBAR_HEIGHT_PX}px + ${steps.length * SCROLL_PER_STEP_SVH}svh)`,
  }

  return (
    <div ref={trackRef} style={trackStyle}>
      <div className="sticky top-16 grid h-[calc(100svh-4rem)] grid-cols-12 items-center gap-x-14 py-8">
        <div className="col-span-5">
          <h2 className="text-5xl leading-[1.1]">{heading}</h2>

          <ol className="mt-12 short:mt-8">
            {steps.map((step, index) => {
              const isActive = index === activeStep
              const isLast = index === lastStep

              return (
                <li key={step.id} className={`relative ${isLast ? '' : 'pb-8'}`}>
                  {/* Rail down to the next number, filled by scrolling */}
                  {!isLast && (
                    <span aria-hidden="true" className="absolute top-14 bottom-0 left-[27px] w-0.5 bg-foreground/20">
                      <span
                        className="block h-full w-0.5 origin-top bg-primary"
                        style={{ transform: `scaleY(var(--rail-${index}, 0))` }}
                      />
                    </span>
                  )}

                  <button
                    type="button"
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => goToStep(index)}
                    className="group flex w-full cursor-pointer gap-6 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-14 shrink-0 items-center justify-center border font-display text-2xl leading-none tabular-nums transition-colors duration-500 ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-foreground/40 bg-background text-muted group-hover:border-primary group-hover:text-primary'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span className="min-w-0 pt-2.5">
                      <span
                        className={`block origin-left font-display text-3xl leading-tight transition-[color,scale] duration-500 ease-settle ${
                          isActive ? 'text-foreground' : 'scale-[0.8] text-muted group-hover:text-foreground'
                        }`}
                      >
                        {step.title}
                      </span>

                      {/* Opens for the current step only (rows 0fr → 1fr) */}
                      <span
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-settle ${
                          isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <span className="overflow-hidden">
                          <span className="mt-3 block max-w-[34ch] text-lg leading-relaxed text-muted">
                            {step.description}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        {/* The stage: the picture of the current step.
            Its width is capped so the WHOLE panel fits in the window, whatever the
            window height (bookmark bar, taskbar, display scaling). Height budget:
            window − navbar (4rem) − room above and below (3rem) − panel padding and
            border (~2.6rem) − controls under the picture (~8rem) = 100svh − 18rem
            for the drawing; the drawing is 320 × 220, plus the padding back on the width.
            It sits on the left of its column, on the same line as the other pictures. */}
        <div className="col-span-7">
          <div className="plaster-recess grid max-w-[calc((100svh_-_18rem)*320/220_+_2.625rem)] border border-border p-5">
            {pictures.map((picture, index) => {
              const isActive = index === activeStep
              return (
                // All pictures share one grid cell; only the active one is shown and usable
                <div
                  key={steps[index].id}
                  inert={!isActive}
                  className={`col-start-1 row-start-1 transition-[opacity,translate] duration-500 ease-settle ${
                    isActive ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0 motion-reduce:translate-y-0'
                  }`}
                >
                  {picture}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
