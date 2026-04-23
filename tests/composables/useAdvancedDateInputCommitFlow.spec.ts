import { flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useAdvancedDateInputCommitFlow } from '@/composables/useAdvancedDateInputCommitFlow'
import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateModel,
  NormalizedRange,
} from '@/types'

function deferredValue<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return {
    promise,
    resolve,
  }
}

function createDraft(
  overrides: Partial<AdvancedDateInputDraft<Date>> = {},
): AdvancedDateInputDraft<Date> {
  return {
    text: '',
    selection: {
      start: null,
      end: null,
    },
    source: 'picker',
    isDirty: false,
    parseStatus: 'empty',
    availabilityStatus: 'unknown',
    validationStatus: 'idle',
    errorKey: null,
    ...overrides,
  }
}

function createHarness(
  overrides: {
    closeDraftStrategy?: 'revert' | 'preserve' | 'commit'
    draft?: AdvancedDateInputDraft<Date>
    inline?: boolean
    range?: boolean
    validateFieldRules?: () => Promise<string[]>
  } = {},
) {
  const closeDraftStrategy = ref(overrides.closeDraftStrategy ?? 'commit')
  const draft = ref(
    overrides.draft ??
      createDraft({
        text: 'Jan 12, 2026',
        selection: { start: new Date('2026-01-12T00:00:00.000Z'), end: null },
        parseStatus: 'complete',
        availabilityStatus: 'available',
        validationStatus: 'valid',
      }),
  )
  const inputErrorKey = ref<string | null>(null)
  const overlayMenu = ref(false)
  const openOverlay = vi.fn(() => {
    overlayMenu.value = true
  })
  const closeOverlay = vi.fn(() => {
    overlayMenu.value = false
  })
  const commitSelection = vi.fn(
    (
      selection: NormalizedRange<Date>,
    ): {
      changed: boolean
      value: AdvancedDateModel<Date>
      draft: AdvancedDateInputDraft<Date>
    } => ({
      changed: true,
      value: selection.start,
      draft: createDraft({
        text: selection.start?.toISOString() ?? '',
        selection,
        parseStatus: selection.start ? 'complete' : 'empty',
        availabilityStatus: 'available',
        validationStatus: selection.start ? 'valid' : 'idle',
      }),
    }),
  )
  const onInputInvalid = vi.fn<
    (payload: AdvancedDateInputInvalidPayload<Date>) => void
  >()
  const onDraftClose = vi.fn<
    (payload: AdvancedDateInputClosePayload<Date>) => void
  >()
  const onCancel = vi.fn()
  const validateFieldRules = vi.fn(
    overrides.validateFieldRules ?? (async () => []),
  )
  const resetFieldValidation = vi.fn(async () => {})
  const revertDraft = vi.fn()
  const input = {
    errorMessages: computed(() =>
      inputErrorKey.value ? [inputErrorKey.value] : [],
    ),
    markValid: vi.fn(() => {
      inputErrorKey.value = null
    }),
    resetValidation: vi.fn(() => {
      inputErrorKey.value = null
    }),
    setValidationError: vi.fn((key: string | null) => {
      inputErrorKey.value = key
    }),
  }

  const flow = useAdvancedDateInputCommitFlow({
    closeDraftStrategy,
    draft,
    input,
    inline: ref(overrides.inline ?? false),
    overlayMenu,
    range: ref(overrides.range ?? false),
    validateFieldRules,
    resetFieldValidation,
    getFieldErrorMessages: () =>
      inputErrorKey.value ? [inputErrorKey.value] : ['field-error'],
    commitSelection,
    revertDraft,
    openOverlay,
    closeOverlay,
    onInputInvalid,
    onDraftClose,
    onCancel,
  })

  return {
    flow,
    draft,
    input,
    openOverlay,
    closeOverlay,
    overlayMenu,
    commitSelection,
    onInputInvalid,
    onDraftClose,
    onCancel,
    resetFieldValidation,
    revertDraft,
  }
}

describe('useAdvancedDateInputCommitFlow', () => {
  it('rolls back an optimistic open when async field rules fail', async () => {
    const deferred = deferredValue<string[]>()
    const harness = createHarness({
      validateFieldRules: () => deferred.promise,
    })

    harness.flow.runOptimisticMenuCommit('open', harness.draft.value)

    expect(harness.overlayMenu.value).toBe(true)
    expect(harness.openOverlay).toHaveBeenCalledTimes(1)

    deferred.resolve(['Async required'])
    await flushPromises()

    expect(harness.closeOverlay).toHaveBeenCalledTimes(1)
    expect(harness.overlayMenu.value).toBe(false)
    expect(harness.commitSelection).not.toHaveBeenCalled()
    expect(harness.onInputInvalid).toHaveBeenCalledWith({
      reason: 'rule',
      draft: harness.draft.value,
    })
  })

  it('blocks closeDraftStrategy=commit when the draft is incomplete', async () => {
    const draft = createDraft({
      text: 'Jan 20, 2026',
      selection: { start: new Date('2026-01-20T00:00:00.000Z'), end: null },
      parseStatus: 'partial',
      availabilityStatus: 'available',
      validationStatus: 'invalid',
    })
    const harness = createHarness({
      closeDraftStrategy: 'commit',
      draft,
      range: true,
    })

    const didClose = await harness.flow.requestOverlayClose('dismiss')

    expect(didClose).toBe(false)
    expect(harness.input.setValidationError).toHaveBeenCalledWith('invalidRange')
    expect(harness.resetFieldValidation).toHaveBeenCalledTimes(1)
    expect(harness.closeOverlay).not.toHaveBeenCalled()
    expect(harness.commitSelection).not.toHaveBeenCalled()
    expect(harness.onInputInvalid).toHaveBeenCalledWith({
      reason: 'incomplete',
      draft,
    })
    expect(harness.onDraftClose).toHaveBeenCalledWith({
      reason: 'dismiss',
      strategy: 'commit',
      outcome: 'blocked',
      draft,
    })
  })

  it('reverts and emits cancel when escape closes a revert strategy overlay', async () => {
    const harness = createHarness({
      closeDraftStrategy: 'revert',
      draft: createDraft({
        text: 'Jan 20, 2026',
        selection: { start: new Date('2026-01-20T00:00:00.000Z'), end: null },
        parseStatus: 'complete',
        availabilityStatus: 'available',
        validationStatus: 'valid',
      }),
    })

    const didClose = await harness.flow.requestOverlayClose('escape')

    expect(didClose).toBe(true)
    expect(harness.revertDraft).toHaveBeenCalledTimes(1)
    expect(harness.closeOverlay).toHaveBeenCalledTimes(1)
    expect(harness.onCancel).toHaveBeenCalledTimes(1)
    expect(harness.onInputInvalid).not.toHaveBeenCalled()
    expect(harness.onDraftClose).toHaveBeenCalledWith({
      reason: 'escape',
      strategy: 'revert',
      outcome: 'closed',
      draft: harness.draft.value,
    })
  })

  it('emits the committed value when picker apply succeeds in overlay mode', async () => {
    const onApply = vi.fn<(value: AdvancedDateModel<Date>) => void>()
    const harness = createHarness()

    await harness.flow.handlePickerApply({ onApply })
    await flushPromises()

    expect(harness.closeOverlay).toHaveBeenCalledTimes(1)
    expect(harness.commitSelection).toHaveBeenCalledWith(
      harness.draft.value.selection,
    )
    expect(onApply).toHaveBeenCalledWith(harness.draft.value.selection.start)
  })
})
