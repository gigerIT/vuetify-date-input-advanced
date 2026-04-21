import { computed, ref, shallowRef, watch, type Ref } from 'vue'

import type {
  AdvancedDateAdapter,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputField,
  AdvancedDateInputSource,
  AdvancedDateModel,
  DateBounds,
  DateInputAdvancedLocaleMessages,
  NormalizedRange,
} from '@/types'
import {
  formatInputValue,
  isRangeDisabled,
  isStartDateDisabled,
  splitRangeInputValue,
} from '@/util/dates'
import { normalizeModel, serializeModel } from '@/util/model'

type InputErrorKey =
  keyof DateInputAdvancedLocaleMessages['dateInputAdvanced']['errors']

type SelectionChangeOrigin = 'external' | 'internal'

type TextControlMode = 'mirror' | 'draft'

interface AdvancedDateInputDraftAssessment<TDate> {
  selection: NormalizedRange<TDate>
  parseStatus: AdvancedDateInputDraft<TDate>['parseStatus']
  availabilityStatus: AdvancedDateInputDraft<TDate>['availabilityStatus']
  validationStatus: AdvancedDateInputDraft<TDate>['validationStatus']
  errorKey: InputErrorKey | null
}

interface AdvancedDateInputTextController<TDate> {
  text: Readonly<Ref<string>>
  committedText: Readonly<Ref<string>>
  textDraft: Readonly<Ref<AdvancedDateInputDraftAssessment<TDate>>>
  resetValidation: () => void
  markValid: () => void
  setText: (value: string) => void
  setExternalText: (value: string) => void
  syncText: (value: string) => void
  assessText: (value?: string) => AdvancedDateInputDraftAssessment<TDate>
}

export function cloneSelection<TDate>(
  selection: NormalizedRange<TDate>,
): NormalizedRange<TDate> {
  return {
    start: selection.start ?? null,
    end: selection.end ?? null,
  }
}

export function cloneDraft<TDate>(
  draft: AdvancedDateInputDraft<TDate>,
): AdvancedDateInputDraft<TDate> {
  return {
    ...draft,
    selection: cloneSelection(draft.selection),
  }
}

export function isSameSelection<TDate>(
  adapter: AdvancedDateAdapter<TDate>,
  left: NormalizedRange<TDate>,
  right: NormalizedRange<TDate>,
): boolean {
  const sameStart =
    (!left.start && !right.start) ||
    (!!left.start &&
      !!right.start &&
      adapter.isSameDay(left.start, right.start))
  const sameEnd =
    (!left.end && !right.end) ||
    (!!left.end &&
      !!right.end &&
      adapter.isSameDay(left.end, right.end))

  return sameStart && sameEnd
}

export function isSelectionComplete<TDate>(
  selection: NormalizedRange<TDate>,
  range: boolean,
): boolean {
  if (!range) return !!selection.start
  return !!selection.start && !!selection.end
}

export function useAdvancedDateInputDraft<TDate>(options: {
  adapter: AdvancedDateAdapter<TDate>
  input: AdvancedDateInputTextController<TDate>
  modelValue: Ref<AdvancedDateModel<TDate>>
  editable: Ref<boolean>
  textValue: Ref<string | undefined>
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
  onDraftUpdate: (draft: AdvancedDateInputDraft<TDate>) => void
  onTextUpdate: (value: string) => void
  onModelUpdate: (value: AdvancedDateModel<TDate>) => void
  onInputCommit: (payload: AdvancedDateInputCommitPayload<TDate>) => void
  onPassiveActiveFieldSync: (selection: NormalizedRange<TDate>) => void
  resetFieldValidation: () => void | Promise<void>
}) {
  const committedSelection = shallowRef<NormalizedRange<TDate>>({
    start: null,
    end: null,
  })
  const pickerSelection = shallowRef<NormalizedRange<TDate>>({
    start: null,
    end: null,
  })
  const controlledTextMode = ref<TextControlMode>(
    options.textValue.value !== undefined &&
      options.editable.value &&
      options.textValue.value !== options.input.committedText.value
      ? 'draft'
      : 'mirror',
  )
  const draftSource = ref<AdvancedDateInputSource>(
    controlledTextMode.value === 'draft' ? 'text' : 'picker',
  )
  const hasUncontrolledTextDraft = ref(false)
  const pendingControlledTextEchoes = ref<string[]>([])
  const pickerBoundaryField = ref<AdvancedDateInputField | null>(null)
  const pickerSelectionChangeOrigin = ref<SelectionChangeOrigin>('external')

  function formatSelection(selection: NormalizedRange<TDate>) {
    return formatInputValue(options.adapter, selection, {
      range: options.range.value,
      displayFormat: options.displayFormat.value,
      separator: options.rangeSeparator.value,
    })
  }

  const committedDisplayText = computed(() =>
    formatSelection(committedSelection.value),
  )
  const rangeTextParts = computed(() =>
    splitRangeInputValue(options.input.text.value, options.rangeSeparator.value),
  )

  function createDateConstraints(): DateBounds<TDate> {
    return {
      min: options.min.value,
      max: options.max.value,
      allowedDates: options.allowedDates.value,
      allowedStartDates: options.allowedStartDates.value,
      allowedEndDates: options.allowedEndDates.value,
    }
  }

  function createPickerDraft(
    selection = pickerSelection.value,
    text = options.input.text.value,
  ): AdvancedDateInputDraft<TDate> {
    const normalizedSelection = cloneSelection(selection)
    const isDirty = text !== committedDisplayText.value
    const constraints = createDateConstraints()

    if (!normalizedSelection.start && !normalizedSelection.end) {
      return {
        text,
        selection: normalizedSelection,
        source: 'picker',
        isDirty,
        parseStatus: 'empty',
        availabilityStatus: 'unknown',
        validationStatus: 'idle',
        errorKey: null,
      }
    }

    const parseStatus =
      !options.range.value || isSelectionComplete(normalizedSelection, true)
        ? 'complete'
        : 'partial'
    const unavailable = !options.range.value
      ? !!normalizedSelection.start &&
        isStartDateDisabled(
          options.adapter,
          normalizedSelection.start,
          constraints,
        )
      : isRangeDisabled(options.adapter, normalizedSelection, constraints)
    const errorKey = unavailable
      ? options.range.value
        ? 'unavailableRange'
        : 'unavailableDate'
      : null

    return {
      text,
      selection: normalizedSelection,
      source: 'picker',
      isDirty,
      parseStatus,
      availabilityStatus: unavailable ? 'unavailable' : 'available',
      validationStatus:
        parseStatus === 'complete' && !unavailable ? 'valid' : 'invalid',
      errorKey,
    }
  }

  const pickerText = computed(() => formatSelection(pickerSelection.value))

  function queueControlledTextEcho(value: string) {
    if (
      options.textValue.value === undefined ||
      options.textValue.value === value
    ) {
      return
    }
    if (pendingControlledTextEchoes.value.includes(value)) return

    pendingControlledTextEchoes.value.push(value)
  }

  function consumeControlledTextEcho(value: string) {
    const index = pendingControlledTextEchoes.value.indexOf(value)
    if (index === -1) return false

    pendingControlledTextEchoes.value.splice(index, 1)
    return true
  }

  function setPickerSelection(
    nextSelection: NormalizedRange<TDate>,
    origin: SelectionChangeOrigin = pickerSelectionChangeOrigin.value,
  ) {
    const normalizedSelection = cloneSelection(nextSelection)

    pickerSelectionChangeOrigin.value = origin

    if (
      !isSameSelection(options.adapter, pickerSelection.value, normalizedSelection)
    ) {
      pickerSelection.value = normalizedSelection
    }
  }

  function syncInputText(value: string) {
    if (value === options.input.text.value) {
      if (
        options.textValue.value !== undefined &&
        options.textValue.value !== value
      ) {
        queueControlledTextEcho(value)
        options.onTextUpdate(value)
      }
      return
    }

    queueControlledTextEcho(value)
    options.input.syncText(value)
  }

  function syncPickerSelectionFromText(
    value = options.input.text.value,
    origin: SelectionChangeOrigin = 'internal',
  ) {
    const assessed = options.input.assessText(value)
    setPickerSelection(assessed.selection, origin)

    return assessed
  }

  function syncCommittedMirror(selection = committedSelection.value) {
    hasUncontrolledTextDraft.value = false
    controlledTextMode.value = 'mirror'
    pickerBoundaryField.value = null
    setPickerSelection(selection, 'external')
    draftSource.value = 'picker'
    options.onPassiveActiveFieldSync(selection)
    syncInputText(formatSelection(selection))
  }

  watch(
    [
      options.modelValue,
      options.range,
      options.textValue,
      options.editable,
    ],
    ([value, range, text, editable], previous) => {
      const next = normalizeModel(options.adapter, value, range)
      const previousText = previous?.[2]
      const textChanged = text !== previousText
      const isControlledTextEcho =
        text !== undefined && textChanged && consumeControlledTextEcho(text)
      const preserveUncontrolledTextDraft =
        editable &&
        draftSource.value === 'text' &&
        hasUncontrolledTextDraft.value
      const nextCommittedText = formatSelection(next)

      committedSelection.value = cloneSelection(next)

      if (!editable) {
        syncCommittedMirror(next)
      } else if (preserveUncontrolledTextDraft) {
        syncPickerSelectionFromText(options.input.text.value)
      } else if (isControlledTextEcho) {
        controlledTextMode.value = 'mirror'
        draftSource.value = 'picker'
        pickerSelectionChangeOrigin.value = 'internal'
      } else if (text !== undefined) {
        if (textChanged) {
          options.input.setExternalText(text)
          controlledTextMode.value =
            text === nextCommittedText ? 'mirror' : 'draft'
        }

        if (controlledTextMode.value === 'draft') {
          draftSource.value = 'text'
          syncPickerSelectionFromText(
            options.input.text.value,
            textChanged ? 'external' : pickerSelectionChangeOrigin.value,
          )
        } else {
          syncCommittedMirror(next)
        }
      } else {
        syncCommittedMirror(next)
      }

      options.input.resetValidation()
      void options.resetFieldValidation()
    },
    { immediate: true },
  )

  watch(
    [
      options.parseInput,
      options.rangeSeparator,
      options.min,
      options.max,
      options.allowedDates,
      options.allowedStartDates,
      options.allowedEndDates,
    ],
    () => {
      if (draftSource.value !== 'text') return

      syncPickerSelectionFromText(options.input.text.value)
    },
  )

  watch(
    pickerText,
    (value) => {
      if (draftSource.value !== 'picker') return
      if (value === options.input.text.value) return

      syncInputText(value)
    },
    { immediate: true },
  )

  const draft = computed<AdvancedDateInputDraft<TDate>>(() => {
    const base =
      draftSource.value === 'text'
        ? options.input.textDraft.value
        : createPickerDraft()

    return {
      text: options.input.text.value,
      selection: cloneSelection(base.selection),
      source: draftSource.value,
      isDirty: options.input.text.value !== committedDisplayText.value,
      parseStatus: base.parseStatus,
      availabilityStatus: base.availabilityStatus,
      validationStatus: base.validationStatus,
      errorKey: base.errorKey,
    }
  })

  watch(
    draft,
    (value) => {
      options.onDraftUpdate(cloneDraft(value))
    },
    { immediate: true },
  )

  function serializeSelection(
    selection: NormalizedRange<TDate>,
  ): AdvancedDateModel<TDate> {
    return serializeModel(selection, {
      range: options.range.value,
      returnObject: options.returnObject.value,
    })
  }

  function finalizeCommittedSelection(selection: NormalizedRange<TDate>) {
    const normalizedSelection = cloneSelection(selection)
    const changed = !isSameSelection(
      options.adapter,
      committedSelection.value,
      normalizedSelection,
    )
    const value = serializeSelection(normalizedSelection)
    const committedText = formatSelection(normalizedSelection)

    hasUncontrolledTextDraft.value = false
    controlledTextMode.value = 'mirror'
    pickerBoundaryField.value = null
    committedSelection.value = cloneSelection(normalizedSelection)
    const committedDraft = createPickerDraft(
      normalizedSelection,
      committedText,
    )

    setPickerSelection(normalizedSelection, 'internal')
    draftSource.value = 'picker'
    options.onPassiveActiveFieldSync(normalizedSelection)
    syncInputText(committedDraft.text)
    options.input.markValid()

    return {
      changed,
      value,
      draft: committedDraft,
    }
  }

  function commitSelection(selection: NormalizedRange<TDate>) {
    const result = finalizeCommittedSelection(selection)
    if (!result.changed) return result

    options.onModelUpdate(result.value)
    options.onInputCommit({
      value: result.value,
      draft: cloneDraft(result.draft),
    })

    return result
  }

  function revertDraft() {
    syncCommittedMirror(committedSelection.value)
    options.input.resetValidation()
    void options.resetFieldValidation()
  }

  function updateFieldText(value: string) {
    hasUncontrolledTextDraft.value = options.textValue.value === undefined
    if (options.textValue.value !== undefined) {
      controlledTextMode.value = 'draft'
    }
    pickerBoundaryField.value = null
    draftSource.value = 'text'
    options.input.setText(value)
    syncPickerSelectionFromText(value)
  }

  function applyPickerDraft(nextSelection: NormalizedRange<TDate>) {
    hasUncontrolledTextDraft.value = false
    controlledTextMode.value = 'mirror'
    setPickerSelection(nextSelection, 'internal')
    draftSource.value = 'picker'
    options.input.resetValidation()
    void options.resetFieldValidation()
  }

  return {
    committedSelection,
    pickerSelection,
    draftSource,
    pickerBoundaryField,
    pickerSelectionChangeOrigin,
    committedDisplayText,
    rangeTextParts,
    draft,
    createDateConstraints,
    serializeSelection,
    commitSelection,
    revertDraft,
    updateFieldText,
    applyPickerDraft,
  }
}
