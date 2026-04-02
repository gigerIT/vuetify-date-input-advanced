import { describe, expect, it } from 'vitest'

import type { AdvancedDateAdapter, AdvancedDateRangeObject } from '@/types'
import { normalizeModel, serializeModel } from '@/util/model'

const adapter: AdvancedDateAdapter<Date> = {
  date: value => value ? new Date(value) : new Date('2026-01-01T12:00:00'),
  format: (date, format) => {
    if (format === 'dayOfMonth') return String(date.getDate())
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
  },
  toISO: date => date.toISOString(),
  parseISO: value => new Date(value),
  startOfDay: date => new Date(date.getFullYear(), date.getMonth(), date.getDate()),
  endOfDay: date => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
  startOfMonth: date => new Date(date.getFullYear(), date.getMonth(), 1),
  endOfMonth: date => new Date(date.getFullYear(), date.getMonth() + 1, 0),
  startOfYear: date => new Date(date.getFullYear(), 0, 1),
  endOfYear: date => new Date(date.getFullYear(), 11, 31),
  isBefore: (date, comparing) => date.getTime() < comparing.getTime(),
  isAfter: (date, comparing) => date.getTime() > comparing.getTime(),
  isEqual: (date, comparing) => date.getTime() === comparing.getTime(),
  isSameDay: (date, comparing) => date.toDateString() === comparing.toDateString(),
  isSameMonth: (date, comparing) => date.getMonth() === comparing.getMonth() && date.getFullYear() === comparing.getFullYear(),
  isValid: value => value instanceof Date && !Number.isNaN(value.getTime()),
  isWithinRange: (date, [start, end]) => date >= start && date <= end,
  addDays: (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount),
  addMonths: (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, date.getDate()),
  getYear: date => date.getFullYear(),
  setYear: (date, year) => new Date(year, date.getMonth(), date.getDate()),
  getMonth: date => date.getMonth(),
  setMonth: (date, month) => new Date(date.getFullYear(), month, date.getDate()),
  getWeekArray: () => [],
  getWeekdays: () => ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
}

describe('model utilities', () => {
  it('normalizes tuple ranges in chronological order', () => {
    const start = new Date('2026-01-18')
    const end = new Date('2026-01-09')

    expect(normalizeModel(adapter, [start, end], true)).toEqual({
      start: end,
      end: start,
    })
  })

  it('serializes range objects when requested', () => {
    const value = serializeModel(
      {
        start: new Date('2026-01-09'),
        end: new Date('2026-01-18'),
      },
      { range: true, returnObject: true },
    ) as AdvancedDateRangeObject<Date>

    expect(value.start?.toISOString().slice(0, 10)).toBe('2026-01-09')
    expect(value.end?.toISOString().slice(0, 10)).toBe('2026-01-18')
  })
})
