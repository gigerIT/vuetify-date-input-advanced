import type { Ref } from 'vue'

import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputCloseReason,
  AdvancedDateInputCloseStrategy,
  AdvancedDateInputCommitFailureReason,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateModel,
  DateInputAdvancedLocaleMessages,
  NormalizedRange,
} from '@/types'

import {
  cloneDraft,
  isSelectionComplete,
} from '@/composables/useAdvancedDateInputDraft'

type InputErrorKey =
  keyof DateInputAdvancedLocaleMessages['dateInputAdvanced']['errors']

type OptimisticMenuAction = 'open' | 'close'

interface DraftValidationResult<TDate> {
  ok: boolean
  reason: AdvancedDateInputCommitFailureReason | null
  draft: AdvancedDateInputDraft<TDate>
  messages: string[]
}

interface AdvancedDateInputValidationController {
  errorMessages: Readonly<Ref<string[]>>
  markValid: () => void
  resetValidation: () => void
  setValidationError: (key: InputErrorKey | null) => void
}

interface AdvancedDateInputCommitResult<TDate> {
  changed: boolean
  value: AdvancedDateModel<TDate>
  draft: AdvancedDateInputDraft<TDate>
}

export function useAdvancedDateInputCommitFlow<TDate>(options: {
  closeDraftStrategy: Ref<AdvancedDateInputCloseStrategy>
  draft: Readonly<Ref<AdvancedDateInputDraft<TDate>>>
  input: AdvancedDateInputValidationController
  inline: Ref<boolean>
  overlayMenu: Readonly<Ref<boolean>>
  range: Ref<boolean>
  validateFieldRules: () => Promise<string[]>
  resetFieldValidation: () => Promise<void>
  getFieldErrorMessages: () => string[]
  commitSelection: (
    selection: NormalizedRange<TDate>,
  ) => AdvancedDateInputCommitResult<TDate>
  revertDraft: () => void
  openOverlay: () => void
  closeOverlay: () => void
  onInputInvalid: (payload: AdvancedDateInputInvalidPayload<TDate>) => void
  onDraftClose: (payload: AdvancedDateInputClosePayload<TDate>) => void
  onCancel: () => void
}) {
  function resolveFailureReason(
    currentDraft: AdvancedDateInputDraft<TDate>,
  ): AdvancedDateInputCommitFailureReason | null {
    if (currentDraft.parseStatus === 'empty') return null
    if (currentDraft.availabilityStatus === 'unavailable') {
      return 'unavailable'
    }
    if (currentDraft.parseStatus === 'partial') return 'incomplete'
    if (currentDraft.parseStatus === 'invalid') return 'invalid'
    if (!isSelectionComplete(currentDraft.selection, options.range.value)) {
      return 'incomplete'
    }

    return null
  }

  function resolveValidationErrorKey(
    currentDraft: AdvancedDateInputDraft<TDate>,
    reason: AdvancedDateInputCommitFailureReason,
  ): InputErrorKey {
    if (reason === 'unavailable') {
      return options.range.value ? 'unavailableRange' : 'unavailableDate'
    }

    if (reason === 'incomplete') {
      return options.range.value ? 'invalidRange' : 'invalidDate'
    }

    return (
      currentDraft.errorKey ??
      (options.range.value ? 'invalidRange' : 'invalidDate')
    )
  }

  function createValidationResult(
    currentDraft: AdvancedDateInputDraft<TDate>,
    reason: AdvancedDateInputCommitFailureReason | null,
    messages: string[] = [],
  ): DraftValidationResult<TDate> {
    return {
      ok: !reason,
      reason,
      draft: currentDraft,
      messages,
    }
  }

  async function resetComponentValidation() {
    options.input.resetValidation()
    await options.resetFieldValidation()
  }

  function resolveDraftCommitPreflight(
    currentDraft = cloneDraft(options.draft.value),
    config: { resetFieldValidation?: boolean } = {},
  ): DraftValidationResult<TDate> {
    const failureReason = resolveFailureReason(currentDraft)

    if (!failureReason) {
      return createValidationResult(currentDraft, null)
    }

    options.input.setValidationError(
      resolveValidationErrorKey(currentDraft, failureReason),
    )

    if (config.resetFieldValidation ?? true) {
      void options.resetFieldValidation()
    }

    return createValidationResult(
      currentDraft,
      failureReason,
      options.input.errorMessages.value.length
        ? [...options.input.errorMessages.value]
        : options.getFieldErrorMessages(),
    )
  }

  async function finalizeDraftValidation(
    currentDraft: AdvancedDateInputDraft<TDate>,
  ): Promise<DraftValidationResult<TDate>> {
    options.input.markValid()

    const ruleMessages = await options.validateFieldRules()
    if (ruleMessages.length) {
      return createValidationResult(
        currentDraft,
        'rule',
        options.getFieldErrorMessages(),
      )
    }

    return createValidationResult(currentDraft, null)
  }

  async function resolveDraftValidation(
    currentDraft = cloneDraft(options.draft.value),
  ): Promise<DraftValidationResult<TDate>> {
    const preflight = resolveDraftCommitPreflight(currentDraft, {
      resetFieldValidation: false,
    })

    if (!preflight.ok) {
      await options.resetFieldValidation()
      return preflight
    }

    return await finalizeDraftValidation(currentDraft)
  }

  function handleValidationFailure(
    result: DraftValidationResult<TDate>,
    emitInvalid = true,
  ): false {
    if (emitInvalid && result.reason) {
      options.onInputInvalid({
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
      if (!menuWasOpen && options.overlayMenu.value) {
        options.closeOverlay()
      }
      return
    }

    if (menuWasOpen && !options.overlayMenu.value) {
      options.openOverlay()
    }
  }

  function runOptimisticMenuCommit(
    action: OptimisticMenuAction,
    currentDraft: AdvancedDateInputDraft<TDate>,
    config: { onSuccess?: (value: AdvancedDateModel<TDate>) => void } = {},
  ) {
    const menuWasOpen = options.overlayMenu.value

    if (action === 'open') {
      options.openOverlay()
    } else {
      options.closeOverlay()
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

      const committed = options.commitSelection(result.draft.selection)
      config.onSuccess?.(committed.value)
    })()
  }

  async function validateCurrentDraft(
    currentDraft = cloneDraft(options.draft.value),
  ): Promise<string[]> {
    const result = await resolveDraftValidation(currentDraft)

    return result.messages
  }

  async function commitInput(emitInvalid = true): Promise<boolean> {
    const result = await resolveDraftValidation()

    if (!result.ok) {
      return handleValidationFailure(result, emitInvalid)
    }

    options.commitSelection(result.draft.selection)
    return true
  }

  function emitDraftClose(
    reason: AdvancedDateInputCloseReason,
    strategy: AdvancedDateInputCloseStrategy,
    outcome: 'closed' | 'blocked',
    currentDraft: AdvancedDateInputDraft<TDate>,
  ) {
    options.onDraftClose({
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
    config: { closeOverlay?: boolean } = {},
  ) {
    const strategy = options.closeDraftStrategy.value
    const currentDraft = cloneDraft(options.draft.value)
    const shouldCloseOverlay = config.closeOverlay ?? true

    if (strategy === 'revert') {
      options.revertDraft()
      emitDraftClose(reason, strategy, 'closed', currentDraft)
      if (shouldEmitCancelOnClose(reason)) options.onCancel()
      if (shouldCloseOverlay) options.closeOverlay()
      return true
    }

    if (strategy === 'preserve') {
      await resetComponentValidation()
      emitDraftClose(reason, strategy, 'closed', currentDraft)
      if (shouldEmitCancelOnClose(reason)) options.onCancel()
      if (shouldCloseOverlay) options.closeOverlay()
      return true
    }

    if (!(await commitInput(true))) {
      emitDraftClose(reason, strategy, 'blocked', currentDraft)
      return false
    }

    emitDraftClose(reason, strategy, 'closed', currentDraft)
    if (shouldCloseOverlay) options.closeOverlay()
    return true
  }

  function cancelOverlayDraft() {
    const currentDraft = cloneDraft(options.draft.value)

    options.revertDraft()
    emitDraftClose('cancel', 'revert', 'closed', currentDraft)
    options.onCancel()
    options.closeOverlay()
  }

  async function handlePickerApply(config: {
    onApply?: (value: AdvancedDateModel<TDate>) => void
  } = {}) {
    const preflight = resolveDraftCommitPreflight()
    if (!preflight.ok) {
      handleValidationFailure(preflight)
      return
    }

    if (!options.inline.value) {
      runOptimisticMenuCommit('close', preflight.draft, {
        onSuccess: config.onApply,
      })
      return
    }

    const result = await finalizeDraftValidation(preflight.draft)
    if (!result.ok) {
      handleValidationFailure(result)
      return
    }

    const committed = options.commitSelection(result.draft.selection)
    config.onApply?.(committed.value)
  }

  return {
    resolveDraftCommitPreflight,
    validateCurrentDraft,
    commitInput,
    handleValidationFailure,
    requestOverlayClose,
    cancelOverlayDraft,
    runOptimisticMenuCommit,
    handlePickerApply,
  }
}
