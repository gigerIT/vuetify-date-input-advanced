<script setup lang="ts">
import type {
  InlineDensity,
  InlineOptions,
  InlinePresetMode,
  SelectOption,
} from '../playgroundTypes'

defineProps<{
  monthOptions: SelectOption<number>[]
  firstDayOfWeekOptions: SelectOption<number>[]
  densityOptions: SelectOption<InlineDensity>[]
  presetModeOptions: SelectOption<InlinePresetMode>[]
  output: unknown
}>()

const options = defineModel<InlineOptions>('options', { required: true })
</script>

<template>
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
            v-model="options.months"
            label="Months"
            :items="monthOptions"
            density="comfortable"
            hide-details
          />

          <v-select
            v-model="options.firstDayOfWeek"
            label="First day of week"
            :items="firstDayOfWeekOptions"
            density="comfortable"
            hide-details
          />

          <v-select
            v-model="options.density"
            label="Density"
            :items="densityOptions"
            density="comfortable"
            hide-details
          />

          <v-select
            v-model="options.presetMode"
            label="Presets"
            :items="presetModeOptions"
            :disabled="!options.range"
            density="comfortable"
            hide-details
          />

          <v-switch
            v-model="options.range"
            color="primary"
            density="comfortable"
            hide-details
            label="Range mode"
          />

          <v-switch
            v-model="options.autoApply"
            color="primary"
            density="comfortable"
            hide-details
            label="Auto apply"
          />

          <v-switch
            v-model="options.returnObject"
            :disabled="!options.range"
            color="primary"
            density="comfortable"
            hide-details
            label="Return object"
          />

          <v-switch
            v-model="options.showWeekNumbers"
            color="primary"
            density="comfortable"
            hide-details
            label="Week numbers"
          />

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
        </div>

        <div class="mt-4 text-caption text-medium-emphasis">
          `returnObject` and presets only affect range mode, matching the
          picker's current serialization and preset behavior.
        </div>
      </v-card-text>
    </v-card>

    <v-card class="preview-card" variant="flat">
      <v-card-title>Live Model Output</v-card-title>
      <v-card-subtitle>
        Serialized values, inline config, and menu state for the current
        playground session.
      </v-card-subtitle>
      <v-card-text>
        <pre class="model-output text-body-2">{{ JSON.stringify(output, null, 2) }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
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
