import { describe, expect, it } from 'vitest'
import { getFrameAction, type FrameInfo } from './frameAction'

// A playing video, no seek; each test changes what it needs
const PLAYING: FrameInfo = {
  previousTime: 1.0,
  currentTime: 1.2,
  isPaused: false,
  hasSeeked: false,
  timesDetected: 1,
  neededDetections: 2,
}

describe('getFrameAction', () => {
  it('detects the first frame', () => {
    expect(getFrameAction({ ...PLAYING, previousTime: null, currentTime: 0, timesDetected: 0 })).toBe('detect')
  })

  it('detects new frames while playing', () => {
    expect(getFrameAction(PLAYING)).toBe('detect')
  })

  it('keeps detecting when a slow device makes big time steps (camera)', () => {
    expect(getFrameAction({ ...PLAYING, currentTime: 3.5 })).toBe('detect')
  })

  it('detects a paused frame until pills can be counted, then skips it', () => {
    const paused = { ...PLAYING, previousTime: 5, currentTime: 5, isPaused: true }
    expect(getFrameAction({ ...paused, timesDetected: 1 })).toBe('detect')
    expect(getFrameAction({ ...paused, timesDetected: 2 })).toBe('skip')
  })

  it('detects a frame stepped to while paused', () => {
    expect(getFrameAction({ ...PLAYING, previousTime: 5, currentTime: 5.04, isPaused: true, timesDetected: 2 })).toBe(
      'detect',
    )
  })

  it('resets tracking after a seek', () => {
    expect(getFrameAction({ ...PLAYING, hasSeeked: true })).toBe('reset')
  })
})
