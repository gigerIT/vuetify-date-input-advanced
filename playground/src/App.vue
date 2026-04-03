<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useLocale, useTheme } from 'vuetify'

import type {
  AdvancedDateModel,
  PresetRange,
} from '@gigerit/vuetify-date-input-advanced'

type InlinePresetMode = 'hidden' | 'default' | 'custom'
type InlineDensity = 'default' | 'comfortable' | 'compact'
type PlaygroundLocale = 'de' | 'en' | 'fr'
type ThemeMode = 'dark' | 'light' | 'system'

const localeOptions = [
  { title: 'English', value: 'en' },
  { title: 'Français', value: 'fr' },
  { title: 'Deutsch', value: 'de' },
] satisfies { title: string; value: PlaygroundLocale }[]

const localeLabels = Object.fromEntries(
  localeOptions.map(({ title, value }) => [value, title]),
) as Record<PlaygroundLocale, string>

const { current: currentLocale } = useLocale()
const theme = useTheme()

function normalizePlaygroundLocale(value: string): PlaygroundLocale {
  return value === 'de' || value === 'en' || value === 'fr' ? value : 'en'
}

function normalizeThemeMode(value: string): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system'
}

const playgroundLocale = computed<PlaygroundLocale>({
  get: () => normalizePlaygroundLocale(currentLocale.value),
  set: (value) => {
    currentLocale.value = value
  },
})

const themeMode = computed<ThemeMode>({
  get: () => normalizeThemeMode(theme.global.name.value),
  set: (value) => {
    theme.global.name.value = value
  },
})

const resolvedThemeLabel = computed(() =>
  theme.global.current.value.dark ? 'Dark' : 'Light',
)

const themeModeSummary = computed(() =>
  themeMode.value === 'system'
    ? `Following your system preference (${resolvedThemeLabel.value}).`
    : `Playground forced to ${themeMode.value} mode.`,
)

const localeSummary = computed(
  () =>
    `Vuetify dates and locale-aware copy use ${localeLabels[playgroundLocale.value]}.`,
)

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

const inlineOptions = reactive({
  range: true,
  months: 2,
  autoApply: false,
  returnObject: false,
  presetMode: 'default' as InlinePresetMode,
  showWeekNumbers: false,
  firstDayOfWeek: 0,
  density: 'default' as InlineDensity,
  disabled: false,
  readonly: false,
})

const monthOptions = [1, 2, 3, 4].map((value) => ({
  title: `${value} month${value === 1 ? '' : 's'}`,
  value,
}))

const presetModeOptions = [
  { title: 'Hidden', value: 'hidden' },
  { title: 'Built-in', value: 'default' },
  { title: 'Custom', value: 'custom' },
] satisfies { title: string; value: InlinePresetMode }[]

const firstDayOfWeekOptions = [
  { title: 'Sunday', value: 0 },
  { title: 'Monday', value: 1 },
  { title: 'Tuesday', value: 2 },
  { title: 'Wednesday', value: 3 },
  { title: 'Thursday', value: 4 },
  { title: 'Friday', value: 5 },
  { title: 'Saturday', value: 6 },
]

const densityOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Comfortable', value: 'comfortable' },
  { title: 'Compact', value: 'compact' },
] satisfies { title: string; value: InlineDensity }[]

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

function allowMondays(date: Date) {
  return date.getDay() === 1
}

function allowFridays(date: Date) {
  return date.getDay() === 5
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

  return {
    value,
  }
}

function cloneDate(date: Date | null | undefined) {
  return date ? new Date(date) : null
}

function normalizeInlineValue(value: AdvancedDateModel<Date>) {
  if (Array.isArray(value)) {
    return {
      start: cloneDate(value[0]),
      end: cloneDate(value[1]),
    }
  }

  if (value instanceof Date) {
    return {
      start: cloneDate(value),
      end: null,
    }
  }

  if (
    value &&
    typeof value === 'object' &&
    'start' in value &&
    'end' in value
  ) {
    return {
      start: cloneDate(value.start),
      end: cloneDate(value.end),
    }
  }

  return {
    start: null,
    end: null,
  }
}

function coerceInlineModel(value: AdvancedDateModel<Date>) {
  const normalized = normalizeInlineValue(value)

  if (!inlineOptions.range) return normalized.start
  if (!normalized.start && !normalized.end) return null

  if (inlineOptions.returnObject) {
    return {
      start: normalized.start,
      end: normalized.end,
    }
  }

  return [normalized.start, normalized.end] as const
}

const inlineShowPresets = computed(
  () => inlineOptions.range && inlineOptions.presetMode !== 'hidden',
)

const inlinePresets = computed(() =>
  inlineOptions.range && inlineOptions.presetMode === 'custom'
    ? customPresets
    : undefined,
)

const inlineInputProps = computed(() => ({
  inline: true,
  range: inlineOptions.range,
  months: inlineOptions.months,
  autoApply: inlineOptions.autoApply,
  returnObject: inlineOptions.returnObject,
  showPresets: inlineShowPresets.value,
  presets: inlinePresets.value,
  showWeekNumbers: inlineOptions.showWeekNumbers,
  firstDayOfWeek: inlineOptions.firstDayOfWeek,
  density: inlineOptions.density,
  disabled: inlineOptions.disabled,
  readonly: inlineOptions.readonly,
}))

watch(
  () => [inlineOptions.range, inlineOptions.returnObject] as const,
  () => {
    inlineValue.value = coerceInlineModel(inlineValue.value)
  },
)

const output = computed(() => ({
  playground: {
    locale: playgroundLocale.value,
    themeMode: themeMode.value,
  },
  inlineOptions: {
    range: inlineOptions.range,
    months: inlineOptions.months,
    autoApply: inlineOptions.autoApply,
    returnObject: inlineOptions.returnObject,
    showPresets: inlineShowPresets.value,
    presetMode: inlineOptions.range ? inlineOptions.presetMode : 'hidden',
    showWeekNumbers: inlineOptions.showWeekNumbers,
    firstDayOfWeek: inlineOptions.firstDayOfWeek,
    density: inlineOptions.density,
    disabled: inlineOptions.disabled,
    readonly: inlineOptions.readonly,
  },
  range: serializePreviewModel(rangeValue.value),
  single: serializePreviewModel(singleValue.value),
  inline: serializePreviewModel(inlineValue.value),
  constrained: serializePreviewModel(constrainedValue.value),
  typed: serializePreviewModel(typedValue.value),
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
      <v-container max-width="1400">
        <v-row>
          <v-col cols="12" lg="8">
            <h1 class="text-h4 font-weight-bold mb-2">
              Vuetify Advanced Date Picker
            </h1>
            <div class="text-body-2 text-medium-emphasis">
              Preview the picker in different theme and locale settings.
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="flat">
              <v-card-text>
                <div class="text-caption text-medium-emphasis mb-3">Theme</div>

                <v-btn-toggle
                  v-model="themeMode"
                  class="theme-toggle"
                  color="primary"
                  density="comfortable"
                  mandatory
                >
                  <v-btn prepend-icon="mdi-white-balance-sunny" value="light">
                    Light
                  </v-btn>
                  <v-btn prepend-icon="mdi-weather-night" value="dark">
                    Dark
                  </v-btn>
                  <v-btn prepend-icon="mdi-monitor" value="system">
                    System
                  </v-btn>
                </v-btn-toggle>

                <div class="text-caption text-medium-emphasis mt-3">
                  {{ themeModeSummary }}
                </div>

                <div class="text-caption text-medium-emphasis mt-5 mb-3">
                  Locale
                </div>

                <v-btn-toggle
                  v-model="playgroundLocale"
                  class="theme-toggle"
                  color="primary"
                  density="comfortable"
                  mandatory
                >
                  <v-btn value="en">English</v-btn>
                  <v-btn value="fr">Français</v-btn>
                  <v-btn value="de">Deutsch</v-btn>
                </v-btn-toggle>

                <div class="text-caption text-medium-emphasis mt-3">
                  {{ localeSummary }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" lg="8">
            <v-card variant="flat">
              <v-card-title>Inline</v-card-title>
              <v-card-subtitle>
                Persistent inline picker with a live-configurable prop set.
              </v-card-subtitle>
              <v-card-text>
                <v-advanced-date-input
                  v-model="inlineValue"
                  v-bind="inlineInputProps"
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
                Limits dates to weekdays, with Monday-only starts and
                Friday-only ends.
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
          </v-col>

          <v-col cols="12" lg="4">
            <div class="preview-column d-flex flex-column ga-4">
              <v-card variant="flat">
                <v-card-title>Inline Demo Options</v-card-title>
                <v-card-subtitle>
                  Adjust verified picker props and watch the inline demo update
                  immediately.
                </v-card-subtitle>
                <v-card-text>
                  <div class="config-grid">
                    <v-select
                      v-model="inlineOptions.months"
                      label="Months"
                      :items="monthOptions"
                      density="comfortable"
                      hide-details
                    />

                    <v-select
                      v-model="inlineOptions.firstDayOfWeek"
                      label="First day of week"
                      :items="firstDayOfWeekOptions"
                      density="comfortable"
                      hide-details
                    />

                    <v-select
                      v-model="inlineOptions.density"
                      label="Density"
                      :items="densityOptions"
                      density="comfortable"
                      hide-details
                    />

                    <v-select
                      v-model="inlineOptions.presetMode"
                      label="Presets"
                      :items="presetModeOptions"
                      :disabled="!inlineOptions.range"
                      density="comfortable"
                      hide-details
                    />

                    <v-switch
                      v-model="inlineOptions.range"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Range mode"
                    />

                    <v-switch
                      v-model="inlineOptions.autoApply"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Auto apply"
                    />

                    <v-switch
                      v-model="inlineOptions.returnObject"
                      :disabled="!inlineOptions.range"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Return object"
                    />

                    <v-switch
                      v-model="inlineOptions.showWeekNumbers"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Week numbers"
                    />

                    <v-switch
                      v-model="inlineOptions.disabled"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Disabled"
                    />

                    <v-switch
                      v-model="inlineOptions.readonly"
                      color="primary"
                      density="comfortable"
                      hide-details
                      label="Readonly"
                    />
                  </div>

                  <div class="mt-4 text-caption text-medium-emphasis">
                    `returnObject` and presets only affect range mode, matching
                    the picker's current serialization and preset behavior.
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="preview-card" variant="flat">
                <v-card-title>Live Model Output</v-card-title>
                <v-card-subtitle>
                  Serialized values, inline config, and menu state for the
                  current playground session.
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
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}

.theme-toggle :deep(.v-btn) {
  flex: 1 1 110px;
}

.preview-column {
  position: sticky;
  top: 24px;
}

.config-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.preview-card {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.model-output {
  max-height: clamp(240px, 35vh, 420px);
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
