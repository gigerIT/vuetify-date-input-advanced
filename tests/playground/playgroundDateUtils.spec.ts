import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createCustomPlaygroundPresets,
  toLocalYmd,
} from '../../playground/src/playgroundDateUtils'

describe('playground date utilities', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates fresh custom presets with lazily resolved offsets', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 10, 12))

    const presets = createCustomPlaygroundPresets()
    const nextPresets = createCustomPlaygroundPresets()
    const weekend =
      typeof presets[0].value === 'function'
        ? presets[0].value()
        : presets[0].value
    const twoWeeksOut =
      typeof presets[1].value === 'function'
        ? presets[1].value()
        : presets[1].value

    expect(presets.map(({ label, slot }) => ({ label, slot }))).toEqual([
      { label: 'Weekend Escape', slot: 'highlight' },
      { label: 'Two Weeks Out', slot: undefined },
    ])
    expect(weekend.map(toLocalYmd)).toEqual(['2026-02-13', '2026-02-15'])
    expect(twoWeeksOut.map(toLocalYmd)).toEqual([
      '2026-02-24',
      '2026-03-02',
    ])
    expect(nextPresets).not.toBe(presets)
    expect(nextPresets[0]).not.toBe(presets[0])
  })
})
