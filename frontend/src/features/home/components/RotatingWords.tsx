import { useEffect, useState, type CSSProperties } from 'react'

// How long one word stays before the next one turns in
const WORD_DURATION_MS = 3200

// Each letter starts turning this much later than the letter on its left,
// so the turn runs across the word like a Rubik's cube being twisted
const LETTER_DELAY_MS = 60

// Shows one word at a time. Every 3.2 s the next word turns in like a row of
// Rubik's cubes, one cube per letter: the old letter sits on the front face,
// the new letter on the bottom face, and each cube rolls up a quarter turn.
// Hidden from screen readers: the hero title gives them all words at once.
export function RotatingWords({ words }: { words: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTurning, setIsTurning] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % words.length)

      // Users who turned animations off get a soft fade instead of the turn
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersReducedMotion) {
        setIsTurning(true)
      }
    }, WORD_DURATION_MS)

    return () => window.clearInterval(timer)
  }, [words.length])

  const previousIndex = (activeIndex - 1 + words.length) % words.length
  const fromWord = words[previousIndex]
  const toWord = words[activeIndex]

  // One cube per letter of the longer word; a shorter word leaves its last faces empty
  const cubeCount = Math.max(fromWord.length, toWord.length)
  const lastCube = cubeCount - 1

  return (
    <span aria-hidden="true" className="relative grid text-primary">
      {/* Invisible copies of every word give the box the size of the longest one */}
      {words.map((word) => (
        <span key={word} className="invisible col-start-1 row-start-1">
          {word}
        </span>
      ))}

      {isTurning ? (
        // The cubes, only while turning. One shared perspective for all cubes.
        <span key={activeIndex} className="absolute inset-0 perspective-[900px]">
          {Array.from({ length: cubeCount }, (_, letterIndex) => (
            <LetterCube
              key={letterIndex}
              letterIndex={letterIndex}
              fromWord={fromWord}
              toWord={toWord}
              // When the last cube lands, go back to plain text
              onTurnEnd={letterIndex === lastCube ? () => setIsTurning(false) : undefined}
            />
          ))}
        </span>
      ) : (
        // At rest: the word as plain text (fades in when the turn was skipped)
        <span key={activeIndex} className="absolute inset-0 motion-reduce:animate-word-fade">
          {toWord}
        </span>
      )}
    </span>
  )
}

interface LetterCubeProps {
  letterIndex: number
  fromWord: string
  toWord: string
  onTurnEnd?: () => void
}

// The cube for one letter position, turning a quarter up.
// It turns around a horizontal line, so it does not need its own width:
// each face holds the whole word and shows only this one letter.
function LetterCube({ letterIndex, fromWord, toWord, onTurnEnd }: LetterCubeProps) {
  // The cube and both faces start together, later for letters further right
  const delayStyle: CSSProperties = { animationDelay: `${letterIndex * LETTER_DELAY_MS}ms` }

  return (
    <span
      className="absolute inset-0 transform-3d animate-cube-turn"
      style={delayStyle}
      onAnimationEnd={(event) => {
        // The faces run their own animations; only react to the cube's turn
        if (event.target === event.currentTarget && onTurnEnd) {
          onTurnEnd()
        }
      }}
    >
      {/* Front face: the old letter, rolls up and darkens */}
      <span className="cube-face-front absolute inset-0 backface-hidden animate-cube-face-out" style={delayStyle}>
        <OneLetterVisible word={fromWord} letterIndex={letterIndex} />
      </span>
      {/* Bottom face: the new letter, rolls up into view and brightens */}
      <span className="cube-face-bottom absolute inset-0 backface-hidden animate-cube-face-in" style={delayStyle}>
        <OneLetterVisible word={toWord} letterIndex={letterIndex} />
      </span>
    </span>
  )
}

// Writes the whole word but makes every letter transparent except one.
// The hidden letters still take their space, so the visible letter sits
// exactly where it sits in plain text (same spacing, nothing cut off).
function OneLetterVisible({ word, letterIndex }: { word: string; letterIndex: number }) {
  const letters = word.split('')

  return (
    <>
      {letters.map((letter, index) => {
        const colorClass = index === letterIndex ? '' : 'text-transparent'
        return (
          <span key={index} className={colorClass}>
            {letter}
          </span>
        )
      })}
    </>
  )
}
