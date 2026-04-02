import type { AdvancedDateAdapter, PresetRange } from '@/types'

function startOfQuarter<TDate>(adapter: AdvancedDateAdapter<TDate>, date: TDate): TDate {
  const yearStart = adapter.startOfYear(date)
  const month = adapter.getMonth(date)
  const quarterMonth = Math.floor(month / 3) * 3

  return adapter.startOfMonth(adapter.setMonth(yearStart, quarterMonth))
}

function endOfQuarter<TDate>(adapter: AdvancedDateAdapter<TDate>, date: TDate): TDate {
  const start = startOfQuarter(adapter, date)
  return adapter.endOfMonth(adapter.addMonths(start, 2))
}

function lastQuarterStart<TDate>(adapter: AdvancedDateAdapter<TDate>, date: TDate): TDate {
  return adapter.addMonths(startOfQuarter(adapter, date), -3)
}

export function createDefaultPresets<TDate>(adapter: AdvancedDateAdapter<TDate>): PresetRange<TDate>[] {
  return [
    {
      label: 'Today',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [today, today]
      },
    },
    {
      label: 'Yesterday',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const yesterday = adapter.addDays(today, -1)
        return [yesterday, yesterday]
      },
    },
    {
      label: 'Last 7 Days',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.addDays(today, -6), today]
      },
    },
    {
      label: 'Last 30 Days',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.addDays(today, -29), today]
      },
    },
    {
      label: 'This Month',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.startOfMonth(today), adapter.endOfMonth(today)]
      },
    },
    {
      label: 'Last Month',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const lastMonth = adapter.addMonths(today, -1)
        return [adapter.startOfMonth(lastMonth), adapter.endOfMonth(lastMonth)]
      },
    },
    {
      label: 'This Quarter',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [startOfQuarter(adapter, today), endOfQuarter(adapter, today)]
      },
    },
    {
      label: 'Last Quarter',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const start = lastQuarterStart(adapter, today)
        return [start, adapter.endOfMonth(adapter.addMonths(start, 2))]
      },
    },
    {
      label: 'Year to Date',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.startOfYear(today), today]
      },
    },
    {
      label: 'Last Year',
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const lastYear = adapter.setYear(today, adapter.getYear(today) - 1)
        return [adapter.startOfYear(lastYear), adapter.endOfYear(lastYear)]
      },
    },
  ]
}
