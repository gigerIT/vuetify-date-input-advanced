import { computed, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateMonthData,
  DateBounds,
  NormalizedRange,
} from '@/types'
import { dateKey, expandWeekArray, intersectsRange, isDateDisabled, isSameDay } from '@/util/dates'
import { orderRange } from '@/util/model'
import { getIsoWeekNumber } from '@/util/week'

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
  const todayValue = computed(() => today(options.adapter))

  const previewRange = computed(() => {
    if (!options.range.value) return null
    if (!options.selection.value.start || options.selection.value.end || !options.hoveredDate.value) return null
    if (isDateDisabled(options.adapter, options.hoveredDate.value, bounds())) return null

    return orderRange(options.adapter, {
      start: options.selection.value.start,
      end: options.hoveredDate.value,
    })
  })

  const months = computed<AdvancedDateMonthData<TDate>[]>(() => {
    return options.visibleMonths.value.map(month => {
      const weeks = expandWeekArray(options.adapter, month).map((week, index) => {
        return {
          index,
          weekNumber: options.showWeekNumbers.value ? getIsoWeekNumber(options.adapter, week[0]) : undefined,
          days: week.map(day => {
            const rangeStart = isSameDay(options.adapter, day, options.selection.value.start)
            const rangeEnd = isSameDay(options.adapter, day, options.selection.value.end)
            const inRange = intersectsRange(options.adapter, day, options.selection.value)
            const preview = !options.selection.value.end && intersectsRange(options.adapter, day, previewRange.value)

            return {
              date: day,
              key: dateKey(options.adapter, day),
              label: options.adapter.format(day, 'dayOfMonth'),
              ariaLabel: options.adapter.format(day, 'fullDateWithWeekday'),
              outside: !options.adapter.isSameMonth(day, month),
              disabled: isDateDisabled(options.adapter, day, bounds()),
              today: isSameDay(options.adapter, day, todayValue.value),
              selected: options.range.value ? rangeStart || rangeEnd : rangeStart,
              rangeStart,
              rangeEnd,
              inRange,
              preview,
            }
          }),
        }
      })

      return {
        date: month,
        key: dateKey(options.adapter, month),
        label: options.adapter.format(month, 'monthAndYear'),
        weeks,
        weekdays: options.adapter.getWeekdays(),
      }
    })
  })

  function bounds(): DateBounds<TDate> {
    return {
      min: options.min.value,
      max: options.max.value,
      allowedDates: options.allowedDates.value,
    }
  }

  return {
    months,
    previewRange,
  }
}
