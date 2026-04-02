import { computed, ref, watch, type Ref } from 'vue'

import type { AdvancedDateAdapter, AdvancedDateModel, NormalizedRange, PresetRange } from '@/types'
import { isDateDisabled } from '@/util/dates'
import { normalizeModel, orderRange, serializeModel } from '@/util/model'

export function useAdvancedDateModel<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  range: Ref<boolean>
  returnObject: Ref<boolean>
  autoApply: Ref<boolean>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  onUpdate: (value: AdvancedDateModel<TDate>) => void
  onApply?: (value: AdvancedDateModel<TDate>) => void
  onCancel?: () => void
}) {
  const draft = ref(normalizeModel(
    options.adapter,
    options.modelValue.value,
    options.range.value,
  )) as Ref<NormalizedRange<TDate>>
  const hoveredDate = ref<TDate | null>(null)

  const normalized = computed(() => draft.value)

  watch(
    [() => options.modelValue.value, () => options.range.value],
    ([value, range]) => {
      draft.value = normalizeModel(options.adapter, value, range)
      hoveredDate.value = null
    },
    { immediate: true },
  )

  function commit(range: NormalizedRange<TDate>) {
    const ordered = orderRange(options.adapter, range)
    const serialized = serializeModel(ordered, {
      range: options.range.value,
      returnObject: options.returnObject.value,
    })

    draft.value = ordered
    options.onUpdate(serialized)
    options.onApply?.(serialized)
  }

  function setHoverDate(date: TDate | null) {
    if (!options.range.value || !draft.value.start || draft.value.end) {
      hoveredDate.value = null
      return
    }

    if (date && !isDateDisabled(options.adapter, date, bounds())) {
      hoveredDate.value = date
      return
    }

    hoveredDate.value = null
  }

  function selectDate(date: TDate) {
    if (isDateDisabled(options.adapter, date, bounds())) return

    if (!options.range.value) {
      const next: NormalizedRange<TDate> = { start: date, end: null }
      if (options.autoApply.value) commit(next)
      else draft.value = next
      return
    }

    if (!draft.value.start || draft.value.end) {
      const next: NormalizedRange<TDate> = { start: date, end: null }
      if (options.autoApply.value) commit(next)
      else draft.value = next
      hoveredDate.value = null
      return
    }

    const next = orderRange(options.adapter, {
      start: draft.value.start,
      end: date,
    }) as NormalizedRange<TDate>

    hoveredDate.value = null

    if (options.autoApply.value) commit(next)
    else draft.value = next
  }

  function apply() {
    commit(draft.value as NormalizedRange<TDate>)
  }

  function cancel() {
    draft.value = normalizeModel(options.adapter, options.modelValue.value, options.range.value)
    hoveredDate.value = null
    options.onCancel?.()
  }

  function selectPreset(preset: PresetRange<TDate>) {
    const [start, end] = typeof preset.value === 'function' ? preset.value() : preset.value
    const next = orderRange(options.adapter, { start, end }) as NormalizedRange<TDate>

    if (options.autoApply.value) commit(next)
    else draft.value = next
  }

  function bounds() {
    return {
      min: options.min.value,
      max: options.max.value,
      allowedDates: options.allowedDates.value,
    }
  }

  return {
    draft,
    normalized,
    hoveredDate,
    selectDate,
    setHoverDate,
    selectPreset,
    apply,
    cancel,
  }
}
