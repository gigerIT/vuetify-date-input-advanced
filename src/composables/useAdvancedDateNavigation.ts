import { computed, ref, watch, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  NormalizedRange,
} from '@/types'
import {
  MONTH_SEARCH_BATCH,
  type MonthAvailability,
} from './useAdvancedDateMonthAvailability'

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
  availability: MonthAvailability<TDate>
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

  const forwardSpan = ref(MONTH_SEARCH_BATCH)
  const backwardSpan = ref(MONTH_SEARCH_BATCH)

  function leadingMonthForEnd(date: TDate) {
    let month = options.adapter.startOfMonth(date)
    for (let index = 1; index < options.months.value; index++) {
      const previous = options.availability.find(month, -1, backwardSpan.value)
      if (previous.kind !== 'found') break
      month = previous.month
    }
    return month
  }

  function clampDisplayedMonth(date: TDate): TDate {
    let next = options.adapter.startOfMonth(date)
    if (options.max.value) {
      const lastLeading = leadingMonthForEnd(options.max.value)
      if (options.adapter.isAfter(next, lastLeading)) next = lastLeading
    }
    if (options.min.value) {
      const minMonth = options.adapter.startOfMonth(options.min.value)
      if (options.adapter.isBefore(next, minMonth)) next = minMonth
    }
    return next
  }

  displayedMonth.value = clampDisplayedMonth(displayedMonth.value)

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

  const window = computed(() =>
    options.availability.collect(
      displayedMonth.value,
      options.months.value,
      forwardSpan.value,
    ),
  )
  const visibleMonths = computed<TDate[]>((previous) => {
    const months = window.value.months
    return previous?.length === months.length &&
      months.every((month, index) =>
        options.adapter.isSameMonth(month, previous[index]),
      )
      ? previous
      : months
  })
  const previous = computed(() =>
    options.availability.find(displayedMonth.value, -1, backwardSpan.value),
  )
  const next = computed(() => window.value.next)
  const canPrev = computed(() => previous.value.kind !== 'boundary')
  const canNext = computed(() => next.value.kind !== 'boundary')

  function prevMonth() {
    if (previous.value.kind === 'pending')
      backwardSpan.value += MONTH_SEARCH_BATCH
    const result = previous.value
    if (result.kind === 'found') {
      forwardSpan.value = Math.max(forwardSpan.value, backwardSpan.value)
      syncMonth(result.month)
    }
  }

  function nextMonth() {
    const previousCount = visibleMonths.value.length
    if (next.value.kind === 'pending') forwardSpan.value += MONTH_SEARCH_BATCH
    // Continuing a search can fill an empty calendar slot in the current view.
    if (visibleMonths.value.length > previousCount) return
    const result = next.value
    if (result.kind === 'found') {
      syncMonth(visibleMonths.value[1] ?? result.month)
    }
  }

  function selectionViewportAnchor() {
    const selection = options.selection.value

    if (
      options.range.value &&
      options.selectionTargetField.value === 'end' &&
      selection.end
    ) {
      return {
        anchor: selection.end,
        displayedMonth: leadingMonthForEnd(selection.end),
      }
    }

    if (!selection.start) return null

    return {
      anchor: selection.start,
      displayedMonth: selection.start,
    }
  }

  function syncSelectionViewport() {
    if (options.selectionChangeOrigin.value === 'internal') return

    const viewport = selectionViewportAnchor()
    if (!viewport) return

    const isVisible = visibleMonths.value.some((month) =>
      options.adapter.isSameMonth(month, viewport.anchor),
    )
    if (!isVisible) syncMonth(viewport.displayedMonth, false)
  }

  watch(
    () => [options.month.value, options.year.value],
    ([month, year]) => {
      syncMonth(createMonthFromParts(options.adapter, month, year), false)
    },
  )

  watch(
    [
      () => options.selection.value.start,
      () => options.selection.value.end,
      () => options.range.value,
      () => options.selectionTargetField.value,
      () => options.months.value,
    ],
    syncSelectionViewport,
    { immediate: true },
  )

  watch([options.months, options.min, options.max], () => {
    syncMonth(displayedMonth.value, false)
  })

  return {
    displayedMonth,
    visibleMonths,
    previous,
    next,
    canPrev,
    canNext,
    prevMonth,
    nextMonth,
    setDisplayedMonth: syncMonth,
  }
}
