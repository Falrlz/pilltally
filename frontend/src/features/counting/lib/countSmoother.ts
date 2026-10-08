// A steady number for the screen from the counts of the last detection rounds

// About one second of detections (at ~5 detections per second)
export const COUNT_WINDOW = 5

/**
 * The count that appears most often in the recent rounds.
 * When two counts appear equally often, the more recent one wins.
 *
 * Example: mostFrequentCount([12, 12, 11, 12, 13]) -> 12 (one wrong frame is ignored)
 */
export function mostFrequentCount(recentCounts: number[]): number {
  if (recentCounts.length === 0) {
    return 0
  }

  // How often each count appears, and the last round it appeared in
  const timesSeen = new Map<number, number>()
  const lastSeenAt = new Map<number, number>()
  for (let i = 0; i < recentCounts.length; i++) {
    const count = recentCounts[i]
    timesSeen.set(count, (timesSeen.get(count) ?? 0) + 1)
    lastSeenAt.set(count, i)
  }

  let bestCount = recentCounts[recentCounts.length - 1]
  for (const [count, times] of timesSeen) {
    const bestTimes = timesSeen.get(bestCount) ?? 0
    const isMoreFrequent = times > bestTimes
    const isAsFrequentButNewer = times === bestTimes && (lastSeenAt.get(count) ?? 0) > (lastSeenAt.get(bestCount) ?? 0)
    if (isMoreFrequent || isAsFrequentButNewer) {
      bestCount = count
    }
  }
  return bestCount
}

// Add a count to the recent list, keeping only the last `window` counts
export function addRecentCount(recentCounts: number[], count: number, window = COUNT_WINDOW): number[] {
  const updated = [...recentCounts, count]
  while (updated.length > window) {
    updated.shift()
  }
  return updated
}
