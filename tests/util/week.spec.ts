import { describe, expect, it } from 'vitest'

import type { AdvancedDateAdapter } from '@/types'
import { getIsoWeekNumber, getWeekdayIndex } from '@/util/week'

// These utilities only call toISO. Civil-date strings avoid a UTC instant that
// shifts to the previous day in negative-offset timezones.
const adapter = {
  toISO: (date: string) => date,
} as AdvancedDateAdapter<string>

describe('getIsoWeekNumber', () => {
  // ISO week 1 contains January 4; a calendar year's first/last days can
  // therefore belong to an adjacent ISO year.
  it.each([
    { date: '2014-12-29', isoYear: 2015, week: 1 },
    { date: '2015-01-04', isoYear: 2015, week: 1 },
    { date: '2016-01-01', isoYear: 2015, week: 53 },
    { date: '2016-01-04', isoYear: 2016, week: 1 },
    { date: '2020-12-31', isoYear: 2020, week: 53 },
    { date: '2021-01-01', isoYear: 2020, week: 53 },
    { date: '2021-01-04', isoYear: 2021, week: 1 },
    { date: '2022-01-01', isoYear: 2021, week: 52 },
    { date: '2024-12-29', isoYear: 2024, week: 52 },
    { date: '2024-12-30', isoYear: 2025, week: 1 },
  ])('returns ISO $isoYear week $week for $date', ({ date, week }) => {
    expect(getIsoWeekNumber(adapter, date)).toBe(week)
  })
})

describe('getWeekdayIndex', () => {
  it.each([
    { date: '2023-12-31', firstDayOfWeek: undefined, index: 0 }, // Sunday
    { date: '2024-01-01', firstDayOfWeek: undefined, index: 1 }, // Monday
    { date: '2023-12-31', firstDayOfWeek: 1, index: 6 },
    { date: '2024-01-01', firstDayOfWeek: 1, index: 0 },
    { date: '2023-12-31', firstDayOfWeek: 6, index: 1 },
    { date: '2024-01-01', firstDayOfWeek: 6, index: 2 },
    { date: '2023-12-31', firstDayOfWeek: '1', index: 6 },
    { date: '2023-12-31', firstDayOfWeek: -1, index: 1 },
    { date: '2024-01-01', firstDayOfWeek: 8, index: 0 },
  ])(
    'returns $index for $date with first day $firstDayOfWeek',
    ({ date, firstDayOfWeek, index }) => {
      expect(getWeekdayIndex(adapter, date, firstDayOfWeek)).toBe(index)
    },
  )
})
