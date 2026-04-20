import { ref } from 'vue'

import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
} from '@/types'

const inputRef = ref<AdvancedDateInputPublicInstance<Date> | null>(null)
const draftRef = ref<AdvancedDateInputDraft<Date> | null>(null)

async function assertPublicHandleTypes() {
  const committed = await inputRef.value?.commitInput()
  const validationMessages = await inputRef.value?.validate()

  await inputRef.value?.resetValidation()
  inputRef.value?.revertDraft()

  const text = inputRef.value?.text
  const draft = inputRef.value?.draft
  const isDirty = inputRef.value?.isDirty
  const isPristine = inputRef.value?.isPristine
  const isValid = inputRef.value?.isValid
  const errorMessages = inputRef.value?.errorMessages

  const parseStatus = draftRef.value?.parseStatus
  const availabilityStatus = draftRef.value?.availabilityStatus
  const validationStatus = draftRef.value?.validationStatus
  const source = draftRef.value?.source
  const selectionStart = draftRef.value?.selection.start
  const selectionEnd = draftRef.value?.selection.end

  const commitPayload: AdvancedDateInputCommitPayload<Date> | null = draft
    ? {
        value: [draft.selection.start, draft.selection.end],
        draft,
      }
    : null

  const invalidPayload: AdvancedDateInputInvalidPayload<Date> | null = draft
    ? {
        reason: 'rule',
        draft,
      }
    : null

  const closePayload: AdvancedDateInputClosePayload<Date> | null = draft
    ? {
        reason: 'dismiss',
        strategy: 'preserve',
        outcome: 'blocked',
        draft,
      }
    : null

  return {
    committed,
    validationMessages,
    text,
    draft,
    isDirty,
    isPristine,
    isValid,
    errorMessages,
    parseStatus,
    availabilityStatus,
    validationStatus,
    source,
    selectionStart,
    selectionEnd,
    commitPayload,
    invalidPayload,
    closePayload,
  }
}

void assertPublicHandleTypes()
