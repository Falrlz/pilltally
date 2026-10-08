// Keyboard helper for rows of options (SegmentedControl, Tabs)

const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp']

/**
 * The index to move to after an arrow key, or null for other keys.
 * Wraps around: after the last option comes the first again.
 *
 * Example: getArrowKeyIndex('ArrowRight', 2, 3) -> 0
 */
export function getArrowKeyIndex(key: string, currentIndex: number, count: number): number | null {
  if (NEXT_KEYS.includes(key)) {
    return (currentIndex + 1) % count
  }
  if (PREVIOUS_KEYS.includes(key)) {
    return (currentIndex - 1 + count) % count
  }
  return null
}
