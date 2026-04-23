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
import { useAdvancedDateInputCommitFlow } from '@/composables/useAdvancedDateInputCommitFlow'
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
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
  AdvancedDateModel,
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
  resolveAdvancedDateFieldVariant,
  resolveAdvancedDatePickerVariant,
  type AdvancedDatePickerDraftChangeContext,
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

type ForwardedEventHandler =
  | ((...args: unknown[]) => void)
  | Array<(...args: unknown[]) => void>

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
        commitFlow.requestOverlayClose('dismiss', { closeOverlay: false }),
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
    const fieldVariant = computed(() =>
      resolveAdvancedDateFieldVariant(props.variant),
    )
    const inlinePickerVariant = computed(() =>
      resolveAdvancedDatePickerVariant(props.variant),
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
    const pickerSelectionTargetField = computed<AdvancedDateInputField | null>(
      () => {
        if (!props.range || props.inline || display.mobile.value) return null

        return pickerBoundaryField.value ?? activeField.value
      },
    )
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

    function closeOverlay() {
      pickerBoundaryField.value = null
      if (!props.inline) overlay.closeMenu()
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
    const commitFlow = useAdvancedDateInputCommitFlow({
      closeDraftStrategy: toRef(props, 'closeDraftStrategy'),
      draft,
      input,
      inline: toRef(props, 'inline'),
      overlayMenu: overlay.menu,
      range: toRef(props, 'range'),
      validateFieldRules,
      resetFieldValidation,
      getFieldErrorMessages: fieldErrorMessages,
      commitSelection,
      revertDraft,
      openOverlay: overlay.openMenu,
      closeOverlay,
      onInputInvalid: (payload) => emit('inputInvalid', payload),
      onDraftClose: (payload) => emit('draftClose', payload),
      onCancel: () => emit('cancel'),
    })

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
              start: field === 'start' ? value : currentRangeTextParts.start,
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

      await commitFlow.validateCurrentDraft()
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
      context: AdvancedDatePickerDraftChangeContext,
    ): AdvancedDateInputField {
      if (
        context.origin === 'internal' &&
        props.range &&
        pickerSelectionTargetField.value === 'end' &&
        isSelectionComplete(selection, props.range)
      ) {
        return 'end'
      }

      if (
        props.range &&
        replacementField &&
        isSelectionComplete(selection, props.range)
      ) {
        return 'end'
      }

      return resolveActiveFieldFromSelection(selection)
    }

    function shouldFocusEndRangeField(
      selection: NormalizedRange<unknown>,
      replacementField: AdvancedDateInputField | null,
      context: AdvancedDatePickerDraftChangeContext,
    ) {
      return (
        context.origin === 'internal' &&
        props.range &&
        !!selection.start &&
        (!selection.end || replacementField === 'start')
      )
    }

    function handlePickerDraftChange(
      value: NormalizedRange<unknown>,
      context: AdvancedDatePickerDraftChangeContext,
    ) {
      const resolvedSelection = resolvePickerSelectionFromActiveField(value)
      const nextSelection = cloneSelection(resolvedSelection.selection)
      const focusEndRangeField = shouldFocusEndRangeField(
        nextSelection,
        resolvedSelection.replacementField,
        context,
      )

      if (isSameSelection(adapter, pickerSelection.value, nextSelection)) {
        if (focusEndRangeField) {
          void focusRangeField('end')
        }

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
          context,
        ),
      )

      if (focusEndRangeField) {
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

    function handlePickerApply() {
      void commitFlow.handlePickerApply({
        onApply: (value) => emit('apply', value),
      })
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
        commitFlow.cancelOverlayDraft()
        return
      }

      void commitFlow.requestOverlayClose(reason)
    }

    function openOverlayFromUserInteraction() {
      if (props.disabled) return false

      overlay.openMenu()

      return true
    }

    function handleOverlayModelUpdate(value: boolean) {
      if (value) {
        openOverlayFromUserInteraction()
        return
      }

      void commitFlow.requestOverlayClose('dismiss')
    }

    function handleMobileFullscreenActivatorPress(event: Event) {
      if (!isMobileFullscreenActivator.value || props.disabled) return

      event.preventDefault()
      mobileActivatorOpening.value = true
      openOverlayFromUserInteraction()
    }

    function openOverlayFromActivator() {
      if (
        isMobileFullscreenActivator.value &&
        mobileActivatorOpening.value &&
        overlay.menu.value
      ) {
        return false
      }

      return openOverlayFromUserInteraction()
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
          if (props.disabled) return

          pickerBoundaryField.value = options.field ?? null
          openOverlayFromUserInteraction()
          return
        }

        const preflight = commitFlow.resolveDraftCommitPreflight()
        if (!preflight.ok) {
          commitFlow.handleValidationFailure(preflight)
          return
        }

        pickerBoundaryField.value = options.field ?? null
        commitFlow.runOptimisticMenuCommit('open', preflight.draft)
      }

      if (event.key === 'Escape' && overlay.menu.value) {
        void commitFlow.requestOverlayClose('escape')
      }
    }

    function renderPicker(extraProps: Record<string, unknown> = {}) {
      const pickerVariant =
        props.inline && inlinePickerVariant.value
          ? { variant: inlinePickerVariant.value }
          : {}

      return (
        <VAdvancedDatePicker
          ref={pickerRef}
          {...(extraProps as any)}
          {...pickerVariant}
          {...pickerBindings.value}
          modelValue={serializeSelection(pickerSelection.value)}
          selectionChangeOrigin={pickerSelectionChangeOrigin.value}
          selectionTargetField={pickerSelectionTargetField.value}
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
            onClick: () => {
              openOverlayFromUserInteraction()
            },
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
            variant={fieldVariant.value}
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
              if (props.disabled) {
                callForwardedHandler(
                  userOnMousedownControl as ForwardedEventHandler | undefined,
                  event,
                )
                return
              }

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
              if (props.disabled) {
                callForwardedHandler(
                  userOnClickControl as ForwardedEventHandler | undefined,
                  event,
                )
                return
              }

              pickerBoundaryField.value = field

              openOverlayFromActivator()
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
              if (props.disabled) {
                callForwardedHandler(
                  userOnClickAppendInner as ForwardedEventHandler | undefined,
                  event,
                )
                return
              }

              setActiveField(field)
              pickerBoundaryField.value = field

              openOverlayFromActivator()

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
        variant: fieldVariant.value,
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
          openOverlayFromActivator()
          callForwardedHandler(
            userOnClickControl as ForwardedEventHandler | undefined,
            event,
          )
        },
        'onClick:appendInner': (event: MouseEvent) => {
          openOverlayFromActivator()
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
      commitInput: () => commitFlow.commitInput(true),
      validate: () => commitFlow.validateCurrentDraft(),
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
          openOnClick={false}
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
