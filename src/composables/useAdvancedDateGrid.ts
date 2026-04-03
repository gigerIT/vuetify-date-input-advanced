import { computed, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateMonthData,
  DateBounds,
  NormalizedRange,
} from '@/types'
import {
  dateKey,
  expandWeekArray,
  intersectsRange,
  isDateDisabled,
  isSameDay,
} from '@/util/dates'
import { orderRange } from '@/util/model'
import { getIsoWeekNumber } from '@/util/week'

interface AdvancedDateDayMeta<TDate> {
  date: TDate
  key: string
  label: string
  ariaLabel: string
  outside: boolean
  disabled: boolean
  today: boolean
}

interface AdvancedDateWeekMeta<TDate> {
  index: number
  weekNumber?: number
  days: AdvancedDateDayMeta<TDate>[]
}

interface AdvancedDateMonthMeta<TDate> {
  date: TDate
  key: string
  label: string
  weeks: AdvancedDateWeekMeta<TDate>[]
  weekdays: string[]
}

function today<TDate>(adapter: AdvancedDateAdapter<TDate>): TDate {
  return adapter.startOfDay(adapter.date() as TDate)
}

export function useAdvancedDateGrid<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  visibleMonths: Ref<TDate[]>
  selection: Ref<NormalizedRange<TDate>>
  hoveredDate: Ref<TDate | null>
  range: Ref<boolean>
  showWeekNumbers: Ref<boolean>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
}) {
  const todayValue = today(options.adapter)

  const bounds = computed<DateBounds<TDate>>(() => ({
    min: options.min.value,
    max: options.max.value,
    allowedDates: options.allowedDates.value,
  }))

  const previewRange = computed(() => {
    const selection = options.selection.value
    const hoveredDate = options.hoveredDate.value

    if (!options.range.value) return null
    if (!selection.start || selection.end || !hoveredDate) return null
    if (isDateDisabled(options.adapter, hoveredDate, bounds.value)) return null

    return orderRange(options.adapter, {
      start: selection.start,
      end: hoveredDate,
    })
  })

  // Keep expensive calendar metadata stable so hover only recomputes selection state.
  const staticMonths = computed<AdvancedDateMonthMeta<TDate>[]>(() => {
    const weekdays = options.adapter.getWeekdays()

    return options.visibleMonths.value.map((month) => {
      const weeks = expandWeekArray(options.adapter, month).map(
        (week, index) => {
          return {
            index,
            weekNumber: options.showWeekNumbers.value
              ? getIsoWeekNumber(options.adapter, week[0])
              : undefined,
            days: week.map((day) => ({
              date: day,
              key: dateKey(options.adapter, day),
              label: options.adapter.format(day, 'dayOfMonth'),
              ariaLabel: options.adapter.format(day, 'fullDateWithWeekday'),
              outside: !options.adapter.isSameMonth(day, month),
              disabled: isDateDisabled(options.adapter, day, bounds.value),
              today: isSameDay(options.adapter, day, todayValue),
            })),
          }
        },
      )

      return {
        date: month,
        key: dateKey(options.adapter, month),
        label: options.adapter.format(month, 'monthAndYear'),
        weeks,
        weekdays,
      }
    })
  })

  const months = computed<AdvancedDateMonthData<TDate>[]>(() => {
    const selection = options.selection.value
    const hoveredPreview = previewRange.value
    const isRangeSelection = options.range.value

    return staticMonths.value.map((month) => ({
      ...month,
      weeks: month.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          const rangeStart = isSameDay(
            options.adapter,
            day.date,
            selection.start,
          )
          const rangeEnd = isSameDay(options.adapter, day.date, selection.end)

          return {
            ...day,
            selected: isRangeSelection ? rangeStart || rangeEnd : rangeStart,
            rangeStart,
            rangeEnd,
            inRange: intersectsRange(options.adapter, day.date, selection),
            preview:
              !selection.end &&
              intersectsRange(options.adapter, day.date, hoveredPreview),
          }
        }),
      })),
    }))
  })

  return {
    months,
    previewRange,
    staticMonths,
  }
}
