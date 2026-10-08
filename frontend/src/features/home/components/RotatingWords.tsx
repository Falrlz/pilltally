import { useEffect, useState } from 'react'

// How long one word stays before the next one rolls in
const WORD_DURATION_MS = 2500

// Shows one word at a time and rolls in the next one every 2.5 s.
// All words sit in the same grid cell, so the height never changes.
// Hidden from screen readers: the hero title gives them all words at once.
export function RotatingWords({ words }: { words: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % words.length)
    }, WORD_DURATION_MS)

    return () => window.clearInterval(timer)
  }, [words.length])

  return (
    <span aria-hidden="true" className="grid">
      {words.map((word, index) => {
        const isActive = index === activeIndex

        // Only the active word is visible; it plays the roll-in animation
        // (skipped when the user turned animations off in their device)
        const stateClass = isActive ? 'text-primary motion-safe:animate-word-in' : 'invisible'

        return (
          <span key={word} className={`col-start-1 row-start-1 ${stateClass}`}>
            {word}
          </span>
        )
      })}
    </span>
  )
}
