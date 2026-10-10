import { describe, expect, it } from 'vitest'
import { formatDecimal, formatMae, formatPercent } from './formatMetric'

describe('formatMae', () => {
  it('always shows 3 decimals', () => {
    expect(formatMae(0.005970149, 'en')).toBe('0.006')
    expect(formatMae(0, 'en')).toBe('0.000')
  })

  it('uses a comma in Indonesian', () => {
    expect(formatMae(0.034, 'id')).toBe('0,034')
  })

  it('shows a dash when the metric is missing', () => {
    expect(formatMae(undefined, 'en')).toBe('–')
  })
})

describe('formatPercent', () => {
  it('shows a share as percent with at most 1 decimal', () => {
    expect(formatPercent(0.99402985, 'en')).toBe('99.4%')
    expect(formatPercent(1, 'en')).toBe('100%')
  })

  it('uses a comma in Indonesian', () => {
    expect(formatPercent(0.652173913, 'id')).toBe('65,2%')
  })

  it('shows a dash when the metric is missing', () => {
    expect(formatPercent(undefined, 'id')).toBe('–')
  })
})

describe('formatDecimal', () => {
  it('shows 2 decimals', () => {
    expect(formatDecimal(0.65, 'en')).toBe('0.65')
    expect(formatDecimal(0.1, 'id')).toBe('0,10')
  })
})
