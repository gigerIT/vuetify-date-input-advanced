<template>
  <v-app>
    <v-main>
      <v-container class="py-8">
        <h1 class="text-h4 mb-6">vuetify-date-input-advanced Playground</h1>

        <!-- Basic Date Range -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Date Range Picker (2 months, with presets)</h2>
          <VAdvancedDateInput
            v-model="dateRange"
            :months="2"
            show-presets
            label="Select date range"
            variant="outlined"
          />
          <pre class="mt-4 text-caption">v-model: {{ dateRange }}</pre>
        </v-card>

        <!-- Single Date -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Single Date Picker</h2>
          <VAdvancedDateInput
            v-model="singleDate"
            :range="false"
            :months="1"
            :show-presets="false"
            label="Select a date"
            variant="outlined"
          />
          <pre class="mt-4 text-caption">v-model: {{ singleDate }}</pre>
        </v-card>

        <!-- With Confirm -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Date Range with Confirm (auto-apply=false)</h2>
          <VAdvancedDateInput
            v-model="confirmRange"
            :months="2"
            :auto-apply="false"
            label="Select range (confirm required)"
            variant="outlined"
          />
          <pre class="mt-4 text-caption">v-model: {{ confirmRange }}</pre>
        </v-card>

        <!-- Fullscreen forced -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Fullscreen (forced)</h2>
          <VAdvancedDateInput
            v-model="fullscreenRange"
            :months="1"
            :fullscreen="true"
            label="Fullscreen date range"
            variant="outlined"
          />
          <pre class="mt-4 text-caption">v-model: {{ fullscreenRange }}</pre>
        </v-card>

        <!-- Hide Year Menu -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Hidden Year Menu</h2>
          <VAdvancedDateInput
            v-model="noYearRange"
            :months="2"
            :hide-year-menu="true"
            label="No year dropdown"
            variant="outlined"
          />
          <pre class="mt-4 text-caption">v-model: {{ noYearRange }}</pre>
        </v-card>

        <!-- Inline Picker -->
        <v-card class="mb-6 pa-6">
          <h2 class="text-h6 mb-4">Inline Picker (no popup)</h2>
          <VAdvancedDateInput
            v-model="inlineRange"
            :months="2"
            :inline="true"
            show-presets
          />
          <pre class="mt-4 text-caption">v-model: {{ inlineRange }}</pre>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DateModelValue } from '../src'

const dateRange = ref<DateModelValue>(null)
const singleDate = ref<DateModelValue>(null)
const confirmRange = ref<DateModelValue>(null)
const fullscreenRange = ref<DateModelValue>(null)
const noYearRange = ref<DateModelValue>(null)
const inlineRange = ref<DateModelValue>(null)
</script>
