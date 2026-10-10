import { describe, expect, it } from 'vitest'
import { getCameraErrorKind } from './cameraError'

describe('getCameraErrorKind', () => {
  it('a refused permission is "denied"', () => {
    expect(getCameraErrorKind({ name: 'NotAllowedError' })).toBe('denied')
    expect(getCameraErrorKind({ name: 'SecurityError' })).toBe('denied')
  })

  it('a missing camera is "notFound"', () => {
    expect(getCameraErrorKind({ name: 'NotFoundError' })).toBe('notFound')
    expect(getCameraErrorKind({ name: 'OverconstrainedError' })).toBe('notFound')
  })

  it('anything else is "error"', () => {
    expect(getCameraErrorKind({ name: 'NotReadableError' })).toBe('error')
    expect(getCameraErrorKind(new Error('boom'))).toBe('error')
    expect(getCameraErrorKind('not an error object')).toBe('error')
  })
})
