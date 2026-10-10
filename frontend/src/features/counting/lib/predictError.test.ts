import { describe, expect, it } from 'vitest'
import { getPredictErrorKind } from './predictError'

describe('getPredictErrorKind', () => {
  it('no answer means the server is unavailable', () => {
    expect(getPredictErrorKind(undefined)).toBe('serverUnavailable')
  })

  it('400 means the image is not valid', () => {
    expect(getPredictErrorKind(400)).toBe('invalidImage')
  })

  it('413 means the image is too large', () => {
    expect(getPredictErrorKind(413)).toBe('tooLarge')
  })

  it('503 (model not loaded) and proxy errors mean the server is unavailable', () => {
    expect(getPredictErrorKind(502)).toBe('serverUnavailable')
    expect(getPredictErrorKind(503)).toBe('serverUnavailable')
    expect(getPredictErrorKind(504)).toBe('serverUnavailable')
  })

  it('other codes are unknown errors', () => {
    expect(getPredictErrorKind(500)).toBe('unknown')
  })
})
