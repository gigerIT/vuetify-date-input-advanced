<script setup lang="ts">
import PlaygroundLabControls from './PlaygroundLabControls.vue'
import { usePlaygroundLabState } from '../composables/usePlaygroundLabState'

const {
  activeFieldOptions,
  borderOptions,
  closeDraftStrategyOptions,
  constraintModeOptions,
  customPresets,
  densityOptions,
  fieldPropsModeOptions,
  firstDayOfWeekOptions,
  hideDetailsOptions,
  iconOptions,
  inputProps,
  inputValue,
  monthNameOptions,
  monthsOptions,
  options,
  output,
  parseModeOptions,
  pickerValue,
  presetModeOptions,
  previewModeOptions,
  resetControls,
  resetValues,
  roundedOptions,
  ruleModeOptions,
  sharedPickerProps,
  themeOverrideOptions,
  variantOptions,
  yearOptions,
} = usePlaygroundLabState()
</script>

<template>
  <div class="lab-tab" data-testid="playground-tab-lab">
    <v-row class="ma-0 ga-6">
      <v-col cols="12" lg="4" class="pa-0">
        <PlaygroundLabControls
          v-model:options="options"
          :active-field-options="activeFieldOptions"
          :border-options="borderOptions"
          :close-draft-strategy-options="closeDraftStrategyOptions"
          :constraint-mode-options="constraintModeOptions"
          :density-options="densityOptions"
          :field-props-mode-options="fieldPropsModeOptions"
          :first-day-of-week-options="firstDayOfWeekOptions"
          :hide-details-options="hideDetailsOptions"
          :icon-options="iconOptions"
          :month-name-options="monthNameOptions"
          :months-options="monthsOptions"
          :parse-mode-options="parseModeOptions"
          :preset-mode-options="presetModeOptions"
          :preview-mode-options="previewModeOptions"
          :rounded-options="roundedOptions"
          :rule-mode-options="ruleModeOptions"
          :theme-override-options="themeOverrideOptions"
          :variant-options="variantOptions"
          :year-options="yearOptions"
          @reset-controls="resetControls"
          @reset-values="resetValues"
        />
      </v-col>

      <v-col cols="12" lg="8" class="pa-0">
        <div class="lab-preview-column d-flex flex-column ga-4">
          <div class="lab-preview-grid">
            <v-card
              v-if="options.previewMode !== 'picker'"
              variant="flat"
              data-testid="playground-lab-input-preview"
            >
              <v-card-title>Input preview</v-card-title>
              <v-card-subtitle>
                `VAdvancedDateInput` in its standard wrapper mode, with inline
                rendering available from the controls.
              </v-card-subtitle>
              <v-card-text>
                <v-advanced-date-input
                  v-model="inputValue"
                  v-model:text="options.draftText"
                  v-model:menu="options.menu"
                  v-bind="inputProps"
                >
                  <template
                    v-if="customPresets.length"
                    #preset-highlight="{ preset }"
                  >
                    <div class="d-flex align-center justify-space-between w-100">
                      <span>{{ preset.label }}</span>
                      <v-chip size="x-small" color="primary" variant="tonal">
                        Custom
                      </v-chip>
                    </div>
                  </template>
                </v-advanced-date-input>
              </v-card-text>
            </v-card>

            <v-card
              v-if="options.previewMode !== 'input'"
              variant="flat"
              data-testid="playground-lab-picker-preview"
            >
              <v-card-title>Bare picker preview</v-card-title>
              <v-card-subtitle>
                `VAdvancedDatePicker` fed from the same shared picker props.
              </v-card-subtitle>
              <v-card-text>
                <v-advanced-date-picker
                  v-model="pickerValue"
                  v-bind="sharedPickerProps"
                >
                  <template
                    v-if="customPresets.length"
                    #preset-highlight="{ preset }"
                  >
                    <div class="d-flex align-center justify-space-between w-100">
                      <span>{{ preset.label }}</span>
                      <v-chip size="x-small" color="secondary" variant="tonal">
                        Slot
                      </v-chip>
                    </div>
                  </template>
                </v-advanced-date-picker>
              </v-card-text>
            </v-card>
          </div>

          <v-card variant="flat" data-testid="playground-lab-output">
            <v-card-title>Live output</v-card-title>
            <v-card-subtitle>
              Current values, active modes, and the resolved playground props.
            </v-card-subtitle>
            <v-card-text>
              <pre class="lab-output text-body-2">{{ JSON.stringify(output, null, 2) }}</pre>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.lab-tab {
  display: flex;
  flex-direction: column;
}

.lab-preview-grid {
  display: grid;
  gap: 20px;
}

.lab-output {
  margin: 0;
  max-height: clamp(280px, 38vh, 440px);
  overflow: auto;
  padding: 16px;
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
