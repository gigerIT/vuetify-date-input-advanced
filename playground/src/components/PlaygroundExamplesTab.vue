<script setup lang="ts">
import { ref } from 'vue'

import type { AdvancedDateModel } from '@gigerit/vuetify-date-input-advanced'

const today = new Date()
const weekStart = new Date(today)
const weekEnd = new Date(today)
weekEnd.setDate(today.getDate() + 6)

const singleValue = ref<AdvancedDateModel<Date>>(today)
const rangeValue = ref<AdvancedDateModel<Date>>([weekStart, weekEnd])
const presetValue = ref<AdvancedDateModel<Date>>([weekStart, weekEnd])
</script>

<template>
  <div class="examples-tab" data-testid="playground-tab-examples">
    <v-sheet border rounded="xl" class="pa-6">
      <div class="text-overline text-primary">First Impression</div>
      <h2 class="text-h5 font-weight-bold mb-2">Simple, production-like defaults</h2>
      <p class="text-body-1 text-medium-emphasis mb-0">
        These are the three baseline surfaces to sanity-check before moving into
        the exhaustive playground and the regression-focused advanced tab.
      </p>
    </v-sheet>

    <div class="examples-grid">
      <v-card variant="flat">
        <v-card-title>Single date input</v-card-title>
        <v-card-subtitle>Basic one-date flow with the default text field.</v-card-subtitle>
        <v-card-text>
          <v-advanced-date-input
            v-model="singleValue"
            label="Departure date"
            :range="false"
            :show-presets="false"
          />
        </v-card-text>
      </v-card>

      <v-card variant="flat">
        <v-card-title>Range input</v-card-title>
        <v-card-subtitle>Standard two-month range selection without presets.</v-card-subtitle>
        <v-card-text>
          <v-advanced-date-input
            v-model="rangeValue"
            label="Travel dates"
            :months="2"
            :show-presets="false"
          />
        </v-card-text>
      </v-card>

      <v-card variant="flat">
        <v-card-title>Range input with built-in presets</v-card-title>
        <v-card-subtitle>Default quick ranges for a common booking flow.</v-card-subtitle>
        <v-card-text>
          <v-advanced-date-input
            v-model="presetValue"
            label="Travel dates"
            :months="2"
            show-presets
          />
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.examples-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.examples-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}
</style>
