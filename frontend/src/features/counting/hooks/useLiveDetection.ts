import { useEffect, useRef, useState, type RefObject } from 'react'
import type { AreaPoint } from '../lib/countingArea'
import { addRecentCount, mostFrequentCount } from '../lib/countSmoother'
import { getFrameAction } from '../lib/frameAction'
import {
  DEFAULT_TRACKER_SETTINGS,
  EMPTY_TRACKER,
  getCountedTracks,
  updateTracks,
  type Track,
  type TrackerSettings,
} from '../lib/tracker'
import type { DetectFunction } from '../worker/detectorClient'

// What the box canvas draws. Kept in a ref (not React state): the canvas reads it
// 60 times per second without re-rendering React (see LiveBoxesCanvas.tsx).
export interface LiveFrame {
  // Counted pills; each box moves from previousBox to box
  tracks: Track[]
  // When the boxes were updated (performance.now()) and how long the move takes
  updatedAt: number
  moveMs: number
  // Size of the video frame; the boxes are in these pixels
  frameWidth: number
  frameHeight: number
}

// What the screen shows as text (updated once per detection)
export interface LiveStats {
  count: number
  trackedCount: number
  detectionsPerSecond: number
  lastTotalMs: number
  frameWidth: number
  frameHeight: number
}

// video.readyState value meaning "there is a frame to show"
const HAVE_CURRENT_DATA = 2
// Boxes never take longer than this to move to a new place
const MAX_MOVE_MS = 400

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

interface LiveDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  // Detect only while true (camera on, model ready)
  isRunning: boolean
  detect: DetectFunction
  // The model's conf_threshold (a new pill needs this score)
  confThreshold: number
  // The counting area now set (null = whole picture). A ref, so dragging the
  // points does not restart the loop.
  areaRef: RefObject<AreaPoint[] | null>
}

/**
 * Detect and track pills in a <video> (camera or video file) while isRunning is true.
 *
 * The video plays smoothly by itself; this loop takes the newest frame only
 * when the model is free, so frames never pile up (docs/web_app.md 7B).
 * The tracker (lib/tracker.ts) turns the boxes of each round into stable pills.
 * A paused video is not detected again; a seek starts the tracking from scratch.
 */
export function useLiveDetection({ videoRef, isRunning, detect, confThreshold, areaRef }: LiveDetectionOptions) {
  const liveFrameRef = useRef<LiveFrame | null>(null)
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!isRunning || video === null) {
      return
    }
    let isStopped = false
    const settings: TrackerSettings = { ...DEFAULT_TRACKER_SETTINGS, startScore: confThreshold }
    let trackerState = EMPTY_TRACKER
    // Counts of the last rounds; the screen shows the most frequent one
    let recentCounts: number[] = []
    // Times of the detections in the last second (detections per second, move time)
    const recentTimes: number[] = []
    // video.currentTime of the last detected frame, and how often it was detected
    let lastVideoTime: number | null = null
    let timesDetected = 0
    // Set by the video's "seeking" event (the user jumped in a video file)
    let hasSeeked = false

    function handleSeeking() {
      hasSeeked = true
    }
    video.addEventListener('seeking', handleSeeking)

    async function detectOnce(currentVideo: HTMLVideoElement) {
      const action = getFrameAction({
        previousTime: lastVideoTime,
        currentTime: currentVideo.currentTime,
        isPaused: currentVideo.paused,
        hasSeeked,
        timesDetected,
        neededDetections: settings.minHits,
      })
      if (action === 'skip') {
        return
      }
      if (action === 'reset') {
        hasSeeked = false
        trackerState = EMPTY_TRACKER
        recentCounts = []
        liveFrameRef.current = null
        lastVideoTime = null
        timesDetected = 0
      }

      const frameTime = currentVideo.currentTime
      // Copy of the current frame, moved to the worker without another copy
      const frame = await createImageBitmap(currentVideo)
      const result = await detect(frame, areaRef.current)
      // Stopped, or the user jumped while this frame was being detected
      if (isStopped || hasSeeked) {
        return
      }
      timesDetected = frameTime === lastVideoTime ? timesDetected + 1 : 1
      lastVideoTime = frameTime

      const now = performance.now()
      const previousTime = recentTimes.length > 0 ? recentTimes[recentTimes.length - 1] : now
      recentTimes.push(now)
      while (now - recentTimes[0] > 1000) {
        recentTimes.shift()
      }

      trackerState = updateTracks(trackerState, result.boxes, settings)
      const countedTracks = getCountedTracks(trackerState.tracks, settings.minHits)
      recentCounts = addRecentCount(recentCounts, countedTracks.length)

      liveFrameRef.current = {
        tracks: countedTracks,
        updatedAt: now,
        // Move over about the time until the next detection
        moveMs: Math.min(now - previousTime, MAX_MOVE_MS),
        frameWidth: currentVideo.videoWidth,
        frameHeight: currentVideo.videoHeight,
      }
      setStats({
        count: mostFrequentCount(recentCounts),
        trackedCount: trackerState.tracks.length,
        detectionsPerSecond: recentTimes.length,
        lastTotalMs: result.totalMs,
        frameWidth: currentVideo.videoWidth,
        frameHeight: currentVideo.videoHeight,
      })
    }

    async function detectLoop() {
      while (!isStopped) {
        const currentVideo = videoRef.current
        if (currentVideo !== null && currentVideo.readyState >= HAVE_CURRENT_DATA && currentVideo.videoWidth > 0) {
          try {
            await detectOnce(currentVideo)
          } catch {
            // Skip this frame (e.g. the camera was just switched)
          }
        }
        // Wait for the next screen refresh (also pauses while the tab is hidden)
        await waitForNextFrame()
      }
    }

    detectLoop()
    return () => {
      isStopped = true
      video.removeEventListener('seeking', handleSeeking)
      liveFrameRef.current = null
    }
  }, [videoRef, isRunning, detect, confThreshold, areaRef])

  // No old numbers after the camera or video stopped
  return { liveFrameRef, stats: isRunning ? stats : null }
}
