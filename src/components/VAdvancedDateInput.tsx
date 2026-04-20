import {
  computed,
  defineComponent,
  mergeProps,
  nextTick,
  ref,
  toRef,
  useAttrs,
  watch,
} from 'vue'

import { VDialog, VMenu, VTextField } from 'vuetify/components'
import { useDate, useDisplay } from 'vuetify'

import { useAdvancedDateInput } from '@/composables/useAdvancedDateInput'
import { useDateInputAdvancedLocale } from '@/composables/useDateInputAdvancedLocale'
import { useAdvancedDateOverlay } from '@/composables/useAdvancedDateOverlay'
import type {
  AdvancedDateAdapter,
  AdvancedDateInputField,
  AdvancedDateInputClosePayload,
  AdvancedDateInputCloseReason,
  AdvancedDateInputCloseStrategy,
  AdvancedDateInputCommitFailureReason,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
  AdvancedDateInputSource,
  AdvancedDateModel,
  DateInputAdvancedLocaleMessages,
  NormalizedRange,
  PresetRange,
} from '@/types'
import {
  formatInputValue,
  isRangeDisabled,
  isStartDateDisabled,
  joinRangeInputValue,
  splitRangeInputValue,
} from '@/util/dates'
import { normalizeModel, orderRange, serializeModel } from '@/util/model'

import '@/styles/VAdvancedDateInput.sass'

import {
  advancedDateInputProps,
  buildAdvancedDatePickerBindings,
  type AdvancedDateMobilePresentation,
} from './advancedDateProps'
import { VAdvancedDateRangeField } from './VAdvancedDateRangeField'
import { VAdvancedDatePicker } from './VAdvancedDatePicker'

interface OverlayActivatorProps {
  [key: string]: unknown
}

interface PickerHandle {
  focusActiveDate?: () => void
}

interface DefaultFieldHandle {
  validate?: (silent?: boolean) => Promise<string[]>
  resetValidation?: () => Promise<void>
  errorMessages?: string[]
  isValid?: boolean | null
  isPristine?: boolean
  focusField?: (field: AdvancedDateInputField) => Promise<void> | void
}

interface DraftValidationResult {
  ok: boolean
  reason: AdvancedDateInputCommitFailureReason | null
  draft: AdvancedDateInputDraft<unknown>
  messages: string[]
}

type ForwardedEventHandler =
  | ((...args: unknown[]) => void)
  | Array<(...args: unknown[]) => void>

type InputErrorKey =
  keyof DateInputAdvancedLocaleMessages['dateInputAdvanced']['errors']

type OptimisticMenuAction = 'open' | 'close'

function callForwardedHandler(
  handler: ForwardedEventHandler | undefined,
  ...args: unknown[]
) {
  if (Array.isArray(handler)) {
    handler.forEach((entry) => entry(...args))
    return
  }

  handler?.(...args)
}

function cloneSelection<TDate>(
  selection: NormalizedRange<TDate>,
): NormalizedRange<TDate> {
  return {
    start: selection.start ?? null,
    end: selection.end ?? null,
  }
}

function isSameSelection<TDate>(
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
    (!!left.end && !!right.end && adapter.isSameDay(left.end, right.end))

  return sameStart && sameEnd
}

function isSelectionComplete<TDate>(
  selection: NormalizedRange<TDate>,
  range: boolean,
): boolean {
  if (!range) return !!selection.start
  return !!selection.start && !!selection.end
}

function cloneDraft<TDate>(
  draft: AdvancedDateInputDraft<TDate>,
): AdvancedDateInputDraft<TDate> {
  return {
    ...draft,
    selection: cloneSelection(draft.selection),
  }
}

export const VAdvancedDateInput = defineComponent({
  name: 'VAdvancedDateInput',
  inheritAttrs: false,

  props: advancedDateInputProps,

  emits: {
    'update:modelValue': (_value: AdvancedDateModel<unknown>) => true,
    'update:menu': (_value: boolean) => true,
    'update:month': (_value: number) => true,
    'update:year': (_value: number) => true,
    'update:text': (_value: string) => true,
    'update:activeField': (_value: AdvancedDateInputField) => true,
    'update:draft': (_value: AdvancedDateInputDraft<unknown>) => true,
    apply: (_value: AdvancedDateModel<unknown>) => true,
    cancel: () => true,
    presetSelect: (_preset: PresetRange<unknown>) => true,
    inputCommit: (_payload: AdvancedDateInputCommitPayload<unknown>) => true,
    inputInvalid: (_payload: AdvancedDateInputInvalidPayload<unknown>) => true,
    draftClose: (_payload: AdvancedDateInputClosePayload<unknown>) => true,
  },

  setup(props, { emit, expose, slots }) {
    const attrs = useAttrs()
    const adapter = useDate() as AdvancedDateAdapter<unknown>
    const display = useDisplay()
    const { tDateInputAdvanced } = useDateInputAdvancedLocale()
    const pickerRef = ref<PickerHandle | null>(null)
    const fieldRef = ref<DefaultFieldHandle | null>(null)
    const activeField = ref<AdvancedDateInputField>(
      props.activeField ?? 'start',
    )
    const mobilePresentation = computed<AdvancedDateMobilePresentation | null>(
      () => (display.mobile.value && !props.inline ? 'fullscreen' : 'inline'),
    )
    const fieldReadonly = computed(() => props.readonly || props.inputReadonly)
    const rangeTextEditable = computed(
      () =>
        !props.disabled &&
        !props.readonly &&
        (!(props.startFieldProps?.readonly ?? false) ||
          !(props.endFieldProps?.readonly ?? false)),
    )
    const textEditable = computed(() =>
      props.range
        ? rangeTextEditable.value
        : !props.disabled && !props.readonly && !props.inputReadonly,
    )
    const startPlaceholder = computed(() =>
      tDateInputAdvanced('fields.startDate'),
    )
    const endPlaceholder = computed(() => tDateInputAdvanced('fields.endDate'))

    const overlay = useAdvancedDateOverlay({
      menu: toRef(props, 'menu'),
      pickerRef,
      onMenuUpdate: (value) => emit('update:menu', value),
      onExternalCloseRequest: () =>
        requestOverlayClose('dismiss', { closeOverlay: false }),
    })

    const input = useAdvancedDateInput({
      adapter,
      modelValue: toRef(props, 'modelValue'),
      editable: textEditable,
      textValue: toRef(props, 'text'),
      range: toRef(props, 'range'),
      displayFormat: toRef(props, 'displayFormat'),
      rangeSeparator: toRef(props, 'rangeSeparator'),
      parseInput: toRef(props, 'parseInput'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
      onTextUpdate: (value) => emit('update:text', value),
    })

    const committedSelection = ref<NormalizedRange<unknown>>({
      start: null,
      end: null,
    })
    const pickerSelection = ref<NormalizedRange<unknown>>({
      start: null,
      end: null,
    })
    const controlledTextMode = ref<'mirror' | 'draft'>(
      props.text !== undefined &&
        textEditable.value &&
        props.text !== input.committedText.value
        ? 'draft'
        : 'mirror',
    )
    const draftSource = ref<AdvancedDateInputSource>(
      controlledTextMode.value === 'draft' ? 'text' : 'picker',
    )
    const hasUncontrolledTextDraft = ref(false)
    const pendingPickerCloseReason = ref<AdvancedDateInputCloseReason>('cancel')
    const pendingControlledTextEchoes = ref<string[]>([])
    const pickerBoundaryField = ref<AdvancedDateInputField | null>(null)

    function formatSelection(selection: NormalizedRange<unknown>) {
      return formatInputValue(adapter, selection, {
        range: props.range,
        displayFormat: props.displayFormat,
        separator: props.rangeSeparator,
      })
    }

    const committedDisplayText = computed(() =>
      formatSelection(committedSelection.value),
    )
    const rangeTextParts = computed(() =>
      splitRangeInputValue(input.text.value, props.rangeSeparator),
    )

    function resolveActiveFieldFromSelection(
      selection: NormalizedRange<unknown>,
    ): AdvancedDateInputField {
      if (!props.range) return 'start'
      if (selection.start && !selection.end) return 'end'

      return 'start'
    }

    function syncActiveField(nextField: AdvancedDateInputField) {
      if (activeField.value === nextField) return

      activeField.value = nextField
    }

    function syncPassiveActiveField(selection: NormalizedRange<unknown>) {
      syncActiveField(
        props.activeField ?? resolveActiveFieldFromSelection(selection),
      )
    }

    function setActiveField(nextField: AdvancedDateInputField) {
      if (activeField.value === nextField) return

      syncActiveField(nextField)
      emit('update:activeField', nextField)
    }

    async function focusRangeField(nextField: AdvancedDateInputField) {
      if (!props.range || props.inline || display.mobile.value) return

      setActiveField(nextField)
      await nextTick()
      await fieldRef.value?.focusField?.(nextField)
    }

    function createPickerDraft(
      selection = pickerSelection.value,
      text = input.text.value,
    ): AdvancedDateInputDraft<unknown> {
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
        !props.range || isSelectionComplete(normalizedSelection, true)
          ? 'complete'
          : 'partial'
      const unavailable = !props.range
        ? !!normalizedSelection.start &&
          isStartDateDisabled(adapter, normalizedSelection.start, constraints)
        : isRangeDisabled(adapter, normalizedSelection, constraints)
      const errorKey = unavailable
        ? props.range
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
    const fieldRules = computed(() =>
      input.inputError.value ? [] : props.rules,
    )

    watch(
      () => props.activeField,
      (value) => {
        if (!value) return

        syncActiveField(value)
        void focusRangeField(value)
      },
      { immediate: true },
    )

    function queueControlledTextEcho(value: string) {
      if (props.text === undefined || props.text === value) return
      if (pendingControlledTextEchoes.value.includes(value)) return

      pendingControlledTextEchoes.value.push(value)
    }

    function consumeControlledTextEcho(value: string) {
      const index = pendingControlledTextEchoes.value.indexOf(value)
      if (index === -1) return false

      pendingControlledTextEchoes.value.splice(index, 1)
      return true
    }

    function setPickerSelection(nextSelection: NormalizedRange<unknown>) {
      const normalizedSelection = cloneSelection(nextSelection)

      if (
        !isSameSelection(adapter, pickerSelection.value, normalizedSelection)
      ) {
        pickerSelection.value = normalizedSelection
      }
    }

    function syncInputText(value: string) {
      if (value === input.text.value) {
        if (props.text !== undefined && props.text !== value) {
          queueControlledTextEcho(value)
          emit('update:text', value)
        }
        return
      }

      queueControlledTextEcho(value)
      input.syncText(value)
    }

    function syncPickerSelectionFromText(value = input.text.value) {
      const assessed = input.assessText(value)
      setPickerSelection(assessed.selection)

      return assessed
    }

    function syncCommittedMirror(selection = committedSelection.value) {
      hasUncontrolledTextDraft.value = false
      controlledTextMode.value = 'mirror'
      pickerBoundaryField.value = null
      setPickerSelection(selection)
      draftSource.value = 'picker'
      syncPassiveActiveField(selection)
      syncInputText(formatSelection(selection))
    }

    async function resetFieldValidation() {
      await fieldRef.value?.resetValidation?.()
    }

    async function validateFieldRules() {
      return (await fieldRef.value?.validate?.()) ?? []
    }

    async function resetComponentValidation() {
      input.resetValidation()
      await resetFieldValidation()
    }

    function fieldErrorMessages() {
      if (!fieldRef.value) return [...mergedErrorMessages.value]
      if (fieldRef.value.isPristine) return [...mergedErrorMessages.value]

      const fieldErrors = fieldRef.value.errorMessages ?? []
      if (fieldErrors.length) return [...fieldErrors]

      return [...mergedErrorMessages.value]
    }

    function publicIsValid() {
      if (input.isPristine.value) return null

      if (input.isValid.value === false) return false

      const fieldIsValid = fieldRef.value?.isValid
      if (fieldIsValid === false) return false

      return true
    }

    watch(
      [
        () => props.modelValue,
        () => props.range,
        () => props.text,
        textEditable,
      ],
      ([value, range, text, editable], previous) => {
        const next = normalizeModel(adapter, value, range)
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
          syncPickerSelectionFromText(input.text.value)
        } else if (isControlledTextEcho) {
          controlledTextMode.value = 'mirror'
          draftSource.value = 'picker'
        } else if (text !== undefined) {
          if (textChanged) {
            input.setExternalText(text)
            controlledTextMode.value =
              text === nextCommittedText ? 'mirror' : 'draft'
          }

          if (controlledTextMode.value === 'draft') {
            draftSource.value = 'text'
            syncPickerSelectionFromText(input.text.value)
          } else {
            syncCommittedMirror(next)
          }
        } else {
          syncCommittedMirror(next)
        }

        input.resetValidation()
        void resetFieldValidation()
      },
      { immediate: true },
    )

    watch(
      [
        () => props.parseInput,
        () => props.rangeSeparator,
        () => props.min,
        () => props.max,
        () => props.allowedDates,
        () => props.allowedStartDates,
        () => props.allowedEndDates,
      ],
      () => {
        if (draftSource.value !== 'text') return

        syncPickerSelectionFromText(input.text.value)
      },
    )

    watch(
      pickerText,
      (value) => {
        if (draftSource.value !== 'picker') return
        if (value === input.text.value) return

        syncInputText(value)
      },
      { immediate: true },
    )

    const draft = computed<AdvancedDateInputDraft<unknown>>(() => {
      const base =
        draftSource.value === 'text'
          ? input.textDraft.value
          : createPickerDraft()

      return {
        text: input.text.value,
        selection: cloneSelection(base.selection),
        source: draftSource.value,
        isDirty: input.text.value !== committedDisplayText.value,
        parseStatus: base.parseStatus,
        availabilityStatus: base.availabilityStatus,
        validationStatus: base.validationStatus,
        errorKey: base.errorKey,
      }
    })

    watch(
      draft,
      (value) => {
        emit('update:draft', cloneDraft(value))
      },
      { immediate: true },
    )

    const mergedErrorMessages = computed(() => {
      const base = Array.isArray(props.errorMessages)
        ? props.errorMessages
        : props.errorMessages
          ? [props.errorMessages]
          : []

      return [...base, ...input.errorMessages.value]
    })

    const pickerBindings = computed(() =>
      buildAdvancedDatePickerBindings(props, mobilePresentation.value),
    )

    function resolveFailureReason(
      currentDraft: AdvancedDateInputDraft<unknown>,
    ): AdvancedDateInputCommitFailureReason | null {
      if (currentDraft.parseStatus === 'empty') return null
      if (currentDraft.availabilityStatus === 'unavailable') {
        return 'unavailable'
      }
      if (currentDraft.parseStatus === 'partial') return 'incomplete'
      if (currentDraft.parseStatus === 'invalid') return 'invalid'
      if (!isSelectionComplete(currentDraft.selection, props.range)) {
        return 'incomplete'
      }

      return null
    }

    function resolveValidationErrorKey(
      currentDraft: AdvancedDateInputDraft<unknown>,
      reason: AdvancedDateInputCommitFailureReason,
    ): InputErrorKey {
      if (reason === 'unavailable') {
        return props.range ? 'unavailableRange' : 'unavailableDate'
      }

      if (reason === 'incomplete') {
        return props.range ? 'invalidRange' : 'invalidDate'
      }

      return (
        currentDraft.errorKey ?? (props.range ? 'invalidRange' : 'invalidDate')
      )
    }

    function createValidationResult(
      currentDraft: AdvancedDateInputDraft<unknown>,
      reason: AdvancedDateInputCommitFailureReason | null,
      messages: string[] = [],
    ): DraftValidationResult {
      return {
        ok: !reason,
        reason,
        draft: currentDraft,
        messages,
      }
    }

    function serializeSelection(
      selection: NormalizedRange<unknown>,
    ): AdvancedDateModel<unknown> {
      return serializeModel(selection, {
        range: props.range,
        returnObject: props.returnObject,
      })
    }

    function finalizeCommittedSelection(selection: NormalizedRange<unknown>) {
      const normalizedSelection = cloneSelection(selection)
      const changed = !isSameSelection(
        adapter,
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

      setPickerSelection(normalizedSelection)
      draftSource.value = 'picker'
      syncPassiveActiveField(normalizedSelection)
      syncInputText(committedDraft.text)
      input.markValid()

      return {
        changed,
        value,
        draft: committedDraft,
      }
    }

    function commitSelection(selection: NormalizedRange<unknown>) {
      const result = finalizeCommittedSelection(selection)
      if (!result.changed) return result

      emit('update:modelValue', result.value)
      emit('inputCommit', {
        value: result.value,
        draft: cloneDraft(result.draft),
      })

      return result
    }

    function resolveDraftCommitPreflight(
      currentDraft = cloneDraft(draft.value),
      options: { resetFieldValidation?: boolean } = {},
    ): DraftValidationResult {
      const failureReason = resolveFailureReason(currentDraft)
      if (failureReason) {
        input.setValidationError(
          resolveValidationErrorKey(currentDraft, failureReason),
        )
        if (options.resetFieldValidation ?? true) {
          void resetFieldValidation()
        }

        return createValidationResult(
          currentDraft,
          failureReason,
          input.errorMessages.value.length
            ? [...input.errorMessages.value]
            : fieldErrorMessages(),
        )
      }

      return createValidationResult(currentDraft, null)
    }

    async function finalizeDraftValidation(
      currentDraft: AdvancedDateInputDraft<unknown>,
    ): Promise<DraftValidationResult> {
      input.markValid()

      const ruleMessages = await validateFieldRules()
      if (ruleMessages.length) {
        return createValidationResult(
          currentDraft,
          'rule',
          fieldErrorMessages(),
        )
      }

      return createValidationResult(currentDraft, null)
    }

    async function resolveDraftValidation(
      currentDraft = cloneDraft(draft.value),
    ): Promise<DraftValidationResult> {
      const preflight = resolveDraftCommitPreflight(currentDraft, {
        resetFieldValidation: false,
      })

      if (!preflight.ok) {
        await resetFieldValidation()
        return preflight
      }

      return await finalizeDraftValidation(currentDraft)
    }

    function handleValidationFailure(
      result: DraftValidationResult,
      emitInvalid = true,
    ): false {
      if (emitInvalid && result.reason) {
        emit('inputInvalid', {
          reason: result.reason,
          draft: result.draft,
        })
      }

      return false
    }

    function rollbackOptimisticMenu(
      action: OptimisticMenuAction,
      menuWasOpen: boolean,
    ) {
      if (action === 'open') {
        if (!menuWasOpen && overlay.menu.value) {
          closeOverlay()
        }
        return
      }

      if (menuWasOpen && !overlay.menu.value) {
        overlay.openMenu()
      }
    }

    function runOptimisticMenuCommit(
      action: OptimisticMenuAction,
      currentDraft: AdvancedDateInputDraft<unknown>,
      options: { onSuccess?: () => void } = {},
    ) {
      const menuWasOpen = overlay.menu.value

      if (action === 'open') {
        overlay.openMenu()
      } else {
        closeOverlay()
      }

      // Keep overlay timing synchronous while async field rules finish.
      void (async () => {
        const result = await finalizeDraftValidation(currentDraft)

        if (!result.ok) {
          handleValidationFailure(result)

          if (result.reason === 'rule') {
            rollbackOptimisticMenu(action, menuWasOpen)
          }
          return
        }

        commitSelection(result.draft.selection)
        options.onSuccess?.()
      })()
    }

    async function validateCurrentDraft(
      currentDraft = cloneDraft(draft.value),
    ): Promise<string[]> {
      const result = await resolveDraftValidation(currentDraft)

      return result.messages
    }

    async function commitInput(emitInvalid = true): Promise<boolean> {
      const result = await resolveDraftValidation()

      if (!result.ok) {
        return handleValidationFailure(result, emitInvalid)
      }

      commitSelection(result.draft.selection)
      return true
    }

    function revertDraft() {
      syncCommittedMirror(committedSelection.value)
      input.resetValidation()
      void resetFieldValidation()
    }

    function closeOverlay() {
      pickerBoundaryField.value = null
      if (!props.inline) overlay.closeMenu()
    }

    function emitDraftClose(
      reason: AdvancedDateInputCloseReason,
      strategy: AdvancedDateInputCloseStrategy,
      outcome: 'closed' | 'blocked',
      currentDraft: AdvancedDateInputDraft<unknown>,
    ) {
      emit('draftClose', {
        reason,
        strategy,
        outcome,
        draft: currentDraft,
      })
    }

    function shouldEmitCancelOnClose(reason: AdvancedDateInputCloseReason) {
      return reason === 'cancel' || reason === 'escape'
    }

    async function requestOverlayClose(
      reason: AdvancedDateInputCloseReason,
      options: { closeOverlay?: boolean } = {},
    ) {
      const strategy = props.closeDraftStrategy
      const currentDraft = cloneDraft(draft.value)
      const shouldCloseOverlay = options.closeOverlay ?? true

      if (strategy === 'revert') {
        revertDraft()
        emitDraftClose(reason, strategy, 'closed', currentDraft)
        if (shouldEmitCancelOnClose(reason)) emit('cancel')
        if (shouldCloseOverlay) closeOverlay()
        return true
      }

      if (strategy === 'preserve') {
        await resetComponentValidation()
        emitDraftClose(reason, strategy, 'closed', currentDraft)
        if (shouldEmitCancelOnClose(reason)) emit('cancel')
        if (shouldCloseOverlay) closeOverlay()
        return true
      }

      if (!(await commitInput(true))) {
        emitDraftClose(reason, strategy, 'blocked', currentDraft)
        return false
      }

      emitDraftClose(reason, strategy, 'closed', currentDraft)
      if (shouldCloseOverlay) closeOverlay()
      return true
    }

    function cancelOverlayDraft() {
      const currentDraft = cloneDraft(draft.value)

      revertDraft()
      emitDraftClose('cancel', 'revert', 'closed', currentDraft)
      emit('cancel')
      closeOverlay()
    }

    function updateFieldText(value: string) {
      hasUncontrolledTextDraft.value = props.text === undefined
      if (props.text !== undefined) {
        controlledTextMode.value = 'draft'
      }
      pickerBoundaryField.value = null
      draftSource.value = 'text'
      input.setText(value)
      syncPickerSelectionFromText(value)
    }

    function handleFieldTextUpdate(value: string) {
      updateFieldText(value)
    }

    function handleRangeFieldTextUpdate(
      field: AdvancedDateInputField,
      value: string,
    ) {
      setActiveField(field)

      const currentRangeTextParts = rangeTextParts.value

      const nextText = splitRangeInputValue(value, props.rangeSeparator)
        .hasSeparator
        ? value
        : joinRangeInputValue(
            {
              start:
                field === 'start' ? value : currentRangeTextParts.start,
              end: field === 'end' ? value : currentRangeTextParts.end,
            },
            props.rangeSeparator,
          )

      updateFieldText(nextText)
    }

    async function handleFieldBlur() {
      input.onBlur()
      if (!textEditable.value) return
      if (draftSource.value !== 'text') return

      await validateCurrentDraft()
    }

    function handleRangeFieldFocus(event: FocusEvent) {
      input.onFocus()

      const { onFocus: userOnFocus } = attrs as Record<string, unknown>

      callForwardedHandler(
        userOnFocus as ForwardedEventHandler | undefined,
        event,
      )
    }

    async function handleRangeFieldBlur(event: FocusEvent) {
      const { onBlur: userOnBlur } = attrs as Record<string, unknown>

      await handleFieldBlur()
      callForwardedHandler(
        userOnBlur as ForwardedEventHandler | undefined,
        event,
      )
    }

    async function handleFieldClear() {
      commitSelection({ start: null, end: null })
      closeOverlay()
    }

    function createDateConstraints() {
      return {
        min: props.min,
        max: props.max,
        allowedDates: props.allowedDates,
        allowedStartDates: props.allowedStartDates,
        allowedEndDates: props.allowedEndDates,
      }
    }

    function resolvePickerSelectionFromActiveField(
      rawSelection: NormalizedRange<unknown>,
    ) {
      if (!props.range) {
        return { selection: rawSelection, replacementField: null }
      }
      if (!rawSelection.start || rawSelection.end) {
        return { selection: rawSelection, replacementField: null }
      }

      const currentSelection = pickerSelection.value
      if (!currentSelection.start || !currentSelection.end) {
        return { selection: rawSelection, replacementField: null }
      }

      const defaultField = resolveActiveFieldFromSelection(currentSelection)
      const replacementField =
        pickerBoundaryField.value ??
        (props.activeField !== undefined || activeField.value !== defaultField
          ? activeField.value
          : null)

      if (!replacementField) {
        return { selection: rawSelection, replacementField: null }
      }

      return {
        selection: orderRange(adapter, {
          start:
            replacementField === 'start'
              ? rawSelection.start
              : currentSelection.start,
          end:
            replacementField === 'end'
              ? rawSelection.start
              : currentSelection.end,
        }),
        replacementField,
      }
    }

    function handlePickerDraftChange(value: NormalizedRange<unknown>) {
      const resolvedSelection = resolvePickerSelectionFromActiveField(value)
      const nextSelection = cloneSelection(resolvedSelection.selection)

      if (isSameSelection(adapter, pickerSelection.value, nextSelection)) {
        return
      }

      const constraints = createDateConstraints()

      if (
        resolvedSelection.replacementField &&
        isSelectionComplete(nextSelection, props.range) &&
        isRangeDisabled(adapter, nextSelection, constraints)
      ) {
        return
      }

      if (
        props.autoApply &&
        resolvedSelection.replacementField === 'end' &&
        isSelectionComplete(nextSelection, props.range) &&
        !isRangeDisabled(adapter, nextSelection, constraints)
      ) {
        commitSelection(nextSelection)
        closeOverlay()
        return
      }

      hasUncontrolledTextDraft.value = false
      controlledTextMode.value = 'mirror'
      setPickerSelection(nextSelection)
      draftSource.value = 'picker'
      setActiveField(resolveActiveFieldFromSelection(nextSelection))
      input.resetValidation()
      void resetFieldValidation()

      if (props.range && nextSelection.start && !nextSelection.end) {
        void focusRangeField('end')
      }
    }

    function handlePickerEscape() {
      pendingPickerCloseReason.value = 'escape'
    }

    function handlePickerModelValue(value: AdvancedDateModel<unknown>) {
      if (!props.autoApply) return

      const selection = normalizeModel(adapter, value, props.range)
      if (!isSelectionComplete(selection, props.range)) return

      commitSelection(selection)

      if (!props.inline) {
        closeOverlay()
      }
    }

    async function handlePickerApply() {
      const preflight = resolveDraftCommitPreflight()
      if (!preflight.ok) {
        handleValidationFailure(preflight)
        return
      }

      if (!props.inline) {
        runOptimisticMenuCommit('close', preflight.draft, {
          onSuccess: () =>
            emit('apply', serializeSelection(committedSelection.value)),
        })
        return
      }

      const result = await finalizeDraftValidation(preflight.draft)
      if (!result.ok) {
        handleValidationFailure(result)
        return
      }

      commitSelection(result.draft.selection)
      emit('apply', serializeSelection(committedSelection.value))
    }

    function handlePickerCancel() {
      const reason = props.inline ? 'cancel' : pendingPickerCloseReason.value

      pendingPickerCloseReason.value = 'cancel'

      if (props.inline) {
        revertDraft()
        emit('cancel')
        return
      }

      if (reason === 'cancel') {
        cancelOverlayDraft()
        return
      }

      void requestOverlayClose(reason)
    }

    function handleOverlayModelUpdate(value: boolean) {
      if (value) {
        overlay.openMenu()
        return
      }

      void requestOverlayClose('dismiss')
    }

    function isRangeFieldReadonly(field: AdvancedDateInputField) {
      if (props.disabled || props.readonly) return true

      const fieldProps =
        field === 'start' ? props.startFieldProps : props.endFieldProps

      return !!fieldProps?.readonly
    }

    function handleKeydown(
      event: KeyboardEvent,
      options: {
        readonly?: boolean
        field?: AdvancedDateInputField
      } = {},
    ) {
      const inputReadonly = options.readonly ?? !textEditable.value

      if (event.key === 'Enter') {
        if (inputReadonly) {
          pickerBoundaryField.value = options.field ?? null
          overlay.openMenu()
          return
        }

        const preflight = resolveDraftCommitPreflight()
        if (!preflight.ok) {
          handleValidationFailure(preflight)
          return
        }

        pickerBoundaryField.value = options.field ?? null
        runOptimisticMenuCommit('open', preflight.draft)
      }

      if (event.key === 'Escape' && overlay.menu.value) {
        void requestOverlayClose('escape')
      }
    }

    function renderPicker(extraProps: Record<string, unknown> = {}) {
      return (
        <VAdvancedDatePicker
          ref={pickerRef}
          {...(extraProps as any)}
          {...pickerBindings.value}
          modelValue={serializeSelection(pickerSelection.value)}
          onDraftChange={handlePickerDraftChange}
          onEscapeKey={handlePickerEscape}
          onUpdate:modelValue={handlePickerModelValue}
          onUpdate:month={(value) => emit('update:month', value)}
          onUpdate:year={(value) => emit('update:year', value)}
          onApply={handlePickerApply}
          onCancel={handlePickerCancel}
          onPresetSelect={(preset) => emit('presetSelect', preset)}
          v-slots={slots}
        />
      )
    }

    function renderField(activatorProps: OverlayActivatorProps = {}) {
      const hasActivatorProps = Object.keys(activatorProps).length > 0
      const {
        onFocus: userOnFocus,
        onBlur: userOnBlur,
        onKeydown: userOnKeydown,
        ['onClick:control']: userOnClickControl,
        ['onClick:appendInner']: userOnClickAppendInner,
        ['onClick:clear']: userOnClickClear,
        ...fieldAttrs
      } = attrs as Record<string, unknown>

      if (slots.activator) {
        return slots.activator({
          props: {
            ...activatorProps,
            onClick: () => overlay.openMenu(),
          },
          isOpen: overlay.menu.value,
        })
      }

      if (props.range) {
        const rootAttrs = mergeProps(activatorProps, fieldAttrs, {
          class: 'v-advanced-date-input',
          'aria-expanded': overlay.menu.value,
        })

        return (
          <VAdvancedDateRangeField
            ref={(instance) => {
              fieldRef.value = instance as DefaultFieldHandle | null
            }}
            rootAttrs={rootAttrs as Record<string, unknown>}
            modelValue={input.text.value}
            startValue={rangeTextParts.value.start}
            endValue={rangeTextParts.value.end}
            activeField={activeField.value}
            startPlaceholder={startPlaceholder.value}
            endPlaceholder={endPlaceholder.value}
            label={props.label}
            variant={props.variant}
            hideDetails={props.hideDetails}
            messages={props.messages}
            error={props.error || input.isValid.value === false}
            errorMessages={mergedErrorMessages.value}
            rules={fieldRules.value}
            clearable={props.clearable}
            density={props.density}
            disabled={props.disabled}
            readonly={props.readonly}
            startFieldProps={props.startFieldProps}
            endFieldProps={props.endFieldProps}
            onUpdate:startValue={(value) =>
              handleRangeFieldTextUpdate('start', value)
            }
            onUpdate:endValue={(value) =>
              handleRangeFieldTextUpdate('end', value)
            }
            onUpdate:activeField={(value) => {
              setActiveField(value)
            }}
            onFocus={(event: FocusEvent) => {
              handleRangeFieldFocus(event)
            }}
            onBlur={(event: FocusEvent) => {
              void handleRangeFieldBlur(event)
            }}
            onKeydown={({
              event,
              field,
            }: {
              event: KeyboardEvent
              field: AdvancedDateInputField
            }) => {
              setActiveField(field)
              handleKeydown(event, {
                field,
                readonly: isRangeFieldReadonly(field),
              })
              callForwardedHandler(
                userOnKeydown as ForwardedEventHandler | undefined,
                event,
              )
            }}
            onClick:control={({
              event,
              field,
            }: {
              event: MouseEvent
              field: AdvancedDateInputField
            }) => {
              pickerBoundaryField.value = field

              if (!hasActivatorProps) overlay.openMenu()
              callForwardedHandler(
                userOnClickControl as ForwardedEventHandler | undefined,
                event,
              )
            }}
            onClick:appendInner={({
              event,
              field,
            }: {
              event: MouseEvent
              field: AdvancedDateInputField
            }) => {
              setActiveField(field)
              pickerBoundaryField.value = field

              if (!hasActivatorProps) overlay.openMenu()

              callForwardedHandler(
                userOnClickAppendInner as ForwardedEventHandler | undefined,
                event,
              )
            }}
            onClick:clear={(event: MouseEvent) => {
              void handleFieldClear()
              callForwardedHandler(
                userOnClickClear as ForwardedEventHandler | undefined,
                event,
              )
            }}
          />
        )
      }

      const fieldProps = mergeProps(activatorProps, fieldAttrs, {
        class: 'v-advanced-date-input',
        modelValue: input.text.value,
        'onUpdate:modelValue': handleFieldTextUpdate,
        label: props.label,
        placeholder: props.placeholder,
        autocomplete: 'off',
        variant: props.variant,
        hideDetails: props.hideDetails,
        messages: props.messages,
        error: props.error || input.isValid.value === false,
        errorMessages: mergedErrorMessages.value,
        rules: fieldRules.value,
        clearable: props.clearable,
        focused: props.focused,
        'aria-expanded': overlay.menu.value,
        disabled: props.disabled,
        readonly: fieldReadonly.value,
        prependInnerIcon: props.prependInnerIcon,
        appendInnerIcon: props.appendInnerIcon,
        density: props.density,
        onFocus: (event: FocusEvent) => {
          input.onFocus()
          callForwardedHandler(
            userOnFocus as ForwardedEventHandler | undefined,
            event,
          )
        },
        onBlur: (event: FocusEvent) => {
          handleFieldBlur()
          callForwardedHandler(
            userOnBlur as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onUpdate:focused': (focused: boolean) => {
          if (focused) {
            input.onFocus()
            return
          }

          input.onBlur()
        },
        onKeydown: (event: KeyboardEvent) => {
          handleKeydown(event)
          callForwardedHandler(
            userOnKeydown as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:control': (event: MouseEvent) => {
          if (!hasActivatorProps) overlay.openMenu()
          callForwardedHandler(
            userOnClickControl as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:appendInner': (event: MouseEvent) => {
          if (!hasActivatorProps) overlay.openMenu()
          callForwardedHandler(
            userOnClickAppendInner as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:clear': (event: MouseEvent) => {
          handleFieldClear()
          callForwardedHandler(
            userOnClickClear as ForwardedEventHandler | undefined,
            event,
          )
        },
      })

      return (
        <VTextField
          ref={(instance) => {
            fieldRef.value = instance as DefaultFieldHandle | null
          }}
          {...(fieldProps as any)}
        />
      )
    }

    const publicHandle: AdvancedDateInputPublicInstance<unknown> = {
      commitInput: () => commitInput(true),
      validate: () => validateCurrentDraft(),
      resetValidation: async () => {
        await resetComponentValidation()
      },
      revertDraft,
      get text() {
        return input.text.value
      },
      get draft() {
        return cloneDraft(draft.value)
      },
      get isDirty() {
        return input.text.value !== committedDisplayText.value
      },
      get isPristine() {
        return input.isPristine.value
      },
      get isValid() {
        return publicIsValid()
      },
      get errorMessages() {
        return fieldErrorMessages()
      },
    }

    expose(publicHandle)

    return () => {
      if (props.inline) return renderPicker(attrs as Record<string, unknown>)

      if (display.mobile.value) {
        return (
          <div class="v-advanced-date-input-shell">
            {renderField()}
            <VDialog
              modelValue={overlay.menu.value}
              onUpdate:modelValue={handleOverlayModelUpdate}
              fullscreen
            >
              {renderPicker()}
            </VDialog>
          </div>
        )
      }

      return (
        <VMenu
          modelValue={overlay.menu.value}
          onUpdate:modelValue={handleOverlayModelUpdate}
          closeOnContentClick={false}
          offset={8}
          minWidth={props.minWidth ?? 0}
        >
          {{
            activator: ({
              props: activatorProps,
            }: {
              props: OverlayActivatorProps
            }) => renderField(activatorProps),
            default: () => renderPicker(),
          }}
        </VMenu>
      )
    }
  },
})
