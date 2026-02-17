import { ref, computed, type Ref } from 'vue'
import type { SelectionPhase } from '../types'
import { isInRange, startOfDay, isSameDay } from '../utils/dateHelpers'

export interface UseHoverPreviewOptions {
  phase: Ref<SelectionPhase>
  startDate: Ref<Date | null>
}

export function useHoverPreview(options: UseHoverPreviewOptions) {
  const { phase, startDate } = options
  const hoverDate = ref<Date | null>(null)

  function onDayHover(date: Date | null) {
    hoverDate.value = date ? startOfDay(date) : null
  }

  function onDayLeave() {
    hoverDate.value = null
  }

  /** Whether a date is in the hover-preview range */
  function isInHoverRange(date: Date): boolean {
    if (phase.value !== 'start-selected') return false
    if (!startDate.value || !hoverDate.value) return false
    return isInRange(date, startDate.value, hoverDate.value)
  }

  /** Whether a specific date is the hover target */
  function isHoverTarget(date: Date): boolean {
    if (!hoverDate.value) return false
    return isSameDay(date, hoverDate.value)
  }

  const previewRange = computed<[Date, Date] | null>(() => {
    if (phase.value !== 'start-selected') return null
    if (!startDate.value || !hoverDate.value) return null
    const s = startDate.value
    const h = hoverDate.value
    return s.getTime() <= h.getTime() ? [s, h] : [h, s]
  })

  return {
    hoverDate,
    previewRange,
    onDayHover,
    onDayLeave,
    isInHoverRange,
    isHoverTarget,
  }
}
