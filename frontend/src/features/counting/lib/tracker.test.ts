import { describe, expect, it } from 'vitest'
import type { Box } from '@/services/types'
import {
  centerDistance,
  DEFAULT_TRACKER_SETTINGS,
  EMPTY_TRACKER,
  getCountedTracks,
  interpolateBox,
  updateTracks,
  type TrackerSettings,
  type TrackerState,
} from './tracker'

const SETTINGS: TrackerSettings = { ...DEFAULT_TRACKER_SETTINGS, startScore: 0.65 }

function box(x: number, score = 0.9): Box {
  // A 10 x 10 box starting at (x, 0)
  return { x1: x, y1: 0, x2: x + 10, y2: 10, score }
}

// Run several detection rounds and return the final state
function runRounds(rounds: Box[][]): TrackerState {
  let state = EMPTY_TRACKER
  for (const detections of rounds) {
    state = updateTracks(state, detections, SETTINGS)
  }
  return state
}

function countedCount(state: TrackerState): number {
  return getCountedTracks(state.tracks, SETTINGS.minHits).length
}

describe('updateTracks', () => {
  it('starts a new pill only when the score reaches startScore', () => {
    const state = runRounds([[box(0, 0.9), box(50, 0.5)]])
    expect(state.tracks).toHaveLength(1)
    expect(state.tracks[0].box.x1).toBe(0)
  })

  it('counts a pill only after it was seen minHits times', () => {
    expect(countedCount(runRounds([[box(0)]]))).toBe(0)
    expect(countedCount(runRounds([[box(0)], [box(0)]]))).toBe(1)
  })

  it('keeps the same id when the pill moves a little', () => {
    const state = runRounds([[box(0)], [box(2)]])
    expect(state.tracks).toHaveLength(1)
    expect(state.tracks[0].id).toBe(1)
    expect(state.tracks[0].box.x1).toBe(2)
    expect(state.tracks[0].previousBox.x1).toBe(0)
  })

  it('keeps a tracked pill while its score stays above keepScore (hysteresis)', () => {
    // 0.5 would not start a pill, but keeps one that is already tracked
    const state = runRounds([[box(0)], [box(0)], [box(0, 0.5)], [box(0, 0.5)]])
    expect(countedCount(state)).toBe(1)
  })

  it('remembers a missing pill for maxMisses rounds, then forgets it', () => {
    const seen = [[box(0)], [box(0)]]
    expect(runRounds([...seen, [], [], []]).tracks).toHaveLength(1) // 3 misses: remembered
    expect(runRounds([...seen, [], [], [], []]).tracks).toHaveLength(0) // 4 misses: forgotten
  })

  it('does not count a pill while it is missing', () => {
    expect(countedCount(runRounds([[box(0)], [box(0)], []]))).toBe(0)
  })

  it('counts a remembered pill again at once when it comes back', () => {
    // Without memory it would need minHits new rounds first
    expect(countedCount(runRounds([[box(0)], [box(0)], [], [box(0)]]))).toBe(1)
  })

  it('follows a pill that moved almost one pill size (boxes no longer overlap much)', () => {
    // 10 px wide pill moved 8 px: IoU is only 0.11, but it is the same pill
    const state = runRounds([[box(0)], [box(8)]])
    expect(state.tracks).toHaveLength(1)
    expect(state.tracks[0].box.x1).toBe(8)
  })

  it('does not count a moving pill twice', () => {
    // Moving 8 px per round for 4 rounds: still one pill
    const state = runRounds([[box(0)], [box(8)], [box(16)], [box(24)]])
    expect(state.tracks).toHaveLength(1)
    expect(countedCount(state)).toBe(1)
  })

  it('treats a box more than maxMove pill sizes away as another pill', () => {
    // 15 px = 1.5 pill sizes
    const state = runRounds([[box(0)], [box(15)]])
    expect(state.tracks).toHaveLength(2)
  })

  it('starts a new pill for a box far away from the tracked ones', () => {
    const state = runRounds([[box(0)], [box(0), box(100)]])
    expect(state.tracks).toHaveLength(2)
    expect(state.tracks[1].id).toBe(2)
  })

  it('matches each box to one pill only', () => {
    // Two pills side by side, two boxes: no pill may take both boxes
    const state = runRounds([
      [box(0), box(30)],
      [box(1), box(31)],
    ])
    expect(state.tracks.map((track) => track.id)).toEqual([1, 2])
    expect(state.tracks.map((track) => track.box.x1)).toEqual([1, 31])
  })

  it('does not change the old state', () => {
    const first = runRounds([[box(0)]])
    const firstTracksCopy = JSON.stringify(first)
    updateTracks(first, [box(5)], SETTINGS)
    expect(JSON.stringify(first)).toBe(firstTracksCopy)
  })
})

describe('centerDistance', () => {
  it('is measured in sizes of the first box', () => {
    expect(centerDistance(box(0), box(0))).toBe(0)
    expect(centerDistance(box(0), box(10))).toBe(1)
    expect(centerDistance(box(0), box(5))).toBe(0.5)
  })
})

describe('interpolateBox', () => {
  it('moves part of the way', () => {
    const middle = interpolateBox(box(0), box(10), 0.5)
    expect(middle.x1).toBe(5)
    expect(middle.x2).toBe(15)
  })

  it('stays at the end after progress 1', () => {
    expect(interpolateBox(box(0), box(10), 2).x1).toBe(10)
    expect(interpolateBox(box(0), box(10), -1).x1).toBe(0)
  })
})
