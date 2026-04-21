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
import {
  cloneDraft,
  cloneSelection,
  isSameSelection,
  isSelectionComplete,
  useAdvancedDateInputDraft,
} from '@/composables/useAdvancedDateInputDraft'
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
  AdvancedDateModel,
  DateInputAdvancedLocaleMessages,
  NormalizedRange,
  PresetRange,
} from '@/types'
import {
  isRangeDisabled,
  joinRangeInputValue,
  splitRangeInputValue,
} from '@/util/dates'
import { normalizeModel, orderRange } from '@/util/model'

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
    const isMobileFullscreenActivator = computed(
      () => display.mobile.value && !props.inline,
    )
    const mobileActivatorOpening = ref(false)

    const overlay = useAdvancedDateOverlay({
      menu: toRef(props, 'menu'),
      pickerRef,
      onMenuUpdate: (value) => emit('update:menu', value),
      onExternalCloseRequest: () =>
        requestOverlayClose('dismiss', { closeOverlay: false }),
    })

    const mobileFullscreenActivatorReadonly = computed(
      () =>
        isMobileFullscreenActivator.value &&
        (overlay.menu.value || mobileActivatorOpening.value),
    )
    const fieldReadonly = computed(
      () =>
        props.readonly ||
        props.inputReadonly ||
        mobileFullscreenActivatorReadonly.value,
    )
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

    watch([overlay.menu, isMobileFullscreenActivator], ([menu, mobile]) => {
      if (menu && mobile) return

      mobileActivatorOpening.value = false
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

    const pendingPickerCloseReason = ref<AdvancedDateInputCloseReason>('cancel')

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

    watch(
      () => props.activeField,
      (value) => {
        if (!value) return

        syncActiveField(value)
        void focusRangeField(value)
      },
      { immediate: true },
    )

    const draftState = useAdvancedDateInputDraft<unknown>({
      adapter,
      input,
      modelValue: toRef(props, 'modelValue'),
      editable: textEditable,
      textValue: toRef(props, 'text'),
      range: toRef(props, 'range'),
      returnObject: toRef(props, 'returnObject'),
      displayFormat: toRef(props, 'displayFormat'),
      rangeSeparator: toRef(props, 'rangeSeparator'),
      parseInput: toRef(props, 'parseInput'),
      min: toRef(props, 'min'),
      max: toRef(props, 'max'),
      allowedDates: toRef(props, 'allowedDates'),
      allowedStartDates: toRef(props, 'allowedStartDates'),
      allowedEndDates: toRef(props, 'allowedEndDates'),
      onDraftUpdate: (value) => emit('update:draft', cloneDraft(value)),
      onTextUpdate: (value) => emit('update:text', value),
      onModelUpdate: (value) => emit('update:modelValue', value),
      onInputCommit: (payload) => emit('inputCommit', payload),
      onPassiveActiveFieldSync: syncPassiveActiveField,
      resetFieldValidation,
    })
    const {
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
    } = draftState
    const fieldRules = computed(() =>
      input.inputError.value ? [] : props.rules,
    )

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

      if (
        replacementField === 'start' &&
        adapter.isAfter(rawSelection.start, currentSelection.end)
      ) {
        return {
          selection: {
            start: rawSelection.start,
            end: null,
          },
          replacementField,
        }
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

    function resolveNextPickerActiveField(
      selection: NormalizedRange<unknown>,
      replacementField: AdvancedDateInputField | null,
    ): AdvancedDateInputField {
      if (
        props.range &&
        replacementField &&
        isSelectionComplete(selection, props.range)
      ) {
        return 'end'
      }

      return resolveActiveFieldFromSelection(selection)
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

      if (resolvedSelection.replacementField && pickerBoundaryField.value) {
        pickerBoundaryField.value = null
      }
      applyPickerDraft(nextSelection)
      setActiveField(
        resolveNextPickerActiveField(
          nextSelection,
          resolvedSelection.replacementField,
        ),
      )

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

    function handleMobileFullscreenActivatorPress(event: Event) {
      if (!isMobileFullscreenActivator.value) return

      event.preventDefault()
      mobileActivatorOpening.value = true
      overlay.openMenu()
    }

    function openOverlayFromActivator(hasActivatorProps: boolean) {
      if (hasActivatorProps) return
      if (
        isMobileFullscreenActivator.value &&
        mobileActivatorOpening.value &&
        overlay.menu.value
      ) {
        return
      }

      overlay.openMenu()
    }

    function isRangeFieldReadonly(field: AdvancedDateInputField) {
      if (
        props.disabled ||
        props.readonly ||
        mobileFullscreenActivatorReadonly.value
      ) {
        return true
      }

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
          selectionChangeOrigin={pickerSelectionChangeOrigin.value}
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
        ['onMousedown:control']: userOnMousedownControl,
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
            color={props.color}
            density={props.density}
            disabled={props.disabled}
            readonly={props.readonly || mobileFullscreenActivatorReadonly.value}
            suppressFocus={isMobileFullscreenActivator.value}
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
            onMousedown:control={({
              event,
              field,
            }: {
              event: MouseEvent
              field: AdvancedDateInputField
            }) => {
              setActiveField(field)
              pickerBoundaryField.value = field
              handleMobileFullscreenActivatorPress(event)
              callForwardedHandler(
                userOnMousedownControl as ForwardedEventHandler | undefined,
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

              openOverlayFromActivator(hasActivatorProps)
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

              openOverlayFromActivator(hasActivatorProps)

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
        color: props.color,
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
          handleKeydown(event, { readonly: fieldReadonly.value })
          callForwardedHandler(
            userOnKeydown as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onMousedown:control': (event: MouseEvent) => {
          handleMobileFullscreenActivatorPress(event)
          callForwardedHandler(
            userOnMousedownControl as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:control': (event: MouseEvent) => {
          openOverlayFromActivator(hasActivatorProps)
          callForwardedHandler(
            userOnClickControl as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:appendInner': (event: MouseEvent) => {
          openOverlayFromActivator(hasActivatorProps)
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
