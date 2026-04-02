import { computed, ref, watch, type Ref } from 'vue'

import type { AdvancedDateAdapter, AdvancedDateModel } from '@/types'
import { normalizeModel } from '@/util/model'

function currentDate<TDate>(adapter: AdvancedDateAdapter<TDate>): TDate {
  return adapter.startOfDay(adapter.date() as TDate)
}

function createMonthFromParts<TDate>(adapter: AdvancedDateAdapter<TDate>, month: number, year: number): TDate {
  const seed = adapter.startOfYear(currentDate(adapter))
  return adapter.startOfMonth(adapter.setYear(adapter.setMonth(seed, month), year))
}

export function useAdvancedDateNavigation<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  range: Ref<boolean>
  months: Ref<number>
  month: Ref<number>
  year: Ref<number>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  onMonthChange?: (month: number) => void
  onYearChange?: (year: number) => void
}) {
  const displayedMonth = ref(createMonthFromParts(options.adapter, options.month.value, options.year.value))

  function clampDisplayedMonth(date: TDate): TDate {
    let next = options.adapter.startOfMonth(date)

    if (options.min.value) {
      const minMonth = options.adapter.startOfMonth(options.min.value)
      if (options.adapter.isBefore(next, minMonth)) next = minMonth
    }

    if (options.max.value) {
      const maxMonth = options.adapter.startOfMonth(options.max.value)
      const lastAllowedLeadingMonth = options.adapter.addMonths(maxMonth, -(options.months.value - 1))
      if (options.adapter.isAfter(next, lastAllowedLeadingMonth)) {
        next = lastAllowedLeadingMonth
      }
    }

    return options.adapter.startOfMonth(next)
  }

  function syncMonth(date: TDate) {
    displayedMonth.value = clampDisplayedMonth(date)
    options.onMonthChange?.(options.adapter.getMonth(displayedMonth.value))
    options.onYearChange?.(options.adapter.getYear(displayedMonth.value))
  }

  const visibleMonths = computed(() => {
    return Array.from({ length: Math.max(1, options.months.value) }, (_, index) => {
      return options.adapter.startOfMonth(options.adapter.addMonths(displayedMonth.value, index))
    })
  })

  const canPrev = computed(() => {
    if (!options.min.value) return true

    const prevLeadingMonth = options.adapter.addMonths(displayedMonth.value, -1)
    const lastVisibleMonth = options.adapter.addMonths(prevLeadingMonth, options.months.value - 1)

    return !options.adapter.isBefore(
      options.adapter.endOfMonth(lastVisibleMonth),
      options.adapter.startOfMonth(options.min.value),
    )
  })

  const canNext = computed(() => {
    if (!options.max.value) return true

    const nextLeadingMonth = options.adapter.addMonths(displayedMonth.value, 1)

    return !options.adapter.isAfter(
      options.adapter.startOfMonth(nextLeadingMonth),
      options.adapter.endOfMonth(options.max.value),
    )
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
      syncMonth(createMonthFromParts(options.adapter, month, year))
    },
  )

  watch(
    [() => options.modelValue.value, () => options.range.value],
    ([modelValue, range]) => {
      const selection = normalizeModel(options.adapter, modelValue, range)

      if (!selection.start) return

      const isVisible = visibleMonths.value.some(month => options.adapter.isSameMonth(month, selection.start as TDate))
      if (!isVisible) syncMonth(selection.start)
    },
    { immediate: true },
  )

  watch(
    () => options.months.value,
    () => {
      syncMonth(displayedMonth.value)
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
