// What the live loop does with the frame now shown in a <video> (camera or video file)

// 'detect': detect this frame
// 'skip': paused on a frame that was already detected enough times, nothing to do
// 'reset': the user jumped in the video (seek), start tracking from scratch, then detect
export type FrameAction = 'detect' | 'skip' | 'reset'

export interface FrameInfo {
  // video.currentTime at the last detection (null = none yet)
  previousTime: number | null
  // video.currentTime now
  currentTime: number
  // video.paused
  isPaused: boolean
  // The video fired a "seeking" event since the last detection
  hasSeeked: boolean
  // How many times the frame at previousTime was detected in a row
  timesDetected: number
  // How many detections a pill needs before it is counted (tracker minHits)
  neededDetections: number
}

/**
 * A seek is told by the video's own event, not by the size of the time jump:
 * on a slow phone the camera time can also move more than a second between
 * two detections, and that must not reset the tracking.
 *
 * A paused frame is detected a few times (until pills can be counted),
 * then skipped to save battery.
 */
export function getFrameAction(frame: FrameInfo): FrameAction {
  if (frame.hasSeeked) {
    return 'reset'
  }
  const isSameFrame = frame.previousTime !== null && frame.currentTime === frame.previousTime
  if (frame.isPaused && isSameFrame && frame.timesDetected >= frame.neededDetections) {
    return 'skip'
  }
  return 'detect'
}
