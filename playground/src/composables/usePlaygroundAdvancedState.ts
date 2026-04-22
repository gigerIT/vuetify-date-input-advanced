import { computed, reactive, ref, watch } from 'vue'

import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputCloseStrategy,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputFieldProps,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
  AdvancedDateModel,
  AdvancedDateRangeTuple,
  PresetRange,
} from '@gigerit/vuetify-date-input-advanced'

import {
  countCalendarNights,
  createLocalDate,
  formatDemoDate,
  normalizeRangeModel,
  serializeDraft,
  serializePreviewModel,
  toLocalYmd,
} from '../playgroundDateUtils'

const closeStrategyOptions = [
  { title: 'Revert', value: 'revert' },
  { title: 'Preserve', value: 'preserve' },
  { title: 'Commit', value: 'commit' },
] satisfies { title: string; value: AdvancedDateInputCloseStrategy }[]

const flightStartFieldProps = {
  placeholder: 'Start date',
  name: 'flightStartDate',
  ariaLabel: 'Flight start date',
} satisfies AdvancedDateInputFieldProps

const flightEndFieldProps = {
  placeholder: 'End date',
  name: 'flightEndDate',
  ariaLabel: 'Flight end date',
} satisfies AdvancedDateInputFieldProps

const pasteStartFieldProps = {
  placeholder: 'Paste or type start',
} satisfies AdvancedDateInputFieldProps

const pasteEndFieldProps = {
  placeholder: 'Paste or type end',
} satisfies AdvancedDateInputFieldProps

// Range validation still flows through the shared input wrapper.
const formValidationStartFieldProps = {
  placeholder: 'Start date',
  name: 'travelStartDate',
  ariaLabel: 'Travel start date',
} satisfies AdvancedDateInputFieldProps

const formValidationEndFieldProps = {
  placeholder: 'End date',
  name: 'travelEndDate',
  ariaLabel: 'Travel end date',
} satisfies AdvancedDateInputFieldProps

type FormValidationField = 'paymentDate' | 'travelDates'
type FormValidationErrors = Record<FormValidationField, string[]>

function cloneDate(date: Date) {
  return new Date(date)
}

function createCustomPresets(): PresetRange<Date>[] {
  return [
    {
      label: 'Weekend Escape',
      slot: 'highlight',
      value: () => {
        const start = new Date()
        const day = start.getDay()
        const delta = (5 - day + 7) % 7
        start.setDate(start.getDate() + delta)
        const end = new Date(start)
        end.setDate(start.getDate() + 2)

        return [start, end]
      },
    },
    {
      label: 'Two Weeks Out',
      value: () => {
        const start = new Date()
        start.setDate(start.getDate() + 14)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)

        return [start, end]
      },
    },
  ]
}

export function usePlaygroundAdvancedState() {
  const today = new Date()
  const inSevenDays = new Date(today)
  inSevenDays.setDate(today.getDate() + 6)

  const minDate = new Date(today)
  minDate.setDate(today.getDate() - 20)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 120)

  const customPresets = createCustomPresets()

  const rangeValue = ref<AdvancedDateModel<Date>>([today, inSevenDays])
  const singleValue = ref<AdvancedDateModel<Date>>(today)
  const constrainedValue = ref<AdvancedDateModel<Date>>(null)
  const typedValue = ref<AdvancedDateModel<Date>>(null)
  const pickerOnlyValue = ref<AdvancedDateModel<Date>>(today)
  const rangeMenu = ref(false)
  const presetMenu = ref(false)
  const customPresetMenu = ref(false)

  function disableWeekends(date: Date) {
    const day = date.getDay()

    return day !== 0 && day !== 6
  }

  function allowMondays(date: Date) {
    return date.getDay() === 1
  }

  function allowFridays(date: Date) {
    return date.getDay() === 5
  }

  const formValidationPaymentDate = ref<AdvancedDateModel<Date>>(null)
  const formValidationPaymentMenu = ref(false)
  const formValidationPaymentText = ref('')
  const formValidationTravelDates = ref<AdvancedDateRangeTuple<Date>>([
    null,
    null,
  ])
  const formValidationTravelMenu = ref(false)
  const formValidationTravelText = ref('')
  const formValidationTouched = reactive<Record<FormValidationField, boolean>>({
    paymentDate: false,
    travelDates: false,
  })
  const formValidationSubmitCount = ref(0)
  const formValidationLastSubmission = ref<{
    paymentDate: string | null
    travelDates: {
      start: string | null
      end: string | null
    }
  } | null>(null)

  const formValidationErrors = computed<FormValidationErrors>(() => {
    const errors: FormValidationErrors = {
      paymentDate: [],
      travelDates: [],
    }
    const paymentDate =
      formValidationPaymentDate.value instanceof Date
        ? formValidationPaymentDate.value
        : null
    const travelDates = normalizeRangeModel(formValidationTravelDates.value)

    if (!paymentDate) {
      errors.paymentDate.push('Choose a payment date before submitting.')
    }

    if (!travelDates.start || !travelDates.end) {
      errors.travelDates.push('Choose both a start and end travel date.')
    } else if (countCalendarNights(travelDates.start, travelDates.end) < 3) {
      errors.travelDates.push('Travel dates must cover at least 3 nights.')
    }

    return errors
  })

  const formValidationVisibleErrors = computed<FormValidationErrors>(() => ({
    paymentDate:
      formValidationTouched.paymentDate || formValidationSubmitCount.value > 0
        ? formValidationErrors.value.paymentDate
        : [],
    travelDates:
      formValidationTouched.travelDates || formValidationSubmitCount.value > 0
        ? formValidationErrors.value.travelDates
        : [],
  }))

  const formValidationIsValid = computed(
    () =>
      !formValidationErrors.value.paymentDate.length &&
      !formValidationErrors.value.travelDates.length,
  )

  const formValidationOutput = computed(() => ({
    touched: { ...formValidationTouched },
    submitCount: formValidationSubmitCount.value,
    menus: {
      paymentDate: formValidationPaymentMenu.value,
      travelDates: formValidationTravelMenu.value,
    },
    errors: formValidationErrors.value,
    text: {
      paymentDate: formValidationPaymentText.value,
      travelDates: formValidationTravelText.value,
    },
    model: {
      paymentDate: serializePreviewModel(formValidationPaymentDate.value),
      travelDates: serializePreviewModel(formValidationTravelDates.value),
    },
    lastSubmission: formValidationLastSubmission.value,
  }))

  watch([formValidationPaymentDate, formValidationTravelDates], () => {
    formValidationLastSubmission.value = null
  })

  function touchFormValidationField(field: FormValidationField) {
    formValidationTouched[field] = true
  }

  function formValidationMenu(field: FormValidationField) {
    return field === 'paymentDate'
      ? formValidationPaymentMenu.value
      : formValidationTravelMenu.value
  }

  function handleFormValidationBlur(field: FormValidationField) {
    if (formValidationMenu(field)) return

    touchFormValidationField(field)
  }

  function submitFormValidationExample() {
    formValidationSubmitCount.value += 1
    touchFormValidationField('paymentDate')
    touchFormValidationField('travelDates')

    if (!formValidationIsValid.value) {
      formValidationLastSubmission.value = null
      return
    }

    const travelDates = normalizeRangeModel(formValidationTravelDates.value)

    formValidationLastSubmission.value = {
      paymentDate:
        formValidationPaymentDate.value instanceof Date
          ? toLocalYmd(formValidationPaymentDate.value)
          : null,
      travelDates: {
        start: toLocalYmd(travelDates.start),
        end: toLocalYmd(travelDates.end),
      },
    }
  }

  function resetFormValidationExample() {
    formValidationPaymentDate.value = null
    formValidationPaymentMenu.value = false
    formValidationPaymentText.value = ''
    formValidationTravelDates.value = [null, null]
    formValidationTravelMenu.value = false
    formValidationTravelText.value = ''
    formValidationTouched.paymentDate = false
    formValidationTouched.travelDates = false
    formValidationSubmitCount.value = 0
    formValidationLastSubmission.value = null
  }

  const draftApiStart = new Date()
  draftApiStart.setDate(draftApiStart.getDate() + 14)

  const draftApiEnd = new Date(draftApiStart)
  draftApiEnd.setDate(draftApiStart.getDate() + 5)

  const draftApiValue = ref<AdvancedDateModel<Date>>([
    cloneDate(draftApiStart),
    cloneDate(draftApiEnd),
  ])
  const draftApiText = ref(
    `${formatDemoDate(draftApiStart)} – ${formatDemoDate(draftApiEnd)}`,
  )
  const draftApiMenu = ref(false)
  const draftApiCloseStrategy = ref<AdvancedDateInputCloseStrategy>('revert')
  const draftApiRef = ref<AdvancedDateInputPublicInstance<Date> | null>(null)
  const draftApiDraft = ref<AdvancedDateInputDraft<Date> | null>(null)
  const draftApiCommit = ref<AdvancedDateInputCommitPayload<Date> | null>(null)
  const draftApiInvalid = ref<AdvancedDateInputInvalidPayload<Date> | null>(
    null,
  )
  const draftApiClose = ref<AdvancedDateInputClosePayload<Date> | null>(null)
  const draftApiValidation = ref<string[]>([])

  function handleDraftUpdate(value: AdvancedDateInputDraft<Date>) {
    draftApiDraft.value = value
  }

  function handleDraftCommit(value: AdvancedDateInputCommitPayload<Date>) {
    draftApiCommit.value = value
    draftApiInvalid.value = null
    draftApiValidation.value = []
  }

  function handleDraftInvalid(value: AdvancedDateInputInvalidPayload<Date>) {
    draftApiInvalid.value = value
    draftApiValidation.value = [...(draftApiRef.value?.errorMessages ?? [])]
  }

  function handleDraftClose(value: AdvancedDateInputClosePayload<Date>) {
    draftApiClose.value = value
  }

  async function runDraftValidate() {
    draftApiValidation.value = (await draftApiRef.value?.validate()) ?? []
  }

  async function runDraftCommit() {
    const committed = (await draftApiRef.value?.commitInput()) ?? false

    draftApiValidation.value = committed
      ? []
      : [...(draftApiRef.value?.errorMessages ?? [])]
  }

  function runDraftRevert() {
    draftApiRef.value?.revertDraft()
    draftApiValidation.value = []
  }

  const draftApiOutput = computed(() => ({
    closeDraftStrategy: draftApiCloseStrategy.value,
    menu: draftApiMenu.value,
    text: draftApiText.value,
    committedValue: serializePreviewModel(draftApiValue.value),
    publicState: {
      isDirty: draftApiRef.value?.isDirty ?? null,
      isPristine: draftApiRef.value?.isPristine ?? null,
      isValid: draftApiRef.value?.isValid ?? null,
      errorMessages: draftApiRef.value?.errorMessages ?? [],
    },
    draft: draftApiDraft.value ? serializeDraft(draftApiDraft.value) : null,
    lastValidate: draftApiValidation.value,
    lastCommit: draftApiCommit.value
      ? {
          value: serializePreviewModel(draftApiCommit.value.value),
          draft: serializeDraft(draftApiCommit.value.draft),
        }
      : null,
    lastInvalid: draftApiInvalid.value
      ? {
          reason: draftApiInvalid.value.reason,
          draft: serializeDraft(draftApiInvalid.value.draft),
        }
      : null,
    lastClose: draftApiClose.value
      ? {
          reason: draftApiClose.value.reason,
          strategy: draftApiClose.value.strategy,
          outcome: draftApiClose.value.outcome,
          draft: serializeDraft(draftApiClose.value.draft),
        }
      : null,
  }))

  const constrainedHardBoundsValue = ref<AdvancedDateModel<Date>>(null)
  const constrainedRevealedMonthValue = ref<AdvancedDateModel<Date>>(null)
  const constrainedDraftRangeValue = ref<AdvancedDateModel<Date>>([
    createLocalDate(2026, 0, 20),
    null,
  ])
  const constrainedGapMonthValue = ref<AdvancedDateModel<Date>>(null)
  const constrainedMobileFullscreenValue = ref<AdvancedDateModel<Date>>(null)

  return {
    allowFridays,
    allowMondays,
    closeStrategyOptions,
    constrainedDraftRangeValue,
    constrainedGapMonthValue,
    constrainedHardBoundsValue,
    constrainedMobileFullscreenValue,
    constrainedRevealedMonthValue,
    constrainedValue,
    customPresetMenu,
    customPresets,
    disableWeekends,
    draftApiCloseStrategy,
    draftApiMenu,
    draftApiOutput,
    draftApiRef,
    draftApiText,
    draftApiValue,
    flightEndFieldProps,
    flightStartFieldProps,
    formValidationEndFieldProps,
    formValidationIsValid,
    formValidationLastSubmission,
    formValidationOutput,
    formValidationPaymentDate,
    formValidationPaymentMenu,
    formValidationPaymentText,
    formValidationStartFieldProps,
    formValidationSubmitCount,
    formValidationTravelDates,
    formValidationTravelMenu,
    formValidationTravelText,
    formValidationVisibleErrors,
    handleDraftClose,
    handleDraftCommit,
    handleDraftInvalid,
    handleDraftUpdate,
    handleFormValidationBlur,
    maxDate,
    minDate,
    pasteEndFieldProps,
    pasteStartFieldProps,
    pickerOnlyValue,
    presetMenu,
    rangeMenu,
    rangeValue,
    resetFormValidationExample,
    runDraftCommit,
    runDraftRevert,
    runDraftValidate,
    singleValue,
    submitFormValidationExample,
    touchFormValidationField,
    typedValue,
  }
}
