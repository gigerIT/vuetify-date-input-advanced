import { computed, readonly, ref, watch, type Ref } from 'vue'

import type { AdvancedDateAdapter, AdvancedDateModel } from '@/types'
import {
  formatInputValue,
  isRangeDisabled,
  isStartDateDisabled,
  parseInputDate,
} from '@/util/dates'
import { normalizeModel, orderRange, serializeModel } from '@/util/model'

function splitRangeInput(
  input: string,
  separator: string,
): [string, string] | null {
  if (input.includes(separator)) {
    const [start, end] = input.split(separator)
    if (end != null) return [start, end]
  }

  const fallback = input.split(/\s+[-–—]\s+/)
  if (fallback.length === 2) return [fallback[0], fallback[1]]

  return null
}

export function useAdvancedDateInput<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  range: Ref<boolean>
  returnObject: Ref<boolean>
  displayFormat: Ref<string>
  rangeSeparator: Ref<string>
  parseInput: Ref<((value: string) => TDate | null) | undefined>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
  onUpdate: (value: AdvancedDateModel<TDate>) => void
}) {
  const text = ref('')
  const isEditing = ref(false)
  const inputError = ref<string | null>(null)

  const normalized = computed(() =>
    normalizeModel(
      options.adapter,
      options.modelValue.value,
      options.range.value,
    ),
  )
  const displayText = computed(() => {
    return formatInputValue(options.adapter, normalized.value, {
      range: options.range.value,
      displayFormat: options.displayFormat.value,
      separator: options.rangeSeparator.value,
    })
  })

  watch(
    displayText,
    (value) => {
      if (!isEditing.value) text.value = value
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

  function isUnavailable(date: TDate): boolean {
    return isStartDateDisabled(options.adapter, date, constraints())
  }

  function commitInput(): boolean {
    inputError.value = null

    const trimmed = text.value.trim()
    if (!trimmed) {
      options.onUpdate(null)
      text.value = ''
      return true
    }

    if (!options.range.value) {
      const parsed = parseInputDate(
        options.adapter,
        trimmed,
        options.parseInput.value,
      )
      if (!parsed) {
        inputError.value = 'Enter a valid date'
        return false
      }

      if (isUnavailable(parsed)) {
        inputError.value = 'Date is unavailable'
        return false
      }

      options.onUpdate(parsed)
      text.value = options.adapter.format(parsed, options.displayFormat.value)
      return true
    }

    const parts = splitRangeInput(trimmed, options.rangeSeparator.value)
    if (!parts) {
      inputError.value = 'Enter a valid date range'
      return false
    }

    const start = parseInputDate(
      options.adapter,
      parts[0],
      options.parseInput.value,
    )
    const end = parseInputDate(
      options.adapter,
      parts[1],
      options.parseInput.value,
    )

    if (!start || !end) {
      inputError.value = 'Enter a valid date range'
      return false
    }

    const ordered = orderRange(options.adapter, { start, end })

    if (isRangeDisabled(options.adapter, ordered, constraints())) {
      inputError.value = 'One or more dates are unavailable'
      return false
    }

    options.onUpdate(
      serializeModel(ordered, {
        range: true,
        returnObject: options.returnObject.value,
      }),
    )
    text.value = formatInputValue(options.adapter, ordered, {
      range: true,
      displayFormat: options.displayFormat.value,
      separator: options.rangeSeparator.value,
    })

    return true
  }

  function onFocus() {
    isEditing.value = true
  }

  function onBlur(): boolean {
    isEditing.value = false
    const valid = commitInput()
    if (valid) text.value = displayText.value
    return valid
  }

  return {
    text: readonly(text),
    inputError: readonly(inputError),
    errorMessages: computed(() => (inputError.value ? [inputError.value] : [])),
    onFocus,
    onBlur,
    commitInput,
    setText: (value: string) => {
      inputError.value = null
      text.value = value
    },
  }
}
