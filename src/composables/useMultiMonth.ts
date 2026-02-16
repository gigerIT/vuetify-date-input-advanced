import { ref, computed, type Ref } from 'vue'
import { addMonths } from '../utils/dateHelpers'

export interface UseMultiMonthOptions {
  /** Max months to display (will be clamped by breakpoint) */
  months: Ref<number>
  /** Initial date to center the view on */
  initialDate?: Date
  min?: Ref<Date | string | undefined>
  max?: Ref<Date | string | undefined>
}

export interface MonthDescriptor {
  year: number
  month: number
  key: string
}

export function useMultiMonth(options: UseMultiMonthOptions) {
  const { months, min, max } = options

  // The anchor is the leftmost visible month (always normalized to 1st of month)
  const init = options.initialDate ?? new Date()
  const anchorDate = ref(new Date(init.getFullYear(), init.getMonth(), 1))

  /** Effective month count (clamped externally via setEffectiveMonths) */
  const effectiveMonths = ref(months.value)

  function setEffectiveMonths(n: number) {
    effectiveMonths.value = Math.max(1, Math.min(n, months.value))
  }

  /** List of visible month descriptors */
  const visibleMonths = computed<MonthDescriptor[]>(() => {
    const result: MonthDescriptor[] = []
    for (let i = 0; i < effectiveMonths.value; i++) {
      const d = addMonths(anchorDate.value, i)
      result.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        key: `${d.getFullYear()}-${d.getMonth()}`,
      })
    }
    return result
  })

  const minDate = computed(() => {
    const v = min?.value
    if (!v) return undefined
    return v instanceof Date ? v : new Date(v)
  })

  const maxDate = computed(() => {
    const v = max?.value
    if (!v) return undefined
    return v instanceof Date ? v : new Date(v)
  })

  const canGoBack = computed(() => {
    if (!minDate.value) return true
    const prev = addMonths(anchorDate.value, -1)
    return prev.getFullYear() > minDate.value.getFullYear() ||
      (prev.getFullYear() === minDate.value.getFullYear() &&
        prev.getMonth() >= minDate.value.getMonth())
  })

  const canGoForward = computed(() => {
    if (!maxDate.value) return true
    const lastVisible = addMonths(anchorDate.value, effectiveMonths.value - 1)
    const next = addMonths(lastVisible, 1)
    return next.getFullYear() < maxDate.value.getFullYear() ||
      (next.getFullYear() === maxDate.value.getFullYear() &&
        next.getMonth() <= maxDate.value.getMonth())
  })

  function goBack(count = 1) {
    if (!canGoBack.value) return
    anchorDate.value = addMonths(anchorDate.value, -count)
  }

  function goForward(count = 1) {
    if (!canGoForward.value) return
    anchorDate.value = addMonths(anchorDate.value, count)
  }

  /** Jump to a specific month/year as the anchor */
  function goTo(year: number, month: number) {
    anchorDate.value = new Date(year, month, 1)
  }

  /** Center on a date (make its month the leftmost) */
  function centerOn(date: Date) {
    anchorDate.value = new Date(date.getFullYear(), date.getMonth(), 1)
  }

  return {
    anchorDate,
    effectiveMonths,
    visibleMonths,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goTo,
    centerOn,
    setEffectiveMonths,
  }
}
