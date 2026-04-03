<script setup lang="ts">
import { computed, ref } from 'vue'

import type {
  AdvancedDateModel,
  PresetRange,
} from 'vuetify-date-input-advanced'

const today = new Date()
const inSevenDays = new Date(today)
inSevenDays.setDate(today.getDate() + 6)

const minDate = new Date(today)
minDate.setDate(today.getDate() - 20)

const maxDate = new Date(today)
maxDate.setDate(today.getDate() + 120)

const rangeValue = ref<AdvancedDateModel<Date>>([today, inSevenDays])
const singleValue = ref<AdvancedDateModel<Date>>(today)
const inlineValue = ref<AdvancedDateModel<Date>>([today, inSevenDays])
const constrainedValue = ref<AdvancedDateModel<Date>>(null)
const typedValue = ref<AdvancedDateModel<Date>>(null)
const rangeMenu = ref(false)
const presetMenu = ref(false)
const customPresetMenu = ref(false)

const customPresets: PresetRange<Date>[] = [
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

function disableWeekends(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

function toLocalYmd(date: Date | null | undefined) {
  if (!date) return null

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function serializeModel(value: AdvancedDateModel<Date>) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map((item) => toLocalYmd(item))
  if (value instanceof Date) return toLocalYmd(value)
  if ('start' in value && 'end' in value) {
    return {
      start: toLocalYmd(value.start),
      end: toLocalYmd(value.end),
    }
  }

  return {
    value,
  }
}

const output = computed(() => ({
  range: serializeModel(rangeValue.value),
  single: serializeModel(singleValue.value),
  inline: serializeModel(inlineValue.value),
  constrained: serializeModel(constrainedValue.value),
  typed: serializeModel(typedValue.value),
  menus: {
    range: rangeMenu.value,
    presets: presetMenu.value,
    customPresets: customPresetMenu.value,
  },
}))
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-10" max-width="1400">
        <div class="d-flex flex-column ga-8">
          <div>
            <div class="text-overline text-medium-emphasis">Playground</div>
            <h1 class="text-h4 font-weight-bold mb-2">
              Vuetify Advanced Date Picker
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Baseline manual QA app for range, single, inline, constrained, and
              typed-input flows.
            </p>
          </div>

          <v-row align="start" class="ga-2">
            <v-col cols="12" lg="8">
              <div class="d-flex flex-column ga-6">
                <div>
                  <div class="text-overline text-medium-emphasis">Examples</div>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    Interact with each state and watch the serialized model
                    update live in the right-hand panel.
                  </p>
                </div>

                <v-card variant="flat">
                  <v-card-title>Inline Dashboard Mode</v-card-title>
                  <v-card-subtitle>
                    Persistent inline picker for multi-month range selection.
                  </v-card-subtitle>
                  <v-card-text>
                    <v-advanced-date-input
                      v-model="inlineValue"
                      inline
                      :months="2"
                      :auto-apply="false"
                    >
                      <template #preset-highlight="{ preset }">
                        <div
                          class="d-flex align-center justify-space-between w-100"
                        >
                          <span>{{ preset.label }}</span>
                          <v-chip size="x-small" color="primary" variant="tonal"
                            >Custom</v-chip
                          >
                        </div>
                      </template>
                    </v-advanced-date-input>
                  </v-card-text>
                </v-card>

                <v-card variant="outlined">
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

                <v-card variant="outlined">
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

                <v-card variant="outlined">
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

                <v-card variant="outlined">
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

                <v-card variant="outlined">
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

                <v-card variant="outlined">
                  <v-card-title>Constrained Selection</v-card-title>
                  <v-card-subtitle>
                    Limits dates to the configured window and weekdays only.
                  </v-card-subtitle>
                  <v-card-text>
                    <v-advanced-date-input
                      v-model="constrainedValue"
                      label="Non-weekend dates only"
                      :months="2"
                      :min="minDate"
                      :max="maxDate"
                      :allowed-dates="disableWeekends"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </v-col>

            <v-col cols="12" lg="4">
              <div class="preview-column">
                <v-card class="preview-card" variant="outlined">
                  <v-card-title>Live Model Output</v-card-title>
                  <v-card-subtitle>
                    Serialized values and menu state for the current playground
                    session.
                  </v-card-subtitle>
                  <v-card-text>
                    <pre class="model-output text-body-2">{{
                      JSON.stringify(output, null, 2)
                    }}</pre>
                  </v-card-text>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.preview-column {
  position: sticky;
  top: 24px;
}

.preview-card {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.model-output {
  max-height: calc(100vh - 180px);
  overflow: auto;
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1279px) {
  .preview-column {
    position: static;
  }

  .model-output {
    max-height: none;
  }
}
</style>
