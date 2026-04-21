import { computed, ref, watch, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  DateBounds,
  NormalizedRange,
} from '@/types'
import { monthHasSelectableDate } from '@/util/dates'

function currentDate<TDate>(adapter: AdvancedDateAdapter<TDate>): TDate {
  return adapter.startOfDay(adapter.date() as TDate)
}

function createMonthFromParts<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  month: number,
  year: number,
): TDate {
  const seed = adapter.startOfYear(currentDate(adapter))
  return adapter.startOfMonth(
    adapter.setYear(adapter.setMonth(seed, month), year),
  )
}

export function useAdvancedDateNavigation<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  selection: Ref<NormalizedRange<TDate>>
  selectionChangeOrigin: Ref<'external' | 'internal'>
  selectionTargetField: Ref<AdvancedDateInputField | null>
  range: Ref<boolean>
  months: Ref<number>
  month: Ref<number>
  year: Ref<number>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
  onMonthChange?: (month: number) => void
  onYearChange?: (year: number) => void
}) {
  const displayedMonth = ref(
    createMonthFromParts(
      options.adapter,
      options.month.value,
      options.year.value,
    ),
  )

  function clampDisplayedMonth(date: TDate): TDate {
    let next = options.adapter.startOfMonth(date)

    if (options.min.value) {
      const minMonth = options.adapter.startOfMonth(options.min.value)
      if (options.adapter.isBefore(next, minMonth)) next = minMonth
    }

    if (options.max.value) {
      const maxMonth = options.adapter.startOfMonth(options.max.value)
      const lastAllowedLeadingMonth = options.adapter.addMonths(
        maxMonth,
        -(options.months.value - 1),
      )
      if (options.adapter.isAfter(next, lastAllowedLeadingMonth)) {
        next = lastAllowedLeadingMonth
      }
    }

    return options.adapter.startOfMonth(next)
  }

  function syncMonth(date: TDate, notify = true) {
    const next = clampDisplayedMonth(date)

    if (options.adapter.isSameMonth(displayedMonth.value, next)) return

    displayedMonth.value = next

    if (!notify) return

    const month = options.adapter.getMonth(next)
    const year = options.adapter.getYear(next)

    if (month !== options.month.value) options.onMonthChange?.(month)
    if (year !== options.year.value) options.onYearChange?.(year)
  }

  const visibleMonths = computed(() => {
    return Array.from(
      { length: Math.max(1, options.months.value) },
      (_, index) => {
        return options.adapter.startOfMonth(
          options.adapter.addMonths(displayedMonth.value, index),
        )
      },
    )
  })

  const constraints = computed<DateBounds<TDate>>(() => ({
    min: options.min.value,
    max: options.max.value,
    allowedDates: options.allowedDates.value,
    allowedStartDates: options.allowedStartDates.value,
    allowedEndDates: options.allowedEndDates.value,
  }))

  function canNavigateToMonth(month: TDate) {
    return monthHasSelectableDate(
      options.adapter,
      month,
      options.selection.value,
      options.range.value,
      constraints.value,
      options.selectionTargetField.value,
    )
  }

  const canPrev = computed(() => {
    const prevRevealedMonth = options.adapter.startOfMonth(
      options.adapter.addMonths(displayedMonth.value, -1),
    )

    return canNavigateToMonth(prevRevealedMonth)
  })

  const canNext = computed(() => {
    const nextRevealedMonth = options.adapter.startOfMonth(
      options.adapter.addMonths(displayedMonth.value, options.months.value),
    )

    return canNavigateToMonth(nextRevealedMonth)
  })

  function prevMonth() {
    if (!canPrev.value) return
    syncMonth(options.adapter.addMonths(displayedMonth.value, -1))
  }

  function nextMonth() {
    if (!canNext.value) return
    syncMonth(options.adapter.addMonths(displayedMonth.value, 1))
  }

  watch(
    () => [options.month.value, options.year.value],
    ([month, year]) => {
      syncMonth(createMonthFromParts(options.adapter, month, year), false)
    },
  )

  watch(
    [() => options.selection.value.start, () => options.range.value],
    () => {
      const selection = options.selection.value

      if (!selection.start) return
      if (options.selectionChangeOrigin.value === 'internal') return

      const isVisible = visibleMonths.value.some((month) =>
        options.adapter.isSameMonth(month, selection.start as TDate),
      )
      if (!isVisible) syncMonth(selection.start, false)
    },
    { immediate: true },
  )

  watch(
    () => options.months.value,
    () => {
      syncMonth(displayedMonth.value, false)
    },
  )

  return {
    displayedMonth,
    visibleMonths,
    canPrev,
    canNext,
    prevMonth,
    nextMonth,
    setDisplayedMonth: syncMonth,
  }
}
