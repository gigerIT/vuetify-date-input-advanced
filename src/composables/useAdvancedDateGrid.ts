import { computed, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  AdvancedDateMonthData,
  DateBounds,
  NormalizedRange,
} from '@/types'
import {
  dateKey,
  intersectsRange,
  isRangeDisabled,
  isSameDay,
  isSelectionDateDisabled,
} from '@/util/dates'
import { orderRange } from '@/util/model'
import { getIsoWeekNumber } from '@/util/week'

interface AdvancedDateDayMeta<TDate> {
  date: TDate
  key: string
  label: string
  ariaLabel: string
  outside: boolean
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
  selectionTargetField: Ref<AdvancedDateInputField | null>
  hoveredDate: Ref<TDate | null>
  range: Ref<boolean>
  showWeekNumbers: Ref<boolean>
  firstDayOfWeek: Ref<number | string | undefined>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
}) {
  const todayValue = today(options.adapter)

  const bounds = computed<DateBounds<TDate>>(() => ({
    min: options.min.value,
    max: options.max.value,
    allowedDates: options.allowedDates.value,
    allowedStartDates: options.allowedStartDates.value,
    allowedEndDates: options.allowedEndDates.value,
  }))

  const previewRange = computed(() => {
    const selection = options.selection.value
    const hoveredDate = options.hoveredDate.value
    const isSelectingEnd = options.selectionTargetField.value === 'end'

    if (!options.range.value) return null
    if (!selection.start || (!isSelectingEnd && selection.end) || !hoveredDate)
      return null

    const preview = orderRange(options.adapter, {
      start: selection.start,
      end: hoveredDate,
    })

    if (isRangeDisabled(options.adapter, preview, bounds.value)) return null

    return preview
  })

  // Keep expensive calendar metadata stable while selection-specific state stays dynamic.
  const staticMonths = computed<AdvancedDateMonthMeta<TDate>[]>(() => {
    const firstDayOfWeek = options.firstDayOfWeek.value
    const weekdays = options.adapter.getWeekdays(firstDayOfWeek)

    return options.visibleMonths.value.map((month) => {
      const weeks = options.adapter
        .getWeekArray(month, firstDayOfWeek)
        .map((week, index) => {
          return {
            index,
            weekNumber: options.showWeekNumbers.value
              ? (options.adapter.getWeek?.(week[0], firstDayOfWeek) ??
                getIsoWeekNumber(options.adapter, week[0]))
              : undefined,
            days: week.map((day) => ({
              date: day,
              key: dateKey(options.adapter, day),
              label: options.adapter.format(day, 'dayOfMonth'),
              ariaLabel: options.adapter.format(day, 'fullDateWithWeekday'),
              outside: !options.adapter.isSameMonth(day, month),
              today: isSameDay(options.adapter, day, todayValue),
            })),
          }
        })

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
          const disabled = isSelectionDateDisabled(
            options.adapter,
            day.date,
            selection,
            isRangeSelection,
            bounds.value,
            options.selectionTargetField.value,
          )
          const rangeStart = isSameDay(
            options.adapter,
            day.date,
            selection.start,
          )
          const rangeEnd = isSameDay(options.adapter, day.date, selection.end)

          return {
            ...day,
            disabled,
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
