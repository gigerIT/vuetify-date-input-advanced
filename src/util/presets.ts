import type { AdvancedDateAdapter, PresetRange } from '@/types'

export interface DefaultPresetLabels {
  today: string
  yesterday: string
  last7Days: string
  last30Days: string
  thisMonth: string
  lastMonth: string
  thisQuarter: string
  lastQuarter: string
  yearToDate: string
  lastYear: string
}

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

export function createDefaultPresets<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  labels: DefaultPresetLabels,
): PresetRange<TDate>[] {
  return [
    {
      label: labels.today,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [today, today]
      },
    },
    {
      label: labels.yesterday,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const yesterday = adapter.addDays(today, -1)
        return [yesterday, yesterday]
      },
    },
    {
      label: labels.last7Days,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.addDays(today, -6), today]
      },
    },
    {
      label: labels.last30Days,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.addDays(today, -29), today]
      },
    },
    {
      label: labels.thisMonth,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.startOfMonth(today), adapter.endOfMonth(today)]
      },
    },
    {
      label: labels.lastMonth,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const lastMonth = adapter.addMonths(today, -1)
        return [adapter.startOfMonth(lastMonth), adapter.endOfMonth(lastMonth)]
      },
    },
    {
      label: labels.thisQuarter,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [startOfQuarter(adapter, today), endOfQuarter(adapter, today)]
      },
    },
    {
      label: labels.lastQuarter,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const start = lastQuarterStart(adapter, today)
        return [start, adapter.endOfMonth(adapter.addMonths(start, 2))]
      },
    },
    {
      label: labels.yearToDate,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        return [adapter.startOfYear(today), today]
      },
    },
    {
      label: labels.lastYear,
      value: () => {
        const today = adapter.startOfDay(adapter.date() as TDate)
        const lastYear = adapter.setYear(today, adapter.getYear(today) - 1)
        return [adapter.startOfYear(lastYear), adapter.endOfYear(lastYear)]
      },
    },
  ]
}
