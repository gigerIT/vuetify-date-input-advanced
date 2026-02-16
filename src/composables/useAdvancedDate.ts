import { ref, computed, watch, type Ref } from 'vue'
import type { SelectionPhase, DateModelValue } from '../types'
import { isSameDay, startOfDay, isBefore } from '../utils/dateHelpers'

export interface UseAdvancedDateOptions {
  modelValue: Ref<DateModelValue>
  range: Ref<boolean>
  autoApply: Ref<boolean>
  allowedDates?: Ref<((date: Date) => boolean) | undefined>
  min?: Ref<Date | string | undefined>
  max?: Ref<Date | string | undefined>
}

export function useAdvancedDate(options: UseAdvancedDateOptions) {
  const { modelValue, range, autoApply, allowedDates, min, max } = options

  const phase = ref<SelectionPhase>('idle')
  const startDate = ref<Date | null>(null)
  const endDate = ref<Date | null>(null)
  // Pending dates for non-auto-apply mode
  const pendingStart = ref<Date | null>(null)
  const pendingEnd = ref<Date | null>(null)

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

  /** Check if a specific date is allowed / enabled */
  function isDateDisabled(date: Date): boolean {
    const d = startOfDay(date)
    if (minDate.value && d.getTime() < startOfDay(minDate.value).getTime()) return true
    if (maxDate.value && d.getTime() > startOfDay(maxDate.value).getTime()) return true
    if (allowedDates?.value && !allowedDates.value(d)) return true
    return false
  }

  /** Normalize start/end so start <= end */
  function normalize(a: Date, b: Date): [Date, Date] {
    return isBefore(a, b) ? [a, b] : [b, a]
  }

  /** Handle a day click */
  function selectDate(date: Date) {
    if (isDateDisabled(date)) return

    const d = startOfDay(date)

    if (!range.value) {
      // Single date mode
      startDate.value = d
      endDate.value = null
      phase.value = 'complete'
      if (autoApply.value) {
        emitValue()
      } else {
        pendingStart.value = d
        pendingEnd.value = null
      }
      return
    }

    // Range mode
    if (phase.value === 'idle' || phase.value === 'complete') {
      // Start a new range
      startDate.value = d
      endDate.value = null
      pendingStart.value = d
      pendingEnd.value = null
      phase.value = 'start-selected'
    } else if (phase.value === 'start-selected') {
      // Complete the range
      const [s, e] = normalize(startDate.value!, d)
      startDate.value = s
      endDate.value = e
      pendingStart.value = s
      pendingEnd.value = e
      phase.value = 'complete'

      if (autoApply.value) {
        emitValue()
      }
    }
  }

  /** Apply pending selection (for non-auto-apply mode) */
  function apply() {
    if (pendingStart.value) {
      startDate.value = pendingStart.value
      endDate.value = pendingEnd.value
      emitValue()
    }
  }

  /** Cancel pending selection */
  function cancel() {
    // Restore from model value
    syncFromModel()
    // Sync pending state too, so a subsequent apply() won't emit the canceled selection
    pendingStart.value = startDate.value
    pendingEnd.value = endDate.value
    phase.value = startDate.value ? 'complete' : 'idle'
  }

  /** Reset selection */
  function reset() {
    startDate.value = null
    endDate.value = null
    pendingStart.value = null
    pendingEnd.value = null
    phase.value = 'idle'
  }

  /** Set range directly (e.g., from preset) */
  function setRange(start: Date, end: Date) {
    const [s, e] = normalize(start, end)
    startDate.value = s
    endDate.value = e
    pendingStart.value = s
    pendingEnd.value = e
    phase.value = 'complete'

    if (autoApply.value) {
      emitValue()
    }
  }

  // Emit helpers
  const emit = ref<((value: DateModelValue) => void) | null>(null)

  function setEmitter(fn: (value: DateModelValue) => void) {
    emit.value = fn
  }

  function emitValue() {
    if (!emit.value) return
    if (!range.value) {
      emit.value(startDate.value)
    } else if (startDate.value && endDate.value) {
      emit.value([startDate.value, endDate.value])
    } else if (startDate.value) {
      emit.value(startDate.value)
    } else {
      emit.value(null)
    }
  }

  /** Sync internal state from model value */
  function syncFromModel() {
    const v = modelValue.value
    if (v === null) {
      startDate.value = null
      endDate.value = null
      phase.value = 'idle'
    } else if (Array.isArray(v)) {
      startDate.value = startOfDay(v[0])
      endDate.value = startOfDay(v[1])
      pendingStart.value = startDate.value
      pendingEnd.value = endDate.value
      phase.value = 'complete'
    } else if (v instanceof Date) {
      startDate.value = startOfDay(v)
      endDate.value = null
      phase.value = range.value ? 'start-selected' : 'complete'
    }
  }

  // Watch model value for external changes
  watch(modelValue, syncFromModel, { immediate: true })

  const displayRange = computed<[Date, Date] | null>(() => {
    if (startDate.value && endDate.value) {
      return [startDate.value, endDate.value]
    }
    return null
  })

  const hasSelection = computed(() => startDate.value !== null)

  return {
    phase,
    startDate,
    endDate,
    pendingStart,
    pendingEnd,
    displayRange,
    hasSelection,
    selectDate,
    setRange,
    apply,
    cancel,
    reset,
    isDateDisabled,
    setEmitter,
  }
}
