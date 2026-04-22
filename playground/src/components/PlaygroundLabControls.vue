<script setup lang="ts">
import { computed } from 'vue'

import type {
  InlineDensity,
  PlaygroundBorderMode,
  PlaygroundConstraintMode,
  PlaygroundFieldPropsMode,
  PlaygroundHideDetailsMode,
  PlaygroundLabOptions,
  PlaygroundParseMode,
  PlaygroundPresetMode,
  PlaygroundPreviewMode,
  PlaygroundRoundedMode,
  PlaygroundRuleMode,
  PlaygroundThemeOverride,
  SelectOption,
} from '../playgroundTypes'

const props = defineProps<{
  activeFieldOptions: SelectOption<'auto' | 'start' | 'end'>[]
  borderOptions: SelectOption<PlaygroundBorderMode>[]
  closeDraftStrategyOptions: SelectOption<'revert' | 'preserve' | 'commit'>[]
  constraintModeOptions: SelectOption<PlaygroundConstraintMode>[]
  densityOptions: SelectOption<InlineDensity>[]
  fieldPropsModeOptions: SelectOption<PlaygroundFieldPropsMode>[]
  firstDayOfWeekOptions: SelectOption<number>[]
  hideDetailsOptions: SelectOption<PlaygroundHideDetailsMode>[]
  iconOptions: SelectOption<string>[]
  monthNameOptions: SelectOption<number>[]
  monthsOptions: SelectOption<number>[]
  parseModeOptions: SelectOption<PlaygroundParseMode>[]
  presetModeOptions: SelectOption<PlaygroundPresetMode>[]
  previewModeOptions: SelectOption<PlaygroundPreviewMode>[]
  roundedOptions: SelectOption<PlaygroundRoundedMode>[]
  ruleModeOptions: SelectOption<PlaygroundRuleMode>[]
  themeOverrideOptions: SelectOption<PlaygroundThemeOverride>[]
  variantOptions: SelectOption<string>[]
  yearOptions: SelectOption<number>[]
}>()

const emit = defineEmits<{
  resetControls: []
  resetValues: []
}>()

const options = defineModel<PlaygroundLabOptions>('options', { required: true })

const isRangeEnabled = computed(() => options.value.range)
const usesLockedViewport = computed(() => options.value.lockViewport)
</script>

<template>
  <div class="lab-controls d-flex flex-column ga-4">
    <v-card variant="flat">
      <v-card-text class="d-flex flex-column ga-4">
        <div>
          <div class="text-overline lab-controls__eyebrow">QA Lab</div>
          <h3 class="text-h6 font-weight-bold mb-1">Prop matrix</h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Tune the shared picker props, then layer input-only behavior on top.
          </p>
        </div>

        <div class="d-flex flex-wrap ga-3">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-tune-variant"
            @click="emit('resetControls')"
          >
            Reset controls
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-restore"
            @click="emit('resetValues')"
          >
            Reset values
          </v-btn>
        </div>

        <div>
          <div class="text-caption text-medium-emphasis mb-2">Preview mode</div>
          <v-btn-toggle
            v-model="options.previewMode"
            class="preview-toggle"
            color="primary"
            mandatory
            divided
            data-testid="playground-lab-preview-mode"
          >
            <v-btn
              v-for="item in props.previewModeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.title }}
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-card-text>
    </v-card>

    <v-expansion-panels multiple variant="accordion" :model-value="[0, 1, 2, 3]">
      <v-expansion-panel>
        <v-expansion-panel-title>Selection and flow</v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="controls-grid">
            <v-switch
              v-model="options.range"
              color="primary"
              density="comfortable"
              hide-details
              label="Range mode"
              data-testid="playground-lab-range-switch"
            />

            <v-switch
              v-model="options.inline"
              color="primary"
              density="comfortable"
              hide-details
              label="Inline input"
              data-testid="playground-lab-inline-switch"
            />

            <v-switch
              v-model="options.menu"
              :disabled="options.inline"
              color="primary"
              density="comfortable"
              hide-details
              label="Menu open"
            />

            <v-switch
              v-model="options.inputReadonly"
              color="primary"
              density="comfortable"
              hide-details
              label="Input readonly"
            />

            <v-switch
              v-model="options.focused"
              color="primary"
              density="comfortable"
              hide-details
              label="Force focused"
            />

            <v-switch
              v-model="options.clearable"
              color="primary"
              density="comfortable"
              hide-details
              label="Clearable"
            />

            <v-select
              v-model="options.activeField"
              :disabled="!isRangeEnabled"
              label="Active field"
              :items="props.activeFieldOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.closeDraftStrategy"
              label="Close strategy"
              :items="props.closeDraftStrategyOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.fieldPropsMode"
              :disabled="!isRangeEnabled"
              label="Field props"
              :items="props.fieldPropsModeOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.ruleMode"
              label="Rules"
              :items="props.ruleModeOptions"
              density="comfortable"
              hide-details
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>Calendar behavior</v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="controls-grid">
            <v-select
              v-model="options.months"
              label="Months"
              :items="props.monthsOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.presetMode"
              :disabled="!isRangeEnabled"
              label="Presets"
              :items="props.presetModeOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.firstDayOfWeek"
              label="First day of week"
              :items="props.firstDayOfWeekOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.parseMode"
              label="Parser"
              :items="props.parseModeOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.constraintMode"
              label="Constraints"
              :items="props.constraintModeOptions"
              density="comfortable"
              hide-details
            />

            <v-switch
              v-model="options.autoApply"
              color="primary"
              density="comfortable"
              hide-details
              label="Auto apply"
            />

            <v-switch
              v-model="options.showWeekNumbers"
              color="primary"
              density="comfortable"
              hide-details
              label="Week numbers"
            />

            <v-switch
              v-model="options.returnObject"
              :disabled="!isRangeEnabled"
              color="primary"
              density="comfortable"
              hide-details
              label="Return object"
            />

            <v-switch
              v-model="options.lockViewport"
              color="primary"
              density="comfortable"
              hide-details
              label="Lock month/year"
            />

            <v-select
              v-model="options.month"
              :disabled="!usesLockedViewport"
              label="Month"
              :items="props.monthNameOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.year"
              :disabled="!usesLockedViewport"
              label="Year"
              :items="props.yearOptions"
              density="comfortable"
              hide-details
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>Content and text</v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="controls-grid">
            <v-text-field
              v-model="options.label"
              label="Label"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.placeholder"
              label="Placeholder"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.title"
              label="Picker title"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.titleStartDate"
              label="Start title"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.titleEndDate"
              label="End title"
              density="comfortable"
              hide-details
            />

            <v-combobox
              v-model="options.displayFormat"
              label="Display format"
              :items="['fullDate', 'keyboardDate', 'monthAndDate']"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.rangeSeparator"
              label="Range separator"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.draftText"
              label="Draft text"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.messagesText"
              label="Messages"
              density="comfortable"
              hide-details
            />

            <v-switch
              v-model="options.forceError"
              color="primary"
              density="comfortable"
              hide-details
              label="Force error"
            />

            <v-text-field
              v-model="options.errorMessageText"
              :disabled="!options.forceError"
              label="Error message"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.hideDetails"
              label="Hide details"
              :items="props.hideDetailsOptions"
              density="comfortable"
              hide-details
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>Visual tokens</v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="controls-grid">
            <v-select
              v-model="options.variant"
              label="Variant"
              :items="props.variantOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.density"
              label="Density"
              :items="props.densityOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.themeName"
              label="Theme override"
              :items="props.themeOverrideOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.rounded"
              label="Rounded"
              :items="props.roundedOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.border"
              label="Border"
              :items="props.borderOptions"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.color"
              label="Color"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.width"
              label="Width"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.minWidth"
              label="Min width"
              density="comfortable"
              hide-details
            />

            <v-text-field
              v-model="options.maxWidth"
              label="Max width"
              density="comfortable"
              hide-details
            />

            <div class="slider-field">
              <div class="text-caption text-medium-emphasis mb-2">
                Elevation: {{ options.elevation }}
              </div>
              <v-slider
                v-model="options.elevation"
                color="primary"
                :max="24"
                :min="0"
                :step="1"
                hide-details
              />
            </div>

            <v-switch
              v-model="options.disabled"
              color="primary"
              density="comfortable"
              hide-details
              label="Disabled"
            />

            <v-switch
              v-model="options.readonly"
              color="primary"
              density="comfortable"
              hide-details
              label="Readonly"
            />

            <v-select
              v-model="options.prevIcon"
              label="Prev icon"
              :items="props.iconOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.nextIcon"
              label="Next icon"
              :items="props.iconOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.prependInnerIcon"
              label="Prepend icon"
              :items="props.iconOptions"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="options.appendInnerIcon"
              label="Append icon"
              :items="props.iconOptions"
              density="comfortable"
              hide-details
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.lab-controls {
  position: sticky;
  top: 24px;
}

.lab-controls__eyebrow {
  letter-spacing: 0.12em;
  color: rgba(var(--v-theme-primary), 0.9);
}

.preview-toggle {
  width: 100%;
}

.preview-toggle :deep(.v-btn) {
  flex: 1 1 0;
}

.controls-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.slider-field {
  grid-column: 1 / -1;
}

@media (max-width: 1279px) {
  .lab-controls {
    position: static;
  }
}
</style>
