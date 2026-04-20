import { computed, readonly, ref, watch, type Ref } from 'vue'

import { useDateInputAdvancedLocale } from '@/composables/useDateInputAdvancedLocale'
import type {
  AdvancedDateAdapter,
  AdvancedDateInputAvailabilityStatus,
  AdvancedDateInputParseStatus,
  AdvancedDateInputValidationStatus,
  AdvancedDateModel,
  DateInputAdvancedLocaleMessages,
  NormalizedRange,
} from '@/types'
import {
  formatInputValue,
  isRangeDisabled,
  isStartDateDisabled,
  parseInputDate,
} from '@/util/dates'
import { normalizeModel, orderRange } from '@/util/model'

type InputErrorKey =
  keyof DateInputAdvancedLocaleMessages['dateInputAdvanced']['errors']

interface TextDraftAssessment<TDate> {
  selection: NormalizedRange<TDate>
  parseStatus: AdvancedDateInputParseStatus
  availabilityStatus: AdvancedDateInputAvailabilityStatus
  validationStatus: AdvancedDateInputValidationStatus
  errorKey: InputErrorKey | null
}

function splitRangeInput(
  input: string,
  separator: string,
): [string, string] | null {
  if (input.includes(separator)) {
    const index = input.indexOf(separator)

    return [
      input.slice(0, index),
      input.slice(index + separator.length),
    ]
  }

  const match = input.match(/^(.*?)(?:\s+[-–—]\s+)(.*)$/)
  if (!match) return null

  return [match[1], match[2]]
}

function deriveValidationStatus(
  parseStatus: AdvancedDateInputParseStatus,
  availabilityStatus: AdvancedDateInputAvailabilityStatus,
): AdvancedDateInputValidationStatus {
  if (parseStatus === 'empty') return 'idle'
  if (parseStatus === 'complete' && availabilityStatus === 'available') {
    return 'valid'
  }

  return 'invalid'
}

function emptyAssessment<TDate>(): TextDraftAssessment<TDate> {
  return {
    selection: { start: null, end: null },
    parseStatus: 'empty',
    availabilityStatus: 'unknown',
    validationStatus: 'idle',
    errorKey: null,
  }
}

export function useAdvancedDateInput<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  editable: Ref<boolean>
  textValue: Ref<string | undefined>
  range: Ref<boolean>
  displayFormat: Ref<string>
  rangeSeparator: Ref<string>
  parseInput: Ref<((value: string) => TDate | null) | undefined>
  min: Ref<TDate | null | undefined>
  max: Ref<TDate | null | undefined>
  allowedDates: Ref<((date: TDate) => boolean) | undefined>
  allowedStartDates: Ref<((date: TDate) => boolean) | undefined>
  allowedEndDates: Ref<((date: TDate) => boolean) | undefined>
  onTextUpdate: (value: string) => void
}) {
  const { tDateInputAdvanced } = useDateInputAdvancedLocale()
  const text = ref('')
  const isEditing = ref(false)
  const inputError = ref<InputErrorKey | null>(null)
  const isPristine = ref(true)

  const committedSelection = computed(() =>
    normalizeModel(
      options.adapter,
      options.modelValue.value,
      options.range.value,
    ),
  )
  const committedText = computed(() =>
    formatInputValue(options.adapter, committedSelection.value, {
      range: options.range.value,
      displayFormat: options.displayFormat.value,
      separator: options.rangeSeparator.value,
    }),
  )

  watch(
    options.textValue,
    (value) => {
      if (value === undefined || value === text.value) return

      text.value = value
      inputError.value = null
      isPristine.value = true
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

  function assessText(value = text.value): TextDraftAssessment<TDate> {
    const trimmed = value.trim()
    if (!trimmed) return emptyAssessment<TDate>()

    if (!options.range.value) {
      const parsed = parseInputDate(
        options.adapter,
        trimmed,
        options.parseInput.value,
      )

      if (!parsed) {
        return {
          selection: { start: null, end: null },
          parseStatus: 'invalid',
          availabilityStatus: 'unknown',
          validationStatus: 'invalid',
          errorKey: 'invalidDate',
        }
      }

      const unavailable = isStartDateDisabled(
        options.adapter,
        parsed,
        constraints(),
      )

      return {
        selection: { start: parsed, end: null },
        parseStatus: 'complete',
        availabilityStatus: unavailable ? 'unavailable' : 'available',
        validationStatus: unavailable ? 'invalid' : 'valid',
        errorKey: unavailable ? 'unavailableDate' : null,
      }
    }

    const parts = splitRangeInput(trimmed, options.rangeSeparator.value)
    if (!parts) {
      const start = parseInputDate(
        options.adapter,
        trimmed,
        options.parseInput.value,
      )

      if (!start) {
        return {
          selection: { start: null, end: null },
          parseStatus: 'invalid',
          availabilityStatus: 'unknown',
          validationStatus: 'invalid',
          errorKey: 'invalidRange',
        }
      }

      const selection = { start, end: null }
      const unavailable = isRangeDisabled(
        options.adapter,
        selection,
        constraints(),
      )

      return {
        selection,
        parseStatus: 'partial',
        availabilityStatus: unavailable ? 'unavailable' : 'available',
        validationStatus: 'invalid',
        errorKey: unavailable ? 'unavailableRange' : null,
      }
    }

    const [rawStart, rawEnd] = parts
    const startText = rawStart.trim()
    const endText = rawEnd.trim()

    const start = startText
      ? parseInputDate(options.adapter, startText, options.parseInput.value)
      : null
    const end = endText
      ? parseInputDate(options.adapter, endText, options.parseInput.value)
      : null

    if (!startText || (startText && !start)) {
      return {
        selection: { start: null, end: null },
        parseStatus: 'invalid',
        availabilityStatus: 'unknown',
        validationStatus: 'invalid',
        errorKey: 'invalidRange',
      }
    }

    if (!endText) {
      const selection = { start, end: null }
      const unavailable = isRangeDisabled(
        options.adapter,
        selection,
        constraints(),
      )

      return {
        selection,
        parseStatus: 'partial',
        availabilityStatus: unavailable ? 'unavailable' : 'available',
        validationStatus: 'invalid',
        errorKey: unavailable ? 'unavailableRange' : null,
      }
    }

    if (!end) {
      return {
        selection: { start, end: null },
        parseStatus: 'invalid',
        availabilityStatus: 'unknown',
        validationStatus: 'invalid',
        errorKey: 'invalidRange',
      }
    }

    const selection = orderRange(options.adapter, { start, end })
    const unavailable = isRangeDisabled(
      options.adapter,
      selection,
      constraints(),
    )

    return {
      selection,
      parseStatus: 'complete',
      availabilityStatus: unavailable ? 'unavailable' : 'available',
      validationStatus: deriveValidationStatus(
        'complete',
        unavailable ? 'unavailable' : 'available',
      ),
      errorKey: unavailable ? 'unavailableRange' : null,
    }
  }

  function resetValidation() {
    inputError.value = null
    isPristine.value = true
  }

  function setValidationError(key: InputErrorKey | null) {
    inputError.value = key
    isPristine.value = false
  }

  function markValid() {
    inputError.value = null
    isPristine.value = false
  }

  function setExternalText(value: string) {
    if (value === text.value) return

    text.value = value
    resetValidation()
  }

  function onFocus() {
    if (!options.editable.value) return
    isEditing.value = true
  }

  function onBlur() {
    isEditing.value = false
  }

  return {
    text: readonly(text),
    committedSelection,
    committedText,
    textDraft: computed(() => assessText()),
    inputError: readonly(inputError),
    errorMessages: computed(() =>
      inputError.value
        ? [tDateInputAdvanced(`errors.${inputError.value}`)]
        : [],
    ),
    isDirty: computed(() => text.value !== committedText.value),
    isPristine: readonly(isPristine),
    isValid: computed<boolean | null>(() =>
      isPristine.value ? null : !inputError.value,
    ),
    isEditing: readonly(isEditing),
    onFocus,
    onBlur,
    markValid,
    resetValidation,
    setText: (value: string) => {
      if (!options.editable.value || value === text.value) return

      text.value = value
      resetValidation()
      options.onTextUpdate(value)
    },
    setValidationError,
    setExternalText,
    syncText: (value: string) => {
      if (value === text.value) return

      text.value = value
      resetValidation()
      options.onTextUpdate(value)
    },
    assessText,
  }
}
