<script setup lang="ts">
import PlaygroundShowcase from './components/PlaygroundShowcase.vue'
import PlaygroundSidebar from './components/PlaygroundSidebar.vue'
import PlaygroundToolbar from './components/PlaygroundToolbar.vue'
import { usePlaygroundState } from './composables/usePlaygroundState'

const {
  localeOptions,
  themeModeOptions,
  monthOptions,
  presetModeOptions,
  firstDayOfWeekOptions,
  densityOptions,
  playgroundLocale,
  themeMode,
  minDate,
  maxDate,
  rangeValue,
  singleValue,
  inlineValue,
  constrainedValue,
  typedValue,
  pickerOnlyValue,
  rangeMenu,
  presetMenu,
  customPresetMenu,
  inlineOptions,
  inlineInputProps,
  customPresets,
  disableWeekends,
  allowMondays,
  allowFridays,
  output,
} = usePlaygroundState()
</script>

<template>
  <v-app>
    <v-main>
      <v-container max-width="1500">
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
            <PlaygroundToolbar
              v-model:theme-mode="themeMode"
              v-model:playground-locale="playgroundLocale"
              :theme-mode-options="themeModeOptions"
              :locale-options="localeOptions"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" lg="8">
            <PlaygroundShowcase
              v-model:inline-value="inlineValue"
              v-model:range-value="rangeValue"
              v-model:single-value="singleValue"
              v-model:constrained-value="constrainedValue"
              v-model:typed-value="typedValue"
              v-model:picker-only-value="pickerOnlyValue"
              v-model:range-menu="rangeMenu"
              v-model:preset-menu="presetMenu"
              v-model:custom-preset-menu="customPresetMenu"
              :inline-input-props="inlineInputProps"
              :custom-presets="customPresets"
              :min-date="minDate"
              :max-date="maxDate"
              :disable-weekends="disableWeekends"
              :allow-mondays="allowMondays"
              :allow-fridays="allowFridays"
            />
          </v-col>

          <v-col cols="12" lg="4">
            <PlaygroundSidebar
              v-model:options="inlineOptions"
              :month-options="monthOptions"
              :first-day-of-week-options="firstDayOfWeekOptions"
              :density-options="densityOptions"
              :preset-mode-options="presetModeOptions"
              :output="output"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
