import { computed, ref, watch, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  AdvancedDateModel,
  NormalizedRange,
  PresetRange,
} from '@/types'
import { isRangeDisabled, isStartDateDisabled } from '@/util/dates'
import { normalizeModel, orderRange, serializeModel } from '@/util/model'

export function useAdvancedDateModel<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  range: Ref<boolean>
  selectionTargetField: Ref<AdvancedDateInputField | null>
  returnObject: Ref<boolean>
  autoApply: Ref<boolean>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
  onUpdate: (value: AdvancedDateModel<TDate>) => void
  onApply?: (value: AdvancedDateModel<TDate>) => void
  onCancel?: () => void
}) {
  const draft = ref(
    normalizeModel(
      options.adapter,
      options.modelValue.value,
      options.range.value,
    ),
  ) as Ref<NormalizedRange<TDate>>
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

  function constraints() {
    return {
      min: options.min.value,
      max: options.max.value,
      allowedDates: options.allowedDates.value,
      allowedStartDates: options.allowedStartDates.value,
      allowedEndDates: options.allowedEndDates.value,
    }
  }

  function isDraftUnavailable(range: NormalizedRange<TDate>) {
    if (!range.start && !range.end) return false

    if (!options.range.value) {
      return (
        !!range.start &&
        isStartDateDisabled(options.adapter, range.start, constraints())
      )
    }

    return isRangeDisabled(options.adapter, range, constraints())
  }

  function commit(range: NormalizedRange<TDate>) {
    const ordered = orderRange(options.adapter, range) as NormalizedRange<TDate>
    if (isDraftUnavailable(ordered)) return false

    const serialized = serializeModel(ordered, {
      range: options.range.value,
      returnObject: options.returnObject.value,
    })

    draft.value = ordered
    options.onUpdate(serialized)
    options.onApply?.(serialized)
    return true
  }

  function setHoverDate(date: TDate | null) {
    const isSelectingEnd = options.selectionTargetField.value === 'end'

    if (
      !options.range.value ||
      !draft.value.start ||
      (draft.value.end && !isSelectingEnd)
    ) {
      hoveredDate.value = null
      return
    }

    if (date) {
      const next = orderRange(options.adapter, {
        start: draft.value.start,
        end: date,
      }) as NormalizedRange<TDate>

      if (!isRangeDisabled(options.adapter, next, constraints())) {
        hoveredDate.value = date
        return
      }
    }

    hoveredDate.value = null
  }

  function selectDate(date: TDate) {
    if (!options.range.value) {
      if (isStartDateDisabled(options.adapter, date, constraints())) return

      const next: NormalizedRange<TDate> = { start: date, end: null }
      if (options.autoApply.value) commit(next)
      else draft.value = next
      return
    }

    if (options.selectionTargetField.value === 'end' && draft.value.start) {
      const next = orderRange(options.adapter, {
        start: draft.value.start,
        end: date,
      }) as NormalizedRange<TDate>

      if (isRangeDisabled(options.adapter, next, constraints())) return

      hoveredDate.value = null

      if (options.autoApply.value) commit(next)
      else draft.value = next
      return
    }

    if (!draft.value.start || draft.value.end) {
      if (isStartDateDisabled(options.adapter, date, constraints())) return

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

    if (isRangeDisabled(options.adapter, next, constraints())) return

    hoveredDate.value = null

    if (options.autoApply.value) commit(next)
    else draft.value = next
  }

  function apply() {
    return commit(draft.value as NormalizedRange<TDate>)
  }

  function cancel() {
    draft.value = normalizeModel(
      options.adapter,
      options.modelValue.value,
      options.range.value,
    )
    hoveredDate.value = null
    options.onCancel?.()
  }

  function selectPreset(preset: PresetRange<TDate>) {
    const [start, end] =
      typeof preset.value === 'function' ? preset.value() : preset.value
    const next = orderRange(options.adapter, {
      start,
      end,
    }) as NormalizedRange<TDate>

    if (isRangeDisabled(options.adapter, next, constraints())) return false

    if (options.autoApply.value) return commit(next)

    draft.value = next
    return true
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
