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

function currentDay<TDate>(adapter: AdvancedDateAdapter<TDate>): TDate {
  return adapter.startOfDay(adapter.date() as TDate)
}

function completedDay<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  date = currentDay(adapter),
): TDate {
  return adapter.addDays(date, -1)
}

function hasCompletedDayInCurrentYear<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
): boolean {
  const today = currentDay(adapter)
  return adapter.getYear(completedDay(adapter, today)) === adapter.getYear(today)
}

export function createDefaultPresets<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  labels: DefaultPresetLabels,
): PresetRange<TDate>[] {
  const presets: PresetRange<TDate>[] = [
    {
      label: labels.today,
      value: () => {
        const today = currentDay(adapter)
        return [today, today]
      },
    },
    {
      label: labels.yesterday,
      value: () => {
        const yesterday = completedDay(adapter)
        return [yesterday, yesterday]
      },
    },
    {
      label: labels.last7Days,
      value: () => {
        const end = completedDay(adapter)
        return [adapter.addDays(end, -6), end]
      },
    },
    {
      label: labels.last30Days,
      value: () => {
        const end = completedDay(adapter)
        return [adapter.addDays(end, -29), end]
      },
    },
    {
      label: labels.thisMonth,
      value: () => {
        const today = currentDay(adapter)
        return [adapter.startOfMonth(today), adapter.endOfMonth(today)]
      },
    },
    {
      label: labels.lastMonth,
      value: () => {
        const today = currentDay(adapter)
        const lastMonth = adapter.addMonths(today, -1)
        return [adapter.startOfMonth(lastMonth), adapter.endOfMonth(lastMonth)]
      },
    },
    {
      label: labels.thisQuarter,
      value: () => {
        const today = currentDay(adapter)
        return [startOfQuarter(adapter, today), endOfQuarter(adapter, today)]
      },
    },
    {
      label: labels.lastQuarter,
      value: () => {
        const today = currentDay(adapter)
        const start = lastQuarterStart(adapter, today)
        return [start, adapter.endOfMonth(adapter.addMonths(start, 2))]
      },
    },
    {
      label: labels.lastYear,
      value: () => {
        const today = currentDay(adapter)
        const lastYear = adapter.setYear(today, adapter.getYear(today) - 1)
        return [adapter.startOfYear(lastYear), adapter.endOfYear(lastYear)]
      },
    },
  ]

  if (hasCompletedDayInCurrentYear(adapter)) {
    presets.splice(-1, 0, {
      label: labels.yearToDate,
      value: () => {
        const end = completedDay(adapter)
        return [adapter.startOfYear(end), end]
      },
    })
  }

  return presets
}
