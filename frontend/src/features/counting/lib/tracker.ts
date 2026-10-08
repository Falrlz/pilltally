/**
 * Pill tracking for the live camera and video (docs/web_app.md section 6).
 *
 * Every detection round, new boxes are matched with the pills already tracked.
 * This keeps the count stable when a pill's score dips for a moment or one
 * frame misses it, and gives every pill an id so its box can move smoothly.
 */

import type { Box } from '@/services/types'

export interface TrackerSettings {
  // A NEW pill needs at least this score (the model's conf_threshold, 0.65)
  startScore: number
  // A pill already tracked stays while its score is at least this (hysteresis)
  keepScore: number
  // How far a pill may move between two detections, in pill sizes.
  // Distance is used instead of box overlap: when the camera or video moves,
  // a pill can shift so far in 0.2 s that its old and new box no longer overlap,
  // and it would be counted twice (found in the video test, step 10).
  maxMove: number
  // A pill not seen in this many rounds in a row is removed
  maxMisses: number
  // A pill is counted after it was seen in this many rounds (one wrong frame is not counted)
  minHits: number
}

// Starting values; tune them with real phone tests (docs/web_app.md section 11, step 13)
export const DEFAULT_TRACKER_SETTINGS: Omit<TrackerSettings, 'startScore'> = {
  keepScore: 0.4,
  maxMove: 1,
  maxMisses: 3,
  minHits: 2,
}

export interface Track {
  id: number
  // Where the pill was found last
  box: Box
  // Where it was found the round before (the box moves from here to `box`)
  previousBox: Box
  hits: number
  misses: number
}

export interface TrackerState {
  tracks: Track[]
  nextId: number
}

export const EMPTY_TRACKER: TrackerState = { tracks: [], nextId: 1 }

interface Pair {
  trackIndex: number
  detectionIndex: number
  distance: number
}

/**
 * Distance between the centers of two boxes, in sizes of the first box.
 * 0 = same center, 1 = moved by one pill size.
 */
export function centerDistance(from: Box, to: Box): number {
  const dx = (to.x1 + to.x2) / 2 - (from.x1 + from.x2) / 2
  const dy = (to.y1 + to.y2) / 2 - (from.y1 + from.y2) / 2
  const size = Math.max(from.x2 - from.x1, from.y2 - from.y1)
  if (size <= 0) {
    return Infinity
  }
  return Math.hypot(dx, dy) / size
}

/**
 * Match the boxes of one detection round with the tracked pills.
 * Returns a new state; the old state is not changed.
 */
export function updateTracks(state: TrackerState, detections: Box[], settings: TrackerSettings): TrackerState {
  // 1. Every (pill, box) pair that is close enough, closest first
  const pairs: Pair[] = []
  for (let trackIndex = 0; trackIndex < state.tracks.length; trackIndex++) {
    for (let detectionIndex = 0; detectionIndex < detections.length; detectionIndex++) {
      const detection = detections[detectionIndex]
      if (detection.score < settings.keepScore) {
        continue
      }
      const distance = centerDistance(state.tracks[trackIndex].box, detection)
      if (distance <= settings.maxMove) {
        pairs.push({ trackIndex, detectionIndex, distance })
      }
    }
  }
  pairs.sort((a, b) => a.distance - b.distance)

  // 2. Give each pill its best box; a pill and a box are used only once
  const matchedDetection = new Map<number, number>() // trackIndex -> detectionIndex
  const usedDetections = new Set<number>()
  for (const pair of pairs) {
    if (matchedDetection.has(pair.trackIndex) || usedDetections.has(pair.detectionIndex)) {
      continue
    }
    matchedDetection.set(pair.trackIndex, pair.detectionIndex)
    usedDetections.add(pair.detectionIndex)
  }

  // 3. Update the tracked pills
  const tracks: Track[] = []
  for (let trackIndex = 0; trackIndex < state.tracks.length; trackIndex++) {
    const track = state.tracks[trackIndex]
    const detectionIndex = matchedDetection.get(trackIndex)

    if (detectionIndex !== undefined) {
      // Seen again: move to the new box
      tracks.push({
        id: track.id,
        box: detections[detectionIndex],
        previousBox: track.box,
        hits: track.hits + 1,
        misses: 0,
      })
    } else if (track.misses + 1 <= settings.maxMisses) {
      // Not seen this round: keep it for a while at the same place
      tracks.push({ ...track, previousBox: track.box, misses: track.misses + 1 })
    }
    // else: not seen for too long -> removed
  }

  // 4. Boxes that matched no pill become new pills, if their score is high enough
  let nextId = state.nextId
  for (let detectionIndex = 0; detectionIndex < detections.length; detectionIndex++) {
    const detection = detections[detectionIndex]
    if (usedDetections.has(detectionIndex) || detection.score < settings.startScore) {
      continue
    }
    tracks.push({ id: nextId, box: detection, previousBox: detection, hits: 1, misses: 0 })
    nextId += 1
  }

  return { tracks, nextId }
}

/**
 * The pills counted in this round: seen often enough AND seen this round.
 *
 * A pill missed for a moment is remembered (it keeps its id and hits, so it
 * counts again at once when it comes back) but not counted while missing.
 * Counting missing pills made a moving pill count twice: once at its old
 * place, once at its new place (found in the video test, step 10).
 * Short misses are smoothed by mostFrequentCount (countSmoother.ts) instead.
 */
export function getCountedTracks(tracks: Track[], minHits: number): Track[] {
  const counted: Track[] = []
  for (const track of tracks) {
    if (track.hits >= minHits && track.misses === 0) {
      counted.push(track)
    }
  }
  return counted
}

/**
 * A box part of the way from one box to another, for smooth movement.
 * progress 0 = `from`, 1 = `to` (values outside 0-1 are limited).
 */
export function interpolateBox(from: Box, to: Box, progress: number): Box {
  const t = Math.min(Math.max(progress, 0), 1)
  return {
    x1: from.x1 + (to.x1 - from.x1) * t,
    y1: from.y1 + (to.y1 - from.y1) * t,
    x2: from.x2 + (to.x2 - from.x2) * t,
    y2: from.y2 + (to.y2 - from.y2) * t,
    score: to.score,
  }
}
