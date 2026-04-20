<script setup lang="ts">
import { computed, ref } from 'vue'

import type {
  AdvancedDateInputClosePayload,
  AdvancedDateInputCloseStrategy,
  AdvancedDateInputCommitPayload,
  AdvancedDateInputDraft,
  AdvancedDateInputInvalidPayload,
  AdvancedDateInputPublicInstance,
  AdvancedDateModel,
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
    <v-card-title>Typed Input + Validation</v-card-title>
    <v-card-subtitle>
      Test paste and keyboard entry before applying the value.
    </v-card-subtitle>
    <v-card-text>
      <v-advanced-date-input
        v-model="typedValue"
        label="Paste a range"
        placeholder="Jan 12, 2026 – Jan 19, 2026"
        :months="2"
        :auto-apply="false"
      />
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
</template>

<style scoped>
.draft-api-output {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
