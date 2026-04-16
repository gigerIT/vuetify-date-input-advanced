<script setup lang="ts">
import type {
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
const rangeMenu = defineModel<boolean>('rangeMenu', { required: true })
const presetMenu = defineModel<boolean>('presetMenu', { required: true })
const customPresetMenu = defineModel<boolean>('customPresetMenu', {
  required: true,
})
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
            <v-chip size="x-small" color="primary" variant="tonal">Custom</v-chip>
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
