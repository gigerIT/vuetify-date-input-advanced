import { describe, expect, it } from 'vitest'

import type { AdvancedDateAdapter, PresetRange } from '@/types'
import { createDefaultPresets } from '@/util/presets'

const labels = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 Days',
  last30Days: 'Last 30 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  yearToDate: 'Year to Date',
  lastYear: 'Last Year',
}

function createAdapter(current: string): AdvancedDateAdapter<Date> {
  const currentDate = new Date(`${current}T12:00:00`)

  return {
    date: value => (value ? new Date(value) : new Date(currentDate)),
    format: date => date.toISOString(),
    toISO: date => date.toISOString(),
    parseISO: value => new Date(`${value}T00:00:00`),
    startOfDay: date =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    endOfDay: date =>
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      ),
    startOfMonth: date => new Date(date.getFullYear(), date.getMonth(), 1),
    endOfMonth: date => new Date(date.getFullYear(), date.getMonth() + 1, 0),
    startOfYear: date => new Date(date.getFullYear(), 0, 1),
    endOfYear: date => new Date(date.getFullYear(), 11, 31),
    isBefore: (date, comparing) => date.getTime() < comparing.getTime(),
    isAfter: (date, comparing) => date.getTime() > comparing.getTime(),
    isEqual: (date, comparing) => date.getTime() === comparing.getTime(),
    isSameDay: (date, comparing) => date.toDateString() === comparing.toDateString(),
    isSameMonth: (date, comparing) =>
      date.getMonth() === comparing.getMonth() &&
      date.getFullYear() === comparing.getFullYear(),
    isValid: value => value instanceof Date && !Number.isNaN(value.getTime()),
    isWithinRange: (date, [start, end]) => date >= start && date <= end,
    addDays: (date, amount) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount),
    addMonths: (date, amount) =>
      new Date(date.getFullYear(), date.getMonth() + amount, date.getDate()),
    getYear: date => date.getFullYear(),
    setYear: (date, year) => new Date(year, date.getMonth(), date.getDate()),
    getMonth: date => date.getMonth(),
    setMonth: (date, month) => new Date(date.getFullYear(), month, date.getDate()),
    getWeekArray: () => [],
    getWeekdays: () => ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  }
}

function toLocalYmd(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function inclusiveDayCount(range: [Date, Date]) {
  const start = Date.UTC(
    range[0].getFullYear(),
    range[0].getMonth(),
    range[0].getDate(),
  )
  const end = Date.UTC(
    range[1].getFullYear(),
    range[1].getMonth(),
    range[1].getDate(),
  )

  return Math.floor((end - start) / 86_400_000) + 1
}

function resolvePreset(presets: PresetRange<Date>[], label: string): [Date, Date] {
  const preset = presets.find((candidate) => candidate.label === label)

  expect(preset).toBeDefined()

  return typeof preset?.value === 'function' ? preset.value() : preset!.value
}

describe('createDefaultPresets', () => {
  it('ends rolling presets on yesterday while keeping inclusive day counts', () => {
    const presets = createDefaultPresets(createAdapter('2026-02-14'), labels)
    const last7Days = resolvePreset(presets, labels.last7Days)
    const last30Days = resolvePreset(presets, labels.last30Days)

    expect(last7Days.map(toLocalYmd)).toEqual(['2026-02-07', '2026-02-13'])
    expect(inclusiveDayCount(last7Days)).toBe(7)

    expect(last30Days.map(toLocalYmd)).toEqual(['2026-01-15', '2026-02-13'])
    expect(inclusiveDayCount(last30Days)).toBe(30)
  })

  it('ends year to date on yesterday and keeps full-period presets unchanged', () => {
    const presets = createDefaultPresets(createAdapter('2026-02-14'), labels)
    const yearToDate = resolvePreset(presets, labels.yearToDate)
    const thisMonth = resolvePreset(presets, labels.thisMonth)
    const thisQuarter = resolvePreset(presets, labels.thisQuarter)

    expect(yearToDate.map(toLocalYmd)).toEqual(['2026-01-01', '2026-02-13'])
    expect(thisMonth.map(toLocalYmd)).toEqual(['2026-02-01', '2026-02-28'])
    expect(thisQuarter.map(toLocalYmd)).toEqual(['2026-01-01', '2026-03-31'])
  })

  it('omits year to date on january 1', () => {
    const presets = createDefaultPresets(createAdapter('2026-01-01'), labels)

    expect(
      presets.some((preset) => preset.label === labels.yearToDate),
    ).toBe(false)
  })
})
