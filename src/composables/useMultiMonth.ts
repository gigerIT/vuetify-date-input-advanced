import { computed, ref, toValue, watch, type Ref } from 'vue'
import { useDate, useDisplay } from 'vuetify'
import { getRangeEdges } from '@/utils/dateHelpers'

interface UseMultiMonthOptions {
  months: Ref<number>
  modelValue: Ref<unknown | unknown[] | null>
  min: Ref<unknown | null | undefined>
  max: Ref<unknown | null | undefined>
  mobileBreakpoint: Ref<number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | undefined>
}

function clampMonthCount(months: number, displayName: string, mobile: boolean): number {
  if (mobile || displayName === 'xs' || displayName === 'sm') return 1
  if (displayName === 'md') return Math.max(1, Math.min(months, 2))
  if (displayName === 'lg') return Math.max(1, Math.min(months, 3))
  return Math.max(1, months)
}

export function useMultiMonth(options: UseMultiMonthOptions) {
  const adapter = useDate()
  const display = useDisplay({ mobileBreakpoint: options.mobileBreakpoint.value })

  const anchorDate = ref(adapter.startOfMonth(adapter.date()))

  const effectiveMonths = computed(() => {
    const requested = Number(toValue(options.months)) || 1
    return clampMonthCount(requested, display.name.value, display.mobile.value)
  })

  const minMonth = computed(() => {
    if (!options.min.value) return null
    return adapter.startOfMonth(options.min.value)
  })

  const maxMonth = computed(() => {
    if (!options.max.value) return null
    return adapter.startOfMonth(options.max.value)
  })

  function clampAnchor(value: unknown): unknown {
    let next = adapter.startOfMonth(value)

    if (minMonth.value && adapter.isBefore(next, minMonth.value)) {
      next = minMonth.value
    }

    if (maxMonth.value) {
      const visibleMaxStart = adapter.addMonths(maxMonth.value, -(effectiveMonths.value - 1))
      if (adapter.isAfter(next, visibleMaxStart)) {
        next = visibleMaxStart
      }
    }

    return next
  }

  function setAnchor(date: unknown | null | undefined): void {
    if (!date) {
      anchorDate.value = clampAnchor(adapter.date())
      return
    }
    anchorDate.value = clampAnchor(date)
  }

  function moveBy(amount: number): void {
    anchorDate.value = clampAnchor(adapter.addMonths(anchorDate.value, amount))
  }

  const monthViews = computed(() => {
    return Array.from({ length: effectiveMonths.value }, (_, index) => {
      const date = adapter.addMonths(anchorDate.value, index)
      return {
        key: `${adapter.getYear(date)}-${adapter.getMonth(date)}`,
        date,
        month: adapter.getMonth(date),
        year: adapter.getYear(date),
      }
    })
  })

  const canGoPrev = computed(() => {
    if (!minMonth.value) return true
    const candidate = adapter.addMonths(anchorDate.value, -1)
    return !adapter.isBefore(candidate, minMonth.value)
  })

  const canGoNext = computed(() => {
    if (!maxMonth.value) return true
    const candidate = adapter.addMonths(anchorDate.value, 1)
    const visibleMaxStart = adapter.addMonths(maxMonth.value, -(effectiveMonths.value - 1))
    return !adapter.isAfter(candidate, visibleMaxStart)
  })

  watch(
    () => options.modelValue.value,
    (value) => {
      const edges = getRangeEdges(value)
      if (edges.start) setAnchor(edges.start)
    },
    { immediate: true },
  )

  watch(
    () => [options.min.value, options.max.value, effectiveMonths.value],
    () => {
      anchorDate.value = clampAnchor(anchorDate.value)
    },
  )

  return {
    monthViews,
    effectiveMonths,
    canGoPrev,
    canGoNext,
    previous: () => moveBy(-1),
    next: () => moveBy(1),
    setAnchor,
    mobile: display.mobile,
  }
}
