<script setup lang="ts">
import { computed, ref } from 'vue'

import type { AdvancedDateModel, PresetRange } from 'vuetify-date-input-advanced'

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
const menu = ref(false)

const customPresets: PresetRange<Date>[] = [
  {
    label: 'Weekend Escape',
    slot: 'highlight',
    value: () => {
      const start = new Date()
      const day = start.getDay()
      const delta = ((5 - day) + 7) % 7
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

function serializeModel(value: AdvancedDateModel<Date>) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map(item => item?.toISOString().slice(0, 10) ?? null)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if ('start' in value && 'end' in value) {
    return {
      start: value.start?.toISOString().slice(0, 10) ?? null,
      end: value.end?.toISOString().slice(0, 10) ?? null,
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
  menu: menu.value,
}))
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-10" max-width="1400">
        <div class="d-flex flex-column ga-8">
          <div>
            <div class="text-overline text-medium-emphasis">Playground</div>
            <h1 class="text-h4 font-weight-bold mb-2">Vuetify Advanced Date Picker</h1>
            <p class="text-body-1 text-medium-emphasis">
              Baseline manual QA app for range, single, inline, constrained, and typed-input flows.
            </p>
          </div>

          <v-row>
            <v-col cols="12" lg="8">
              <div class="d-flex flex-column ga-6">
                <v-card variant="outlined">
                  <v-card-title>Range Input</v-card-title>
                  <v-card-text>
                    <v-advanced-date-input
                      v-model="rangeValue"
                      v-model:menu="menu"
                      label="Travel dates"
                      :months="2"
                      show-presets
                    />
                  </v-card-text>
                </v-card>

                <v-card variant="outlined">
                  <v-card-title>Single Date Mode</v-card-title>
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
              <div class="d-flex flex-column ga-6">
                <v-card variant="tonal">
                  <v-card-title>Inline Dashboard Mode</v-card-title>
                  <v-card-text>
                    <v-advanced-date-input
                      v-model="inlineValue"
                      inline
                      :months="2"
                      :auto-apply="false"
                      :presets="customPresets"
                    >
                      <template #preset-highlight="{ preset }">
                        <div class="d-flex align-center justify-space-between w-100">
                          <span>{{ preset.label }}</span>
                          <v-chip size="x-small" color="primary" variant="tonal">Custom</v-chip>
                        </div>
                      </template>
                    </v-advanced-date-input>
                  </v-card-text>
                </v-card>

                <v-card variant="outlined">
                  <v-card-title>Emitted Model</v-card-title>
                  <v-card-text>
                    <pre class="text-body-2">{{ JSON.stringify(output, null, 2) }}</pre>
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
