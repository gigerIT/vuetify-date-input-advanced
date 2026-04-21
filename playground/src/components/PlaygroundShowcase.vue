<script setup lang="ts">
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
  AdvancedDateRangeObject,
  AdvancedDateRangeTuple,
  PresetRange,
} from '@gigerit/vuetify-date-input-advanced'

defineProps<{
  inlineInputProps: Record<string, unknown>
  customPresets: PresetRange<Date>[]
  minDate: Date
  maxDate: Date
  disableWeekends: (date: Date) => boolean
  allowMondays: (date: Date) => boolean
  allowFridays: (date: Date) => boolean
}>()

const inlineValue = defineModel<AdvancedDateModel<Date>>('inlineValue', {
  required: true,
})
const rangeValue = defineModel<AdvancedDateModel<Date>>('rangeValue', {
  required: true,
})
const singleValue = defineModel<AdvancedDateModel<Date>>('singleValue', {
  required: true,
})
const constrainedValue = defineModel<AdvancedDateModel<Date>>(
  'constrainedValue',
  {
    required: true,
  },
)
const typedValue = defineModel<AdvancedDateModel<Date>>('typedValue', {
  required: true,
})
const pickerOnlyValue = defineModel<AdvancedDateModel<Date>>(
  'pickerOnlyValue',
  {
    required: true,
  },
)
const rangeMenu = defineModel<boolean>('rangeMenu', { required: true })
const presetMenu = defineModel<boolean>('presetMenu', { required: true })
const customPresetMenu = defineModel<boolean>('customPresetMenu', {
  required: true,
})

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

function cloneDate(date: Date) {
  return new Date(date)
}

function formatDemoDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function createLocalDate(year: number, month: number, day: number) {
  return new Date(year, month, day)
}

function normalizeRangeModel(
  value: AdvancedDateModel<Date>,
): AdvancedDateRangeObject<Date> {
  if (Array.isArray(value)) {
    return {
      start: value[0],
      end: value[1],
    }
  }

  if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
    return value
  }

  if (value instanceof Date) {
    return {
      start: value,
      end: value,
    }
  }

  return {
    start: null,
    end: null,
  }
}

function toUtcCalendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function countCalendarNights(start: Date, end: Date) {
  return Math.round(
    (toUtcCalendarDay(end) - toUtcCalendarDay(start)) / 86_400_000,
  )
}

function allowOnly(...allowedDates: string[]) {
  const allowed = new Set(allowedDates)

  return (date: Date) => allowed.has(toLocalYmd(date) ?? '')
}

function serializePreviewModel(value: AdvancedDateModel<Date>) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map((item) => toLocalYmd(item))
  if (value instanceof Date) return toLocalYmd(value)
  if ('start' in value && 'end' in value) {
    return {
      start: toLocalYmd(value.start),
      end: toLocalYmd(value.end),
    }
  }

  return value
}

function serializeDraft(draft: AdvancedDateInputDraft<Date>) {
  return {
    ...draft,
    selection: {
      start: toLocalYmd(draft.selection.start),
      end: toLocalYmd(draft.selection.end),
    },
  }
}

type FormValidationField = 'paymentDate' | 'travelDates'
type FormValidationErrors = Record<FormValidationField, string[]>

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
const draftApiInvalid = ref<AdvancedDateInputInvalidPayload<Date> | null>(null)
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
</script>

<template>
  <v-card variant="flat">
    <v-card-title>Inline</v-card-title>
    <v-card-subtitle>
      Persistent inline picker with a live-configurable prop set.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input v-model="inlineValue" v-bind="inlineInputProps">
        <template #preset-highlight="{ preset }">
          <div class="d-flex align-center justify-space-between w-100">
            <span>{{ preset.label }}</span>
            <v-chip size="x-small" color="primary" variant="tonal"
              >Custom</v-chip
            >
          </div>
        </template>
      </v-advanced-date-input>
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Range Input</v-card-title>
    <v-card-subtitle>
      Baseline popup flow with range selection and no presets.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        v-model:menu="rangeMenu"
        label="Travel dates"
        :months="2"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Range Input with custom navigation icons</v-card-title>
    <v-card-subtitle>
      Demonstrates explicit picker icon overrides on the shared input surface.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        label="Travel dates"
        :months="2"
        :show-presets="false"
        prev-icon="mdi-page-first"
        next-icon="mdi-page-last"
        append-inner-icon="mdi-calendar-range"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Range Input with presets</v-card-title>
    <v-card-subtitle>
      Quick-select ranges with the built-in preset list.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        v-model:menu="presetMenu"
        label="Travel dates"
        :months="2"
        show-presets
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Range Input with custom presets</v-card-title>
    <v-card-subtitle>
      Exercises custom preset data and slot rendering.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        v-model:menu="customPresetMenu"
        label="Travel dates"
        :months="2"
        show-presets
        :presets="customPresets"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Single Date Mode</v-card-title>
    <v-card-subtitle>
      Confirms the component switches cleanly out of range mode.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="singleValue"
        label="Departure date"
        :range="false"
        :months="2"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Input Color Prop</v-card-title>
    <v-card-subtitle>
      Focus the fields to inspect Vuetify utility and CSS color values on the
      built-in text controls.
    </v-card-subtitle>
    <v-card-text class="d-flex flex-column ga-4">
      <v-advanced-date-input
        v-model="singleValue"
        color="success"
        label="Utility color"
        :range="false"
        :show-presets="false"
      />

      <v-advanced-date-input
        v-model="rangeValue"
        color="rgba(0, 128, 128, 0.85)"
        label="CSS color"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Forwarded Input Attrs</v-card-title>
    <v-card-subtitle>
      Shows form attrs reaching the default text input when no custom activator
      is used.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        id="playground-check-in-date"
        v-model="singleValue"
        name="checkInDate"
        label="Check-in date"
        data-testid="playground-check-in-date"
        :range="false"
        :show-presets="false"
      />
      <div class="text-caption text-medium-emphasis mt-2">
        Inspect the rendered input to verify the forwarded <code>id</code>,
        <code>name</code>, and <code>data-testid</code> attrs.
      </div>
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Custom Picker Title</v-card-title>
    <v-card-subtitle>
      Shows an optional picker heading that stays visible in desktop and mobile
      overlays.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="singleValue"
        label="Departure date"
        title="Departure Date"
        :range="false"
        :months="2"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Range Picker Titles</v-card-title>
    <v-card-subtitle>
      Switches between start and end titles while the user completes a range.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        label="Travel dates"
        title="Travel dates"
        title-start-date="Departure date"
        title-end-date="Return date"
        :months="2"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Split Range Inputs</v-card-title>
    <v-card-subtitle>
      Uses separate start/end field props for range-mode placeholders and form
      attrs.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="rangeValue"
        label="Flight dates"
        title="Flight dates"
        title-start-date="Depart"
        title-end-date="Return"
        :months="2"
        :start-field-props="flightStartFieldProps"
        :end-field-props="flightEndFieldProps"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Typed Input + Validation</v-card-title>
    <v-card-subtitle>
      Test paste and keyboard entry before applying the value.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="typedValue"
        label="Paste a range"
        :months="2"
        :auto-apply="false"
        :start-field-props="pasteStartFieldProps"
        :end-field-props="pasteEndFieldProps"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Form Validation with Error Props</v-card-title>
    <v-card-subtitle>
      Mirrors a parent form that validates on blur or submit and maps external
      errors into the date inputs.
    </v-card-subtitle>
    <v-card-text
      class="d-flex flex-column ga-4"
      data-testid="playground-form-validation"
    >
      <v-form
        class="d-flex flex-column ga-4"
        data-testid="playground-form-validation-form"
        @submit.prevent="submitFormValidationExample"
      >
        <v-advanced-date-input
          v-model="formValidationPaymentDate"
          v-model:menu="formValidationPaymentMenu"
          v-model:text="formValidationPaymentText"
          label="Payment date"
          name="paymentDate"
          :range="false"
          :show-presets="false"
          :error="formValidationVisibleErrors.paymentDate.length > 0"
          :error-messages="formValidationVisibleErrors.paymentDate"
          @blur="handleFormValidationBlur('paymentDate')"
          @draft-close="touchFormValidationField('paymentDate')"
        />

        <v-advanced-date-input
          v-model="formValidationTravelDates"
          v-model:menu="formValidationTravelMenu"
          v-model:text="formValidationTravelText"
          label="Travel dates"
          title="Travel dates"
          title-start-date="Departure"
          title-end-date="Return"
          :months="2"
          :show-presets="false"
          :start-field-props="formValidationStartFieldProps"
          :end-field-props="formValidationEndFieldProps"
          :error="formValidationVisibleErrors.travelDates.length > 0"
          :error-messages="formValidationVisibleErrors.travelDates"
          @blur="handleFormValidationBlur('travelDates')"
          @draft-close="touchFormValidationField('travelDates')"
        />

        <div class="d-flex flex-wrap ga-3">
          <v-btn
            color="primary"
            type="submit"
            data-testid="playground-form-validation-submit"
          >
            Validate booking form
          </v-btn>
          <v-btn variant="text" @click="resetFormValidationExample">
            Reset
          </v-btn>
        </div>
      </v-form>

      <v-alert
        v-if="formValidationSubmitCount && !formValidationIsValid"
        type="warning"
        variant="tonal"
      >
        Fix the highlighted date fields before submitting the form.
      </v-alert>

      <v-alert
        v-else-if="formValidationLastSubmission"
        type="success"
        variant="tonal"
      >
        Form payload is valid and ready to submit.
      </v-alert>

      <div class="text-caption text-medium-emphasis">
        This example keeps validation in the parent and forwards the resulting
        <code>error</code> and <code>error-messages</code> props, which is the
        same pattern a schema-driven form would use.
      </div>

      <v-sheet border rounded="lg" class="pa-4">
        <pre class="form-validation-output text-body-2">{{
          JSON.stringify(formValidationOutput, null, 2)
        }}</pre>
      </v-sheet>
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Draft API + External Submit</v-card-title>
    <v-card-subtitle>
      Binds <code>v-model:text</code>, surfaces <code>update:draft</code>, and
      uses the exposed public handle so a parent form can validate or commit on
      submit.
    </v-card-subtitle>
    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex flex-wrap align-center ga-3">
        <v-select
          v-model="draftApiCloseStrategy"
          label="Close strategy"
          :items="closeStrategyOptions"
          density="comfortable"
          hide-details
          style="min-width: 220px; max-width: 320px"
        />

        <v-btn color="primary" @click="runDraftCommit">Parent submit</v-btn>
        <v-btn variant="tonal" @click="runDraftValidate">Validate draft</v-btn>
        <v-btn variant="text" @click="runDraftRevert">Revert draft</v-btn>
      </div>

      <v-advanced-date-input
        ref="draftApiRef"
        v-model="draftApiValue"
        v-model:text="draftApiText"
        v-model:menu="draftApiMenu"
        label="Travel dates with draft API"
        :months="2"
        :close-draft-strategy="draftApiCloseStrategy"
        @update:draft="handleDraftUpdate"
        @input-commit="handleDraftCommit"
        @input-invalid="handleDraftInvalid"
        @draft-close="handleDraftClose"
      />

      <div class="text-caption text-medium-emphasis">
        Try one range click, then dismiss the overlay or press Escape after
        switching strategies. The preview distinguishes committed model state
        from pending partial draft state.
      </div>

      <v-sheet border rounded="lg" class="pa-4">
        <pre class="draft-api-output text-body-2">{{
          JSON.stringify(draftApiOutput, null, 2)
        }}</pre>
      </v-sheet>
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Picker-only Input</v-card-title>
    <v-card-subtitle>
      Disables manual typing while keeping the field, icon, and picker actions
      interactive.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="pickerOnlyValue"
        label="Choose with picker only"
        input-readonly
        clearable
        :range="false"
        :months="2"
        :auto-apply="false"
        :show-presets="false"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Constrained Selection</v-card-title>
    <v-card-subtitle>
      Limits dates to weekdays, with Monday-only starts and Friday-only ends.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="constrainedValue"
        label="Start Monday, end Friday"
        :months="2"
        :min="minDate"
        :max="maxDate"
        :allowed-dates="disableWeekends"
        :allowed-start-dates="allowMondays"
        :allowed-end-dates="allowFridays"
      />
    </v-card-text>
  </v-card>

  <v-card variant="flat">
    <v-card-title>Constrained Navigation Edge Cases</v-card-title>
    <v-card-subtitle>
      Desktop inline pickers that show when month arrows disable instead of
      no-oping or skipping unavailable months.
    </v-card-subtitle>
    <v-card-text class="d-flex flex-column ga-4">
      <v-sheet
        border
        rounded="lg"
        class="pa-4"
        data-testid="playground-edge-hard-bounds"
      >
        <div class="text-subtitle-2 font-weight-medium">
          Hard min/max bounds
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          A two-month viewport locked to January and February 2026. Both arrows
          disable because moving would only reveal months outside the allowed
          bounds.
        </div>
        <v-advanced-date-picker
          v-model="constrainedHardBoundsValue"
          :range="false"
          :months="2"
          :show-presets="false"
          :month="0"
          :year="2026"
          :min="createLocalDate(2026, 0, 10)"
          :max="createLocalDate(2026, 1, 10)"
        />
      </v-sheet>

      <v-sheet
        border
        rounded="lg"
        class="pa-4"
        data-testid="playground-edge-revealed-month"
      >
        <div class="text-subtitle-2 font-weight-medium">
          Revealed month has no selectable dates
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          February 2026 still has one valid date and January stays reachable,
          but the next arrow disables because March has nothing selectable.
        </div>
        <v-advanced-date-picker
          v-model="constrainedRevealedMonthValue"
          :range="false"
          :months="1"
          :show-presets="false"
          :month="1"
          :year="2026"
          :allowed-dates="allowOnly('2026-01-15', '2026-02-05')"
        />
      </v-sheet>

      <v-sheet
        border
        rounded="lg"
        class="pa-4"
        data-testid="playground-edge-draft-range"
      >
        <div class="text-subtitle-2 font-weight-medium">
          Pending range end locks future navigation
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          This starts from the intermediate one-click range state. The only
          valid end date stays in January, so the next arrow disables while the
          range is still incomplete.
        </div>
        <v-advanced-date-picker
          v-model="constrainedDraftRangeValue"
          :months="1"
          :show-presets="false"
          :auto-apply="false"
          :month="0"
          :year="2026"
          :allowed-start-dates="allowOnly('2026-01-20', '2026-02-10')"
          :allowed-end-dates="allowOnly('2026-01-25')"
        />
      </v-sheet>

      <v-sheet
        border
        rounded="lg"
        class="pa-4"
        data-testid="playground-edge-gap-month"
      >
        <div class="text-subtitle-2 font-weight-medium">
          Gap months are not skipped
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          April has a selectable date, but March is empty, so the next arrow
          stays disabled instead of jumping over the gap.
        </div>
        <v-advanced-date-picker
          v-model="constrainedGapMonthValue"
          :range="false"
          :months="1"
          :show-presets="false"
          :month="1"
          :year="2026"
          :allowed-dates="allowOnly('2026-02-10', '2026-04-10')"
        />
      </v-sheet>

      <v-sheet
        border
        rounded="lg"
        class="pa-4"
        data-testid="playground-edge-mobile-fullscreen"
      >
        <div class="text-subtitle-2 font-weight-medium">
          Mobile fullscreen constrained scroll limit
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          Resize below the mobile breakpoint to activate fullscreen scrolling.
          In constrained mode, the mobile month list stops at January and
          February 2026 instead of rendering extra out-of-bounds months.
        </div>
        <v-advanced-date-picker
          v-model="constrainedMobileFullscreenValue"
          mobile-presentation="fullscreen"
          :range="false"
          :months="2"
          :show-presets="false"
          :month="0"
          :year="2026"
          :min="createLocalDate(2026, 0, 10)"
          :max="createLocalDate(2026, 1, 10)"
        />
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.draft-api-output {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-validation-output {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
